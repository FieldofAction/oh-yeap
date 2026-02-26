import { useRef, useEffect } from "react";
import {
  WebGLRenderer, Scene, OrthographicCamera, Clock,
  PlaneGeometry, ShaderMaterial, Mesh, Color,
} from "three";

/* ── GLSL simplex noise ── */
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

/* ── Shader ── */
const VERT = `
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const FRAG = `
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

  // Three color centers, very slow orbits
  vec2 p1=vec2(0.3+sin(uTime*0.04)*0.2, 0.4+cos(uTime*0.03)*0.15);
  vec2 p2=vec2(0.7+cos(uTime*0.035)*0.18, 0.6+sin(uTime*0.045)*0.2);
  vec2 p3=vec2(0.5+sin(uTime*0.025+1.5)*0.22, 0.35+cos(uTime*0.038+0.8)*0.18);

  // Soft radial influence
  float d1=1.0-smoothstep(0.0,0.65,length(uv-p1));
  float d2=1.0-smoothstep(0.0,0.6,length(uv-p2));
  float d3=1.0-smoothstep(0.0,0.55,length(uv-p3));

  // Blend over background
  vec3 col=uBg;
  col=mix(col,uC1,d1*0.7);
  col=mix(col,uC2,d2*0.5);
  col=mix(col,uC3,d3*0.35);

  // Film grain to prevent banding
  float grain=snoise(uv*400.0+uTime)*0.006;

  gl_FragColor=vec4(col+grain,uOpacity);
}`;

/* ── Component ── */
export default function HeroBg({ theme }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w === 0 || h === 0) return;

    const thm = theme || { ac1: "#3B4A3F", ac2: "#FF5F1F", fm: "#8A867E", bg: "#F7F5F0" };

    // Renderer
    const renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Ortho camera (full-screen quad)
    const cam = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    cam.position.z = 1;

    // Scene — single full-screen quad
    const scene = new Scene();
    const geo = new PlaneGeometry(2, 2);
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uC1: { value: new Color(thm.ac1) },
        uC2: { value: new Color(thm.ac2) },
        uC3: { value: new Color(thm.fm) },
        uBg: { value: new Color(thm.bg) },
        uOpacity: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
    });
    scene.add(new Mesh(geo, mat));

    const clock = new Clock();
    let scrollRatio = 0;
    let animId = null;

    stateRef.current = { renderer, cam, scene, mat, geo };

    // Scroll
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      scrollRatio = Math.max(0, Math.min(1, -rect.top / rect.height));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Resize
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const rw = el.clientWidth;
        const rh = el.clientHeight;
        if (rw === 0 || rh === 0) return;
        renderer.setSize(rw, rh);
      }, 150);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    // Visibility
    const onVis = () => { document.hidden ? clock.stop() : clock.start(); };
    document.addEventListener("visibilitychange", onVis);

    // Animate
    function animate() {
      const t = clock.getElapsedTime();
      const fade = 1 - scrollRatio * 0.7;

      mat.uniforms.uTime.value = t;
      mat.uniforms.uOpacity.value = fade;

      renderer.render(scene, cam);
      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      stateRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme update (no remount)
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !theme) return;
    s.mat.uniforms.uC1.value.set(theme.ac1);
    s.mat.uniforms.uC2.value.set(theme.ac2);
    s.mat.uniforms.uC3.value.set(theme.fm);
    s.mat.uniforms.uBg.value.set(theme.bg);
  }, [theme]);

  return <div ref={containerRef} className="hbg" />;
}
