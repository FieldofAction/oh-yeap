import { useRef, useEffect } from "react";
import {
  WebGLRenderer, Scene, OrthographicCamera, PerspectiveCamera, Clock,
  PlaneGeometry, TorusGeometry, BoxGeometry, Group,
  ShaderMaterial, Mesh, Color,
  WebGLRenderTarget, AdditiveBlending, NormalBlending,
  DoubleSide, AmbientLight, DirectionalLight,
} from "three";

/* ── Shared GLSL noise ── */
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x/289.0)*289.0;}
vec2 mod289(vec2 x){return x-floor(x/289.0)*289.0;}
vec3 permute(vec3 x){return mod289((x*34.0+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1;i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}`;

/* ── Constants ── */
const MODE_COUNT = 3;
const CYCLE_MS = 9000;
const FADE_MS = 1800;

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hexToGL(hex) {
  const c = new Color(hex);
  return c;
}

const SYMBOL_COUNT = 3;
const SYMBOL_CYCLE_MS = 12000;
const SYMBOL_FADE_MS = 2200;

/* ── Shader sources ── */

// --- Form mode ---
const FORM_VERT = `
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const FORM_FRAG = `
${NOISE}
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uBlobby;
varying vec2 vUv;
void main(){
  vec2 c=vUv-0.5;
  float d=length(c)*2.0;
  if(uBlobby>0.5){
    float n=snoise(c*3.0+uTime*0.2)*0.25;
    d+=n;
  }
  float a=1.0-smoothstep(0.6,1.0,d);
  gl_FragColor=vec4(uColor,a*uOpacity);
}`;

// --- Glass mode ---
const GLASS_VERT = FORM_VERT;

const GLASS_FRAG = `
${NOISE}
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uRefract;
varying vec2 vUv;
void main(){
  vec2 uv=vUv;
  float n1=snoise(uv*3.0+uTime*0.15);
  float n2=snoise(uv*4.0-uTime*0.1);
  vec2 distort=vec2(n1,n2)*uRefract;
  vec2 ruv=uv+distort;
  float frost=0.0;
  frost+=snoise(ruv*8.0+uTime*0.05)*0.5;
  frost+=snoise(ruv*16.0-uTime*0.08)*0.25;
  frost+=snoise(ruv*32.0+uTime*0.03)*0.125;
  float rOff=frost*0.01;
  vec3 col=vec3(uColor.r+rOff,uColor.g,uColor.b-rOff*0.5);
  float ef=smoothstep(0.0,0.2,vUv.x)*smoothstep(0.0,0.2,vUv.y)*smoothstep(0.0,0.2,1.0-vUv.x)*smoothstep(0.0,0.2,1.0-vUv.y);
  float a=(uOpacity+frost*0.015)*ef;
  gl_FragColor=vec4(col,a);
}`;

// --- Gradient mode ---
const GRAD_VERT = FORM_VERT;

const GRAD_FRAG = `
${NOISE}
uniform float uTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uBg;
uniform float uOpacity;
varying vec2 vUv;
void main(){
  vec2 uv=vUv;
  vec2 p1=vec2(0.3+sin(uTime*0.12)*0.25,0.4+cos(uTime*0.09)*0.2);
  vec2 p2=vec2(0.7+cos(uTime*0.1)*0.2,0.6+sin(uTime*0.14)*0.25);
  vec2 p3=vec2(0.5+sin(uTime*0.08+1.5)*0.3,0.3+cos(uTime*0.11+0.8)*0.25);
  float d1=1.0-smoothstep(0.0,0.6,length(uv-p1));
  float d2=1.0-smoothstep(0.0,0.55,length(uv-p2));
  float d3=1.0-smoothstep(0.0,0.5,length(uv-p3));
  vec3 col=uBg;
  col=mix(col,uC1,d1*0.85);
  col=mix(col,uC2,d2*0.65);
  col=mix(col,uC3,d3*0.5);
  float grain=snoise(uv*400.0+uTime)*0.008;
  gl_FragColor=vec4(col+grain,uOpacity);
}`;

// --- Compositor ---
const COMP_VERT = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;

const COMP_FRAG = `
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uMix;
varying vec2 vUv;
void main(){
  vec4 a=texture2D(uTexA,vUv);
  vec4 b=texture2D(uTexB,vUv);
  gl_FragColor=mix(a,b,uMix);
}`;

/* ── Build scenes ── */

function buildFormScene(theme) {
  const scene = new Scene();
  const shapes = [];
  const configs = [
    { s: 1.8, x: -0.6, y: 0.3, blob: false, cKey: "ac1", op: 0.22, spd: 0.12 },
    { s: 2.2, x: 0.5, y: -0.2, blob: true, cKey: "ac1", op: 0.18, spd: 0.09 },
    { s: 1.4, x: -0.3, y: -0.5, blob: false, cKey: "ac2", op: 0.12, spd: 0.15 },
    { s: 2.6, x: 0.2, y: 0.5, blob: true, cKey: "ac1", op: 0.16, spd: 0.07 },
    { s: 1.6, x: 0.7, y: 0.4, blob: false, cKey: "fm", op: 0.14, spd: 0.11 },
    { s: 2.0, x: -0.7, y: -0.1, blob: true, cKey: "ac2", op: 0.10, spd: 0.08 },
    { s: 1.2, x: 0.0, y: -0.6, blob: false, cKey: "fm", op: 0.16, spd: 0.13 },
    { s: 1.9, x: -0.4, y: 0.6, blob: true, cKey: "ac1", op: 0.14, spd: 0.1 },
  ];
  const geo = new PlaneGeometry(1, 1, 1, 1);
  configs.forEach((cfg) => {
    const mat = new ShaderMaterial({
      vertexShader: FORM_VERT,
      fragmentShader: FORM_FRAG,
      uniforms: {
        uColor: { value: hexToGL(theme[cfg.cKey] || "#3B4A3F") },
        uOpacity: { value: cfg.op },
        uTime: { value: 0 },
        uBlobby: { value: cfg.blob ? 1.0 : 0.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
    });
    mat.userData._baseOpacity = cfg.op;
    const mesh = new Mesh(geo, mat);
    mesh.scale.set(cfg.s, cfg.s, 1);
    mesh.position.set(cfg.x, cfg.y, 0);
    mesh.userData = { baseX: cfg.x, baseY: cfg.y, spd: cfg.spd, phase: Math.random() * Math.PI * 2 };
    scene.add(mesh);
    shapes.push(mesh);
  });
  return { scene, shapes, geo };
}

function buildGlassScene(theme) {
  const scene = new Scene();
  const planes = [];
  const configs = [
    { s: [2.4, 1.8], x: -0.3, y: 0.2, cKey: "ac1", op: 0.15, ref: 0.025, rot: 0.1 },
    { s: [2.0, 2.2], x: 0.3, y: -0.1, cKey: "ac2", op: 0.10, ref: 0.02, rot: -0.08 },
    { s: [2.6, 1.6], x: 0.0, y: -0.3, cKey: "fm", op: 0.12, ref: 0.03, rot: 0.06 },
    { s: [1.8, 2.4], x: -0.2, y: 0.4, cKey: "ac1", op: 0.08, ref: 0.02, rot: -0.12 },
  ];
  const geo = new PlaneGeometry(1, 1, 1, 1);
  configs.forEach((cfg) => {
    const mat = new ShaderMaterial({
      vertexShader: GLASS_VERT,
      fragmentShader: GLASS_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: hexToGL(theme[cfg.cKey] || "#3B4A3F") },
        uOpacity: { value: cfg.op },
        uRefract: { value: cfg.ref },
      },
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
    });
    mat.userData._baseOpacity = cfg.op;
    const mesh = new Mesh(geo, mat);
    mesh.scale.set(cfg.s[0], cfg.s[1], 1);
    mesh.position.set(cfg.x, cfg.y, 0);
    mesh.userData = { baseX: cfg.x, baseY: cfg.y, rotSpd: cfg.rot, phase: Math.random() * Math.PI * 2 };
    scene.add(mesh);
    planes.push(mesh);
  });
  return { scene, planes, geo };
}

function buildGradientScene(theme) {
  const scene = new Scene();
  const geo = new PlaneGeometry(2, 2, 1, 1);
  const mat = new ShaderMaterial({
    vertexShader: GRAD_VERT,
    fragmentShader: GRAD_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uC1: { value: hexToGL(theme.ac1 || "#3B4A3F") },
      uC2: { value: hexToGL(theme.ac2 || "#FF5F1F") },
      uC3: { value: hexToGL(theme.fm || "#8A867E") },
      uBg: { value: hexToGL(theme.bg || "#F7F5F0") },
      uOpacity: { value: 0.35 },
    },
    transparent: true,
    depthWrite: false,
  });
  const mesh = new Mesh(geo, mat);
  scene.add(mesh);
  return { scene, quad: mesh, geo };
}

/* ── 3D Symbol glass shader ── */
const SYM_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
void main(){
  vec4 mvPos=modelViewMatrix*vec4(position,1.0);
  vNormal=normalize(normalMatrix*normal);
  vViewDir=normalize(-mvPos.xyz);
  gl_Position=projectionMatrix*mvPos;
}`;

const SYM_FRAG = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;
void main(){
  float fresnel=1.0-abs(dot(vNormal,vViewDir));
  fresnel=pow(fresnel,2.5);
  float rim=fresnel*0.85+0.15;
  float shimmer=sin(vNormal.x*8.0+uTime*0.5)*0.03+sin(vNormal.y*6.0-uTime*0.3)*0.02;
  vec3 col=uColor+shimmer;
  float a=rim*uOpacity;
  gl_FragColor=vec4(col,a);
}`;

function makeGlassMat(color, opacity) {
  const mat = new ShaderMaterial({
    vertexShader: SYM_VERT,
    fragmentShader: SYM_FRAG,
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  mat.userData._baseOpacity = opacity; // store original for crossfading
  return mat;
}

/* ── Symbol builders ── */

// Symbol 1: Armillary sphere — interlocking rings
function buildArmillary(color) {
  const g = new Group();
  const tubeR = 0.025;
  const configs = [
    { r: 1.0, rx: 0, ry: 0, rz: 0 },
    { r: 1.0, rx: Math.PI / 2, ry: 0, rz: 0 },
    { r: 1.0, rx: 0, ry: 0, rz: Math.PI / 2 },
    { r: 0.85, rx: Math.PI / 4, ry: Math.PI / 4, rz: 0 },
    { r: 0.85, rx: -Math.PI / 4, ry: Math.PI / 4, rz: 0 },
    { r: 0.7, rx: Math.PI / 3, ry: 0, rz: Math.PI / 6 },
  ];
  configs.forEach((c) => {
    const geo = new TorusGeometry(c.r, tubeR, 16, 64);
    const mat = makeGlassMat(color, 0.12);
    const mesh = new Mesh(geo, mat);
    mesh.rotation.set(c.rx, c.ry, c.rz);
    g.add(mesh);
  });
  return g;
}

// Symbol 2: Seed geometry — intersecting elliptical rings (vesica piscis pattern)
function buildSeedGeometry(color) {
  const g = new Group();
  const tubeR = 0.02;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI;
    const geo = new TorusGeometry(0.9, tubeR, 16, 64);
    const mat = makeGlassMat(color, 0.1);
    const mesh = new Mesh(geo, mat);
    mesh.rotation.set(Math.PI / 2, 0, angle);
    mesh.position.set(Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, 0);
    g.add(mesh);
  }
  // Add an outer ring
  const outerGeo = new TorusGeometry(1.05, tubeR * 0.8, 16, 64);
  const outerMat = makeGlassMat(color, 0.08);
  const outer = new Mesh(outerGeo, outerMat);
  g.add(outer);
  return g;
}

// Symbol 3: Bisected circle — circle with horizontal line (theta)
function buildTheta(color) {
  const g = new Group();
  // Main ring
  const ringGeo = new TorusGeometry(1.0, 0.03, 16, 64);
  const ringMat = makeGlassMat(color, 0.14);
  g.add(new Mesh(ringGeo, ringMat));
  // Horizontal bar
  const barGeo = new BoxGeometry(2.0, 0.04, 0.04);
  const barMat = makeGlassMat(color, 0.12);
  g.add(new Mesh(barGeo, barMat));
  // Subtle inner ring
  const innerGeo = new TorusGeometry(0.65, 0.015, 16, 64);
  const innerMat = makeGlassMat(color, 0.06);
  g.add(new Mesh(innerGeo, innerMat));
  return g;
}

function buildSymbolScene(theme) {
  const scene = new Scene();
  // Soft ambient + directional for specular hints
  scene.add(new AmbientLight(0xffffff, 0.4));
  const dir = new DirectionalLight(0xffffff, 0.6);
  dir.position.set(2, 3, 4);
  scene.add(dir);

  const color = hexToGL(theme.ac1 || "#3B4A3F");
  const symbols = [
    buildArmillary(color),
    buildSeedGeometry(color),
    buildTheta(color),
  ];

  // All symbols start hidden except the first
  symbols.forEach((s, i) => {
    s.visible = i === 0;
    s.scale.setScalar(0.65);
    scene.add(s);
  });

  return { scene, symbols };
}

function buildCompositor() {
  const scene = new Scene();
  const geo = new PlaneGeometry(2, 2, 1, 1);
  const mat = new ShaderMaterial({
    vertexShader: COMP_VERT,
    fragmentShader: COMP_FRAG,
    uniforms: {
      uTexA: { value: null },
      uTexB: { value: null },
      uMix: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
  });
  const mesh = new Mesh(geo, mat);
  scene.add(mesh);
  return { scene, mat, geo };
}

/* ── Main component ── */

export default function HeroBg({ theme }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);

  // Mount: set up Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reduced motion check
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const aspect = w / h;

    // Renderer
    const renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Ortho camera sized to [-aspect, aspect] x [-1, 1]
    const cam = new OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
    cam.position.z = 1;

    // Build mode scenes
    const thm = theme || { ac1: "#3B4A3F", ac2: "#FF5F1F", fm: "#8A867E", bg: "#F7F5F0" };
    const form = buildFormScene(thm);
    const glass = buildGlassScene(thm);
    const grad = buildGradientScene(thm);
    const scenes = [form.scene, glass.scene, grad.scene];

    // Build symbol overlay scene with perspective camera
    const symData = buildSymbolScene(thm);
    const symCam = new PerspectiveCamera(40, aspect, 0.1, 50);
    symCam.position.set(0, 0, 4.5);

    // Render targets for crossfade
    const rtA = new WebGLRenderTarget(w, h);
    const rtB = new WebGLRenderTarget(w, h);
    const comp = buildCompositor();

    const clock = new Clock();
    let currentMode = 0;
    let nextMode = 1;
    let fading = false;
    let fadeProgress = 0;
    let scrollRatio = 0;
    let animId = null;
    let baseCamY = 0;

    // Symbol overlay state
    let currentSymbol = 0;
    let nextSymbol = 1;
    let symFading = false;
    let symFadeProgress = 0;
    // Opacity per symbol for crossfading
    let symOpacities = [1, 0, 0];

    const state = {
      renderer, cam, symCam, scenes, form, glass, grad, comp, rtA, rtB, clock,
      symData,
      get currentMode() { return currentMode; },
      get scrollRatio() { return scrollRatio; },
    };
    stateRef.current = state;

    // --- Background mode cycle timer ---
    const cycleTimer = setInterval(() => {
      if (fading) return;
      nextMode = (currentMode + 1) % MODE_COUNT;
      fading = true;
      fadeProgress = 0;
    }, CYCLE_MS);

    // --- Symbol cycle timer ---
    const symTimer = setInterval(() => {
      if (symFading) return;
      nextSymbol = (currentSymbol + 1) % SYMBOL_COUNT;
      symData.symbols[nextSymbol].visible = true;
      symFading = true;
      symFadeProgress = 0;
    }, SYMBOL_CYCLE_MS);

    // --- Scroll ---
    const onScroll = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const heroH = rect.height;
      const scrolled = -rect.top;
      scrollRatio = Math.max(0, Math.min(1, scrolled / heroH));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // --- Resize ---
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const rw = container.clientWidth;
        const rh = container.clientHeight;
        if (rw === 0 || rh === 0) return;
        const ra = rw / rh;
        renderer.setSize(rw, rh);
        cam.left = -ra; cam.right = ra; cam.top = 1; cam.bottom = -1;
        cam.updateProjectionMatrix();
        symCam.aspect = ra;
        symCam.updateProjectionMatrix();
        rtA.setSize(rw, rh);
        rtB.setSize(rw, rh);
      }, 150);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // --- Visibility ---
    const onVis = () => {
      if (document.hidden) clock.stop(); else clock.start();
    };
    document.addEventListener("visibilitychange", onVis);

    // --- Animate ---
    function animate() {
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();
      const scrollFade = 1 - scrollRatio * 0.7;

      // Update form shapes
      form.shapes.forEach((m) => {
        const u = m.userData;
        m.position.x = u.baseX + Math.sin(t * u.spd + u.phase) * 0.15;
        m.position.y = u.baseY + Math.cos(t * u.spd * 0.8 + u.phase) * 0.12;
        if (!u._baseScale) u._baseScale = m.scale.x;
        const breathe = 1 + Math.sin(t * u.spd * 0.5 + u.phase) * 0.06;
        m.scale.setScalar(u._baseScale * breathe);
        m.material.uniforms.uTime.value = t;
        m.material.uniforms.uOpacity.value = m.material.userData._baseOpacity * scrollFade;
      });

      // Update glass planes
      glass.planes.forEach((m) => {
        const u = m.userData;
        m.position.x = u.baseX + Math.sin(t * 0.06 + u.phase) * 0.08;
        m.position.y = u.baseY + Math.cos(t * 0.05 + u.phase) * 0.06;
        m.rotation.z = Math.sin(t * 0.04 + u.phase) * u.rotSpd;
        m.material.uniforms.uTime.value = t;
        m.material.uniforms.uOpacity.value = m.material.userData._baseOpacity * scrollFade;
      });

      // Update gradient
      grad.quad.material.uniforms.uTime.value = t;
      grad.quad.material.uniforms.uOpacity.value = 0.35 * scrollFade;

      // Scroll parallax on camera
      cam.position.y = baseCamY + scrollRatio * 0.15;

      // --- Update symbol overlay ---
      // Slow rotation for all symbols
      symData.symbols.forEach((sym) => {
        sym.rotation.y = t * 0.15;
        sym.rotation.x = Math.sin(t * 0.08) * 0.2;
        // Update glass shader time uniforms
        sym.traverse((child) => {
          if (child.material?.uniforms?.uTime) child.material.uniforms.uTime.value = t;
        });
      });

      // Symbol crossfade — use stored _baseOpacity from material creation
      const setSymOpacity = (sym, mult) => {
        sym.traverse((c) => {
          if (c.material?.uniforms?.uOpacity && c.material.userData._baseOpacity != null) {
            c.material.uniforms.uOpacity.value = c.material.userData._baseOpacity * mult * scrollFade;
          }
        });
      };

      if (symFading) {
        symFadeProgress += dt / (SYMBOL_FADE_MS / 1000);
        if (symFadeProgress >= 1) {
          symFadeProgress = 1;
          symFading = false;
          symData.symbols[currentSymbol].visible = false;
          currentSymbol = nextSymbol;
        }
        const e = easeInOut(symFadeProgress);
        setSymOpacity(symData.symbols[currentSymbol], 1 - e);
        setSymOpacity(symData.symbols[nextSymbol], e);
      } else {
        setSymOpacity(symData.symbols[currentSymbol], 1);
      }

      // --- Render ---
      // 1) Render background mode
      if (fading) {
        fadeProgress += dt / (FADE_MS / 1000);
        if (fadeProgress >= 1) {
          fadeProgress = 1;
          fading = false;
          currentMode = nextMode;
        }
        renderer.setRenderTarget(rtA);
        renderer.clear();
        renderer.render(scenes[currentMode], cam);
        renderer.setRenderTarget(rtB);
        renderer.clear();
        renderer.render(scenes[nextMode], cam);
        renderer.setRenderTarget(null);
        comp.mat.uniforms.uTexA.value = rtA.texture;
        comp.mat.uniforms.uTexB.value = rtB.texture;
        comp.mat.uniforms.uMix.value = easeInOut(fadeProgress);
        renderer.render(comp.scene, cam);
      } else {
        renderer.render(scenes[currentMode], cam);
      }

      // 2) Render 3D symbol overlay on top (autoClear off to preserve background)
      renderer.autoClear = false;
      renderer.render(symData.scene, symCam);
      renderer.autoClear = true;

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(cycleTimer);
      clearInterval(symTimer);
      clearTimeout(resizeTimer);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);

      // Dispose geometries and materials
      [form, glass, grad].forEach((m) => {
        m.scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      });
      symData.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      comp.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      rtA.dispose();
      rtB.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      stateRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme color update (no remount)
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !theme) return;

    const ac1 = new Color(theme.ac1);
    const ac2 = new Color(theme.ac2);
    const fm = new Color(theme.fm);
    const bg = new Color(theme.bg);

    // Form shapes
    const formColors = [ac1, ac1, ac2, ac1, fm, ac2, fm, ac1.clone().lerp(bg, 0.3)];
    s.form.shapes.forEach((m, i) => {
      m.material.uniforms.uColor.value.copy(formColors[i % formColors.length]);
    });

    // Glass planes
    const glassColors = [ac1, ac2, fm, ac1.clone().lerp(ac2, 0.5)];
    s.glass.planes.forEach((m, i) => {
      m.material.uniforms.uColor.value.copy(glassColors[i % glassColors.length]);
    });

    // Gradient
    s.grad.quad.material.uniforms.uC1.value.copy(ac1);
    s.grad.quad.material.uniforms.uC2.value.copy(ac2);
    s.grad.quad.material.uniforms.uC3.value.copy(fm);
    s.grad.quad.material.uniforms.uBg.value.copy(bg);

    // Symbol overlay — update glass color
    s.symData.symbols.forEach((sym) => {
      sym.traverse((child) => {
        if (child.material?.uniforms?.uColor) {
          child.material.uniforms.uColor.value.copy(ac1);
        }
      });
    });
  }, [theme]);

  return <div ref={containerRef} className="hbg" />;
}
