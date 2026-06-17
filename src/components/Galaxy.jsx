import React, { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────
   Galaxy Instrument — generative spiral-galaxy plotter.
   Ported from a standalone canvas tool; restyled to site tokens.
   Generative + render + export logic preserved verbatim.
   ────────────────────────────────────────────────────────────── */

// ---------- RNG ----------
function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function makeRng(seed){const r=mulberry32(seed>>>0);return{next:r,range:(lo,hi)=>lo+(hi-lo)*r(),gauss:()=>{let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}};}

// ---------- Defaults / config ----------
const DEF_TL = 'SPIRAL GALAXY — log. spiral model\nSEED {seed}';
const DEF_BR = 'STARS {stars}\nTILT {tilt}° · SPIN {spin}°';
function makeDefaults(){
  return {
    seed: 100482, scale: 350, arms: 4, b: -0.20, turns: 2.7, fuzz: 0.020,
    armDensity: 2200, coreSize: 0.075, coreDensity: 6000, haze: 4000, dust: 2200, bg: 1400,
    tilt: 38, spin: 45, starSize: 1.0, glow: 0.6, zoom: 1.0, radius: 350,
    motion: 8, dur: 8, bgDrift: -1,
    showText: true, txtTL: DEF_TL, txtBR: DEF_BR,
    cBg: '#000000', cStar: '#ffffff', cDust: '#b9bcc4',
  };
}
const GEN_KEYS = new Set(['scale','arms','b','turns','fuzz','armDensity','coreSize','coreDensity','haze','dust','bg']);
const FMT = { int:v=>Math.round(v).toLocaleString(), f1:v=>v.toFixed(1), f2:v=>v.toFixed(2), f3:v=>v.toFixed(3) };

const GROUPS = [
  { label:"Structure", controls:[
    { c:"radius", min:200, max:700, step:5, fmt:"int", unit:" px", name:"Disc radius" },
    { c:"arms", min:2, max:8, step:1, fmt:"int", name:"Arms" },
    { c:"b", min:-0.45, max:-0.08, step:0.005, fmt:"f2", name:"Arm sweep" },
    { c:"turns", min:1.5, max:4.5, step:0.1, fmt:"f1", unit:" turns", name:"Windings" },
    { c:"fuzz", min:0, max:0.06, step:0.002, fmt:"f3", name:"Scatter" },
  ]},
  { label:"Population", controls:[
    { c:"armDensity", min:500, max:6000, step:100, fmt:"int", name:"Arm density" },
    { c:"coreSize", min:0.02, max:0.16, step:0.005, fmt:"f3", name:"Core size" },
    { c:"coreDensity", min:1000, max:12000, step:200, fmt:"int", name:"Core density" },
    { c:"haze", min:0, max:10000, step:200, fmt:"int", name:"Haze" },
    { c:"dust", min:0, max:6000, step:100, fmt:"int", name:"Dust belt" },
    { c:"bg", min:0, max:4000, step:100, fmt:"int", name:"Background" },
  ]},
  { label:"View", controls:[
    { c:"tilt", min:8, max:90, step:1, fmt:"int", unit:"°", name:"Tilt" },
    { c:"spin", min:0, max:360, step:1, fmt:"int", unit:"°", name:"Spin" },
    { c:"zoom", min:0.3, max:2.5, step:0.05, fmt:"f2", unit:"×", name:"Frame zoom" },
    { c:"starSize", min:0.4, max:2.4, step:0.1, fmt:"f1", name:"Star size" },
    { c:"glow", min:0.2, max:1, step:0.05, fmt:"f2", name:"Glow" },
  ]},
];
const MOTION_SLIDERS = [
  { c:"motion", min:0, max:60, step:1, fmt:"int", unit:"°/s", name:"Spin rate" },
  { c:"bgDrift", min:-2, max:2, step:1, fmt:"int", unit:"×", name:"Field drift" },
  { c:"dur", min:2, max:16, step:1, fmt:"int", unit:" s", name:"Loop length" },
];

// ---------- Generation ----------
function generate(p){
  const rng = makeRng(p.seed);
  const o = { arm:[], core:[], haze:[], dust:[], bg:[] };
  const scale = p.scale;
  const thetaMax = Math.PI*2*p.turns;
  for(let a=0;a<p.arms;a++){
    const rot=(a/p.arms)*Math.PI*2;
    for(let layer=0;layer<2;layer++){
      const leading=layer===0;
      const lrot=rot+(leading?0:0.35);
      const n=leading?p.armDensity:Math.floor(p.armDensity*0.6);
      for(let i=0;i<n;i++){
        const theta=(i/n)*thetaMax;
        const rt=scale*Math.exp(p.b*theta);
        const fz=p.fuzz*scale*(0.25+0.75*(rt/scale));
        const x=rt*Math.cos(theta+lrot)+rng.range(-fz,fz);
        const y=rt*Math.sin(theta+lrot)+rng.range(-fz,fz);
        const z=rng.range(-1,1)*scale*0.02;
        o.arm.push([x,y,z,leading?1:0]);
      }
    }
  }
  const coreR=scale*p.coreSize;
  [[p.coreDensity,coreR],[Math.floor(p.coreDensity/3),coreR/2.5]].forEach(([n,r])=>{
    for(let i=0;i<n;i++){o.core.push([rng.gauss()*r,rng.gauss()*r,rng.gauss()*r*0.08]);}
  });
  for(let i=0;i<p.haze;i++){const nn=rng.next(),th=rng.range(0,Math.PI*2),rr=Math.sqrt(nn)*scale;o.haze.push([rr*Math.cos(th),rr*Math.sin(th),rng.range(-1,1)*scale*0.015]);}
  for(let i=0;i<p.dust;i++){const nn=rng.next(),th=rng.range(0,Math.PI*2),rr=(0.42+0.66*Math.sqrt(nn))*scale;o.dust.push([rr*Math.cos(th),rr*Math.sin(th),rng.range(-1,1)*scale*0.02]);}
  for(let i=0;i<p.bg;i++){const rr=1.5*Math.sqrt(rng.next()),th=rng.range(0,Math.PI*2);o.bg.push([rr*Math.cos(th),rr*Math.sin(th),rng.range(0.3,1)]);}
  return o;
}

function project(x,y,z,az,tilt){
  const ca=Math.cos(az),sa=Math.sin(az);
  const rx=x*ca-y*sa, ry=x*sa+y*ca;
  const st=Math.sin(tilt),ct=Math.cos(tilt);
  return [rx, ry*st - z*ct];
}

function tierStyle(p){
  return [
    { key:'bg',   alpha:0.55, size:0.7,  color:p.cStar, screen:true },
    { key:'dust', alpha:0.30, size:0.85, color:p.cDust },
    { key:'haze', alpha:0.22, size:0.8,  color:p.cStar },
    { key:'arm',  alpha:0.55, size:1.0,  color:p.cStar },
    { key:'core', alpha:0.40, size:0.7,  color:p.cStar },
  ];
}

function render(ctx, W, H, p, cloud, pxPerUnit, sizeScale){
  const az = p.spin*Math.PI/180;
  const tilt = p.tilt*Math.PI/180;
  const ppu = pxPerUnit * (p.zoom || 1) * ((p.radius || 350) / 350);
  const bgAng = p.spin*p.bgDrift*Math.PI/180;
  const bgCos = Math.cos(bgAng), bgSin = Math.sin(bgAng);
  const cx = W/2, cy = H/2;
  ctx.fillStyle = p.cBg;
  ctx.fillRect(0,0,W,H);

  ctx.globalCompositeOperation = 'lighter';
  const tiers = tierStyle(p);
  for(const t of tiers){
    const arr = cloud[t.key];
    ctx.fillStyle = t.color;
    const zf = t.screen ? 1 : (p.zoom || 1);
    const baseR = Math.max(0.35, t.size * p.starSize * sizeScale * zf);
    for(let i=0;i<arr.length;i++){
      const q = arr[i];
      let px, py, a = t.alpha;
      if(t.screen){
        const rx = q[0]*bgCos - q[1]*bgSin;
        const ry = q[0]*bgSin + q[1]*bgCos;
        px = cx + rx*W*0.5; py = cy + ry*H*0.5;
        a = t.alpha * q[2];
      } else {
        const s = project(q[0],q[1],q[2],az,tilt);
        px = cx + s[0]*ppu; py = cy + s[1]*ppu;
        if(t.key==='arm' && q[3]===0) a *= 0.5;
      }
      a *= p.glow*1.4;
      if(a>1) a=1;
      ctx.globalAlpha = a;
      const r = baseR;
      if(r<=0.8){ ctx.fillRect(px-r, py-r, r*2, r*2); }
      else { ctx.beginPath(); ctx.arc(px,py,r,0,6.2832); ctx.fill(); }
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  bakeText(ctx, W, H, p, cloud);
}

function tokens(str, cloud, p){
  let n=0; if(cloud) for(const k in cloud) n+=cloud[k].length;
  return str.replace(/\{seed\}/g, p.seed)
            .replace(/\{stars\}/g, n.toLocaleString())
            .replace(/\{tilt\}/g, Math.round(p.tilt))
            .replace(/\{spin\}/g, Math.round(p.spin));
}

function bakeText(ctx, W, H, p, cloud){
  if(!p.showText) return;
  const m = W*0.045;
  const fs = Math.max(9, W*0.0145);
  const lh = fs*1.7;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.font = `${fs}px "Space Mono", ui-monospace, monospace`;
  try { ctx.letterSpacing = (W*0.0015)+'px'; } catch(e){}
  ctx.fillStyle = hexAlpha(p.cStar, 0.8);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const tl = tokens(p.txtTL, cloud, p).split('\n');
  for(let i=0;i<tl.length;i++) if(tl[i].trim()) ctx.fillText(tl[i], m, m + i*lh);
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  const br = tokens(p.txtBR, cloud, p).split('\n');
  for(let i=0;i<br.length;i++){
    const line = br[br.length-1-i];
    if(line.trim()) ctx.fillText(line, W-m, H-m - i*lh);
  }
  ctx.restore();
}

function hexAlpha(hex, a){
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function downloadBlob(blob, name){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

function pickMime(){
  const cands=['video/mp4;codecs=avc1.640028','video/mp4;codecs=avc1.42E01E','video/mp4',
               'video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  if(!window.MediaRecorder) return '';
  for(const c of cands){ try{ if(MediaRecorder.isTypeSupported(c)) return c; }catch(e){} }
  return '';
}

export default function Galaxy(){
  const canvasRef = useRef(null);
  const P = useRef(makeDefaults());
  const ptsRef = useRef(null);
  const needGenRef = useRef(true);
  const dprRef = useRef(typeof window !== "undefined" ? Math.min(window.devicePixelRatio||1, 2) : 1);
  const recordingRef = useRef(false);
  const scheduleDrawRef = useRef(null);
  const startMotionRef = useRef(null);

  const valRefs = useRef({});
  const sliderRefs = useRef({});
  const seedRef = useRef(null);
  const taTLRef = useRef(null);
  const taBRRef = useRef(null);

  const [showText, setShowText] = useState(true);
  const [pngRes, setPngRes] = useState(2);
  const [vFps, setVFps] = useState(30);
  const [vSize, setVSize] = useState(1080);
  const [vidStatus, setVidStatus] = useState("");

  // ---------- imperative canvas setup ----------
  useEffect(() => {
    const cv = canvasRef.current;
    if(!cv) return;
    const ctx = cv.getContext('2d');

    function draw(){
      if(needGenRef.current || !ptsRef.current){ ptsRef.current = generate(P.current); needGenRef.current=false; }
      const W=cv.width, H=cv.height;
      const pxPerUnit = (Math.min(W,H)*0.46)/P.current.scale;
      render(ctx, W, H, P.current, ptsRef.current, pxPerUnit, dprRef.current);
    }
    let rafPending=false;
    function scheduleDraw(){ if(!rafPending){ rafPending=true; requestAnimationFrame(()=>{ rafPending=false; draw(); }); } }
    function fit(){
      const rect = cv.getBoundingClientRect();
      cv.width = Math.round(rect.width*dprRef.current);
      cv.height = Math.round(rect.height*dprRef.current);
      draw();
    }
    function syncSpin(){
      const s=sliderRefs.current.spin, v=valRefs.current.spin;
      if(s) s.value=P.current.spin;
      if(v) v.textContent=Math.round(P.current.spin)+'°';
    }

    let motionRAF=null, lastT=0;
    function tick(ts){
      if(P.current.motion>0 && !recordingRef.current){
        if(!lastT) lastT=ts;
        const dt=Math.min(0.1,(ts-lastT)/1000); lastT=ts;
        P.current.spin=(P.current.spin + P.current.motion*dt)%360;
        syncSpin(); draw();
        motionRAF=requestAnimationFrame(tick);
      } else { motionRAF=null; lastT=0; }
    }
    function startMotion(){ if(!motionRAF && P.current.motion>0 && !recordingRef.current){ lastT=0; motionRAF=requestAnimationFrame(tick); } }

    scheduleDrawRef.current = scheduleDraw;
    startMotionRef.current = startMotion;

    // drag to orbit
    let dragging=false, lastX=0, lastY=0;
    const onDown = e=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); };
    const onMove = e=>{
      if(!dragging) return;
      P.current.spin=(P.current.spin + (e.clientX-lastX)*0.5 + 360)%360;
      P.current.tilt=Math.max(8, Math.min(90, P.current.tilt - (e.clientY-lastY)*0.3));
      lastX=e.clientX; lastY=e.clientY;
      syncSpin();
      const ts=sliderRefs.current.tilt, tv=valRefs.current.tilt;
      if(ts) ts.value=P.current.tilt;
      if(tv) tv.textContent=Math.round(P.current.tilt)+'°';
      scheduleDraw();
    };
    const onUp = ()=>{ dragging=false; };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);

    const onResize = ()=>{ dprRef.current=Math.min(window.devicePixelRatio||1,2); fit(); };
    window.addEventListener('resize', onResize);

    fit();
    startMotion();

    return ()=>{
      window.removeEventListener('resize', onResize);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      if(motionRAF) cancelAnimationFrame(motionRAF);
    };
  }, []);

  // ---------- control handlers ----------
  const fmtVal = (c, fk, unit="") => (FMT[fk] ? FMT[fk](P.current[c]) : P.current[c]) + unit;

  const onSlide = (c, val, fk, unit="") => {
    P.current[c] = val;
    if(valRefs.current[c]) valRefs.current[c].textContent = (FMT[fk] ? FMT[fk](val) : val) + unit;
    if(GEN_KEYS.has(c)) needGenRef.current = true;
    if(c === 'motion') startMotionRef.current && startMotionRef.current();
    scheduleDrawRef.current && scheduleDrawRef.current();
  };

  const renderSlider = (cfg) => (
    <div className="gx-ctrl" key={cfg.c}>
      <div className="gx-ctop">
        <span className="gx-cname">{cfg.name}</span>
        <span className="gx-cval" ref={el=>{ valRefs.current[cfg.c]=el; }}>{fmtVal(cfg.c, cfg.fmt, cfg.unit)}</span>
      </div>
      <input
        className="gx-range" type="range"
        min={cfg.min} max={cfg.max} step={cfg.step}
        defaultValue={P.current[cfg.c]}
        ref={el=>{ sliderRefs.current[cfg.c]=el; }}
        onChange={e=>onSlide(cfg.c, +e.target.value, cfg.fmt, cfg.unit)}
      />
    </div>
  );

  // ---------- exports ----------
  const exportPNG = () => {
    const p = P.current;
    if(needGenRef.current || !ptsRef.current){ ptsRef.current=generate(p); needGenRef.current=false; }
    const S = 1000*pngRes;
    const oc = document.createElement('canvas'); oc.width=S; oc.height=S;
    const octx = oc.getContext('2d');
    const pxPerUnit = (S*0.46)/p.scale;
    render(octx, S, S, p, ptsRef.current, pxPerUnit, pngRes);
    oc.toBlob(blob=>downloadBlob(blob, `galaxy_${p.seed}_${pngRes}x.png`), 'image/png');
  };

  const exportSVG = () => {
    const p = P.current;
    if(needGenRef.current || !ptsRef.current){ ptsRef.current=generate(p); needGenRef.current=false; }
    const pts = ptsRef.current;
    const S = 1000;
    const az=p.spin*Math.PI/180, tilt=p.tilt*Math.PI/180;
    const bgAng=p.spin*p.bgDrift*Math.PI/180, bgCos=Math.cos(bgAng), bgSin=Math.sin(bgAng);
    const cx=S/2, cy=S/2, pxPerUnit=(S*0.46)/p.scale*(p.zoom||1)*((p.radius||350)/350);
    const tiers = tierStyle(p);
    let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">\n`;
    out += `<rect width="${S}" height="${S}" fill="${p.cBg}"/>\n`;
    for(const t of tiers){
      const arr = pts[t.key];
      const zf = t.screen ? 1 : (p.zoom||1);
      const baseR = Math.max(0.4, t.size*p.starSize*zf).toFixed(2);
      let circ = '';
      for(let i=0;i<arr.length;i++){
        const q=arr[i]; let px,py,a=t.alpha*p.glow*1.4;
        if(t.screen){
          const rx=q[0]*bgCos-q[1]*bgSin, ry=q[0]*bgSin+q[1]*bgCos;
          px=cx+rx*S*0.5; py=cy+ry*S*0.5; a=t.alpha*q[2]*p.glow*1.4;
        } else { const s=project(q[0],q[1],q[2],az,tilt); px=cx+s[0]*pxPerUnit; py=cy+s[1]*pxPerUnit;
               if(t.key==='arm'&&q[3]===0) a*=0.5; }
        if(a>1)a=1;
        if(px<-5||px>S+5||py<-5||py>S+5) continue;
        circ += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${baseR}" opacity="${a.toFixed(2)}"/>`;
      }
      out += `<g fill="${t.color}">${circ}</g>\n`;
    }
    if(p.showText){
      const m=S*0.045, fs=(S*0.0145).toFixed(1), lh=S*0.0145*1.7, ls=(S*0.0015).toFixed(2);
      const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      out += `<g font-family="'Space Mono', monospace" font-size="${fs}" letter-spacing="${ls}" fill="${p.cStar}" fill-opacity="0.8">`;
      const tl=tokens(p.txtTL, pts, p).split('\n');
      for(let i=0;i<tl.length;i++) if(tl[i].trim()) out += `<text x="${m.toFixed(1)}" y="${(m+fs*0.9+i*lh).toFixed(1)}">${esc(tl[i])}</text>`;
      const br=tokens(p.txtBR, pts, p).split('\n');
      for(let i=0;i<br.length;i++){ const line=br[br.length-1-i];
        if(line.trim()) out += `<text x="${(S-m).toFixed(1)}" y="${(S-m-i*lh).toFixed(1)}" text-anchor="end">${esc(line)}</text>`; }
      out += `</g>\n`;
    }
    out += `</svg>`;
    downloadBlob(new Blob([out],{type:'image/svg+xml'}), `galaxy_${p.seed}.svg`);
  };

  const exportVideo = () => {
    if(recordingRef.current) return;
    const mime = pickMime();
    if(!mime){ setVidStatus('Recording not supported in this browser'); return; }
    const p = P.current;
    if(needGenRef.current || !ptsRef.current){ ptsRef.current=generate(p); needGenRef.current=false; }
    const pts = ptsRef.current;
    const size=vSize, fps=vFps, dur=p.dur;
    const total=Math.round(dur*fps);
    const rc=document.createElement('canvas'); rc.width=size; rc.height=size;
    const rctx=rc.getContext('2d');
    const pxPerUnit=(size*0.46)/p.scale, sizeScale=size/1000;
    const startSpin=p.spin;

    const stream=rc.captureStream(fps);
    const track=stream.getVideoTracks()[0];
    const reqFrame=()=>{ try{ track.requestFrame && track.requestFrame(); }catch(e){} };
    const rec=new MediaRecorder(stream,{mimeType:mime, videoBitsPerSecond: Math.round(size*size*fps*0.12)});
    const chunks=[];
    rec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
    rec.onstop=()=>{
      const isMp4=mime.indexOf('mp4')>=0;
      const blob=new Blob(chunks,{type:isMp4?'video/mp4':'video/webm'});
      downloadBlob(blob, `galaxy_${p.seed}_${size}p_${fps}fps.${isMp4?'mp4':'webm'}`);
      recordingRef.current=false;
      setVidStatus(`Saved .${isMp4?'mp4':'webm'} · seamless ${dur}s loop`);
      startMotionRef.current && startMotionRef.current();
    };

    recordingRef.current=true;
    setVidStatus('● REC 0%');
    rec.start();

    let frame=0;
    function pump(){
      if(frame>=total){ reqFrame(); setTimeout(()=>rec.stop(),160); return; }
      p.spin=(startSpin + (frame/total)*360)%360;
      render(rctx,size,size,p,pts,pxPerUnit,sizeScale);
      reqFrame();
      setVidStatus('● REC '+Math.round(frame/total*100)+'%');
      if(sliderRefs.current.spin) sliderRefs.current.spin.value=p.spin;
      if(valRefs.current.spin) valRefs.current.spin.textContent=Math.round(p.spin)+'°';
      frame++;
      setTimeout(pump, 1000/fps);
    }
    pump();
  };

  // ---------- caption / seed / palette handlers ----------
  const onSeed = (e) => { const n=parseInt(e.target.value,10); if(!isNaN(n)){ P.current.seed=n; needGenRef.current=true; scheduleDrawRef.current && scheduleDrawRef.current(); } };
  const onNewSeed = () => { P.current.seed=Math.floor(Math.random()*1e6); if(seedRef.current) seedRef.current.value=P.current.seed; needGenRef.current=true; scheduleDrawRef.current && scheduleDrawRef.current(); };
  const onColor = (key) => (e) => { P.current[key]=e.target.value; scheduleDrawRef.current && scheduleDrawRef.current(); };
  const onToggleText = () => { const nv=!P.current.showText; P.current.showText=nv; setShowText(nv); scheduleDrawRef.current && scheduleDrawRef.current(); };
  const onCaption = (key, ref) => (e) => { P.current[key]=e.target.value; scheduleDrawRef.current && scheduleDrawRef.current(); };
  const onResetText = () => {
    P.current.txtTL=DEF_TL; P.current.txtBR=DEF_BR; P.current.showText=true;
    if(taTLRef.current) taTLRef.current.value=DEF_TL;
    if(taBRRef.current) taBRRef.current.value=DEF_BR;
    setShowText(true);
    scheduleDrawRef.current && scheduleDrawRef.current();
  };

  return (
    <div className="gx-app">
      <div className="gx-stage">
        <div className="gx-aperture">
          <span className="gx-reg tl" /><span className="gx-reg tr" />
          <span className="gx-reg bl" /><span className="gx-reg br" />
          <canvas ref={canvasRef} className="gx-canvas" />
        </div>
      </div>

      <div className="gx-console">
        <div className="gx-head">
          <div className="gx-title">Galaxy Instrument</div>
          <div className="gx-sub">Generative · Field of Action</div>
        </div>

        <div className="gx-body">
          <div className="gx-group">
            <div className="gx-glabel">Seed</div>
            <div className="gx-ctrl">
              <div className="gx-seed-row">
                <input className="gx-seed" ref={seedRef} defaultValue={P.current.seed} onChange={onSeed} />
                <button className="gx-btn" onClick={onNewSeed}>⟳ New</button>
              </div>
            </div>
          </div>

          {GROUPS.map(g => (
            <div className="gx-group" key={g.label}>
              <div className="gx-glabel">{g.label}</div>
              {g.controls.map(renderSlider)}
            </div>
          ))}

          <div className="gx-group">
            <div className="gx-glabel">Motion</div>
            {MOTION_SLIDERS.map(renderSlider)}
            <div className="gx-ctrl">
              <div className="gx-ctop"><span className="gx-cname">Frame rate</span></div>
              <div className="gx-seg">
                {[24,30,60].map(v => <button key={v} className={vFps===v?"on":""} onClick={()=>setVFps(v)}>{v}</button>)}
              </div>
            </div>
            <div className="gx-ctrl">
              <div className="gx-ctop"><span className="gx-cname">Video size</span></div>
              <div className="gx-seg">
                {[720,1080,1440].map(v => <button key={v} className={vSize===v?"on":""} onClick={()=>setVSize(v)}>{v}²</button>)}
              </div>
            </div>
          </div>

          <div className="gx-group">
            <div className="gx-glabel">Palette</div>
            <div className="gx-swatches">
              <div className="gx-swatch"><input type="color" className="gx-color" defaultValue={P.current.cBg} onChange={onColor('cBg')} /><label>Space</label></div>
              <div className="gx-swatch"><input type="color" className="gx-color" defaultValue={P.current.cStar} onChange={onColor('cStar')} /><label>Stars</label></div>
              <div className="gx-swatch"><input type="color" className="gx-color" defaultValue={P.current.cDust} onChange={onColor('cDust')} /><label>Dust</label></div>
            </div>
          </div>

          <div className="gx-group">
            <div className="gx-glabel">Caption</div>
            <div className={"gx-toggle"+(showText?" on":"")} onClick={onToggleText}>
              <span className="gx-tog-name">Show text on export</span>
              <span className="gx-tog-sw" />
            </div>
            <div className="gx-ctrl">
              <div className="gx-ta-lab">Top-left</div>
              <textarea className="gx-ta" ref={taTLRef} rows={2} defaultValue={P.current.txtTL} onChange={onCaption('txtTL')} />
            </div>
            <div className="gx-ctrl">
              <div className="gx-ta-lab">Bottom-right</div>
              <textarea className="gx-ta" ref={taBRRef} rows={2} defaultValue={P.current.txtBR} onChange={onCaption('txtBR')} />
            </div>
            <button className="gx-reset" onClick={onResetText}>Reset to default text</button>
            <div className="gx-hint">Tokens: <span style={{color:"var(--fm)"}}>{"{seed} {stars} {tilt} {spin}"}</span></div>
          </div>
        </div>

        <div className="gx-foot">
          <div className="gx-res-row">
            <span className="gx-lab">PNG res</span>
            <div className="gx-seg">
              {[1,2,4].map(r => <button key={r} className={pngRes===r?"on":""} onClick={()=>setPngRes(r)}>{r}×</button>)}
            </div>
          </div>
          <div className="gx-foot-row">
            <button className="gx-btn gx-btn-primary" onClick={exportPNG}>Export PNG</button>
            <button className="gx-btn" onClick={exportSVG}>Export SVG</button>
          </div>
          <button className="gx-btn" style={{width:"100%"}} onClick={exportVideo}>● Record Video</button>
          <div className="gx-vidstatus">{vidStatus}</div>
        </div>
      </div>

      <style>{`
        .gx-app{display:grid;grid-template-columns:1fr 340px;height:calc(100vh - 72px);width:100%;background:var(--bg);color:var(--fg);font-family:var(--mono);font-size:13px;overflow:hidden;animation:en .4s ease both}
        .gx-stage{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#000}
        .gx-aperture{position:relative;aspect-ratio:1/1;width:min(82vh,86%);max-width:880px}
        .gx-canvas{width:100%;height:100%;display:block;border-radius:2px;cursor:grab;touch-action:none}
        .gx-canvas:active{cursor:grabbing}
        .gx-reg{position:absolute;width:16px;height:16px;pointer-events:none;opacity:.5}
        .gx-reg::before,.gx-reg::after{content:"";position:absolute;background:var(--ff)}
        .gx-reg::before{width:16px;height:1px;top:0}
        .gx-reg::after{width:1px;height:16px;left:0}
        .gx-reg.tl{top:-22px;left:-22px}
        .gx-reg.tr{top:-22px;right:-22px;transform:scaleX(-1)}
        .gx-reg.bl{bottom:-22px;left:-22px;transform:scaleY(-1)}
        .gx-reg.br{bottom:-22px;right:-22px;transform:scale(-1,-1)}
        .gx-console{background:var(--sf);border-left:1px solid var(--bd);display:flex;flex-direction:column;overflow:hidden}
        .gx-head{padding:22px 22px 16px;border-bottom:1px solid var(--bd)}
        .gx-title{font-family:var(--display);font-size:22px;font-weight:500;letter-spacing:-.01em;line-height:1.05;color:var(--fg)}
        .gx-sub{margin-top:7px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--ff)}
        .gx-body{flex:1;overflow-y:auto;padding:8px 22px 18px}
        .gx-body::-webkit-scrollbar{width:8px}
        .gx-body::-webkit-scrollbar-thumb{background:var(--bd);border-radius:4px}
        .gx-group{padding:15px 0 4px;border-bottom:1px solid var(--bd)}
        .gx-group:last-child{border-bottom:none}
        .gx-glabel{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--ff);margin-bottom:12px}
        .gx-ctrl{margin-bottom:14px}
        .gx-ctop{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
        .gx-cname{font-size:11.5px;color:var(--fm);letter-spacing:.02em}
        .gx-cval{font-size:11.5px;color:var(--ac1);font-variant-numeric:tabular-nums}
        .gx-range{-webkit-appearance:none;appearance:none;width:100%;height:2px;background:var(--bd);outline:none;cursor:pointer}
        .gx-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:11px;height:11px;border-radius:50%;background:var(--fg);border:2px solid var(--bg);box-shadow:0 0 0 1px var(--ac1);transition:transform .1s}
        .gx-range::-webkit-slider-thumb:hover{transform:scale(1.25)}
        .gx-range::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:var(--fg);border:2px solid var(--bg);box-shadow:0 0 0 1px var(--ac1)}
        .gx-seed-row{display:flex;gap:8px;align-items:center}
        .gx-seed{flex:1;background:var(--cbg);border:1px solid var(--bd);color:var(--fg);font-family:inherit;font-size:12px;padding:8px 10px;border-radius:3px;letter-spacing:.05em}
        .gx-seed:focus{outline:none;border-color:var(--ac1)}
        .gx-swatches{display:flex;gap:14px}
        .gx-swatch{display:flex;flex-direction:column;gap:5px;align-items:center}
        .gx-swatch label{font-size:9px;letter-spacing:.1em;color:var(--ff);text-transform:uppercase}
        .gx-color{-webkit-appearance:none;appearance:none;width:38px;height:26px;border:1px solid var(--bd);border-radius:3px;background:none;cursor:pointer;padding:0}
        .gx-color::-webkit-color-swatch-wrapper{padding:2px}
        .gx-color::-webkit-color-swatch{border:none;border-radius:2px}
        .gx-btn{font-family:inherit;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--fg);background:var(--cbg);border:1px solid var(--bd);padding:9px 12px;border-radius:3px;cursor:pointer;transition:all .14s;white-space:nowrap}
        .gx-btn:hover{border-color:var(--ac1);color:var(--ac1);background:var(--ch)}
        .gx-btn:active{transform:translateY(1px)}
        .gx-foot{padding:16px 22px;border-top:1px solid var(--bd);display:grid;gap:8px}
        .gx-foot-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .gx-btn-primary{background:var(--ac1);color:#fff;border-color:var(--ac1);font-weight:500}
        .gx-btn-primary:hover{background:var(--ac1);color:#fff;filter:brightness(1.12)}
        .gx-res-row{display:flex;gap:6px;align-items:center}
        .gx-lab{font-size:10px;letter-spacing:.1em;color:var(--ff);text-transform:uppercase}
        .gx-seg{display:flex;border:1px solid var(--bd);border-radius:3px;overflow:hidden}
        .gx-seg button{font-family:inherit;font-size:10.5px;color:var(--fm);background:none;border:none;padding:6px 10px;cursor:pointer;border-right:1px solid var(--bd)}
        .gx-seg button:last-child{border-right:none}
        .gx-seg button.on{background:var(--ac1);color:#fff}
        .gx-ta{width:100%;background:var(--cbg);border:1px solid var(--bd);color:var(--fg);font-family:inherit;font-size:11px;line-height:1.5;padding:8px 9px;border-radius:3px;resize:vertical;min-height:46px;letter-spacing:.04em}
        .gx-ta:focus{outline:none;border-color:var(--ac1)}
        .gx-ta-lab{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--ff);margin-bottom:5px}
        .gx-toggle{display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;margin-bottom:12px}
        .gx-tog-name{font-size:11.5px;color:var(--fm)}
        .gx-tog-sw{width:38px;height:20px;border-radius:11px;background:var(--cbg);border:1px solid var(--bd);position:relative;transition:all .16s}
        .gx-tog-sw::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--ff);transition:all .16s}
        .gx-toggle.on .gx-tog-sw{background:var(--ac1);border-color:var(--ac1)}
        .gx-toggle.on .gx-tog-sw::after{left:19px;background:#fff}
        .gx-reset{font-size:10px;letter-spacing:.08em;color:var(--ff);background:none;border:none;cursor:pointer;padding:4px 0;text-decoration:underline;font-family:inherit}
        .gx-reset:hover{color:var(--ac1)}
        .gx-hint{font-size:9.5px;color:var(--ff);line-height:1.6;margin-top:8px}
        .gx-vidstatus{font-size:10px;letter-spacing:.08em;color:var(--ff);text-align:center;min-height:13px}
        @media(max-width:820px){
          .gx-app{grid-template-columns:1fr;height:auto;overflow:visible}
          /* Pin the galaxy below the fixed topbar (72px) so it stays visible
             while the controls scroll beneath it — adjust a slider, watch it change. */
          .gx-stage{position:sticky;top:72px;z-index:5;height:46vh;min-height:300px;background:#000;border-bottom:1px solid var(--bd)}
          .gx-aperture{width:min(40vh,80vw)}
          .gx-console{border-left:none}
          /* Bigger touch targets for the sliders. */
          .gx-range{height:22px;background:transparent}
          .gx-range::-webkit-slider-runnable-track{height:2px;background:var(--bd)}
          .gx-range::-moz-range-track{height:2px;background:var(--bd)}
          .gx-range::-webkit-slider-thumb{margin-top:-7px;width:16px;height:16px}
          .gx-range::-moz-range-thumb{width:16px;height:16px}
        }
      `}</style>
    </div>
  );
}
