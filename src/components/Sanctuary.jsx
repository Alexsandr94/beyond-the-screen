import { useEffect, useRef, useState } from 'react';
import Lumi from './Lumi';
import MagicSeal from './MagicSeal';
import GuardianDragon from './GuardianDragon';
import { readIdea, IDEA_EVENT, IDEA_KEY } from './worldIdea';
import './Sanctuary.css';
const PATHS = [
  {
    name: "Learn",
    symbol: "✧",
    title: "Stay curious.",
    text: "I am learning HTML, CSS, JavaScript and React. Every small discovery helps me understand how the web works.",
  },
  {
    name: "Build",
    symbol: "◇",
    title: "Turn knowledge into practice.",
    text: "I want to build useful websites, test my ideas and learn from mistakes. This project is one step on that journey.",
  },
  {
    name: "Create",
    symbol: "☾",
    title: "Give ideas a life of their own.",
    text: "My goal is to combine clear interaction with memorable design — and create websites people enjoy exploring.",
  },
];
const SPARKS = Array.from({length:54},(_,i)=>({left:`${(i*37+9)%100}%`,top:`${(i*59+3)%100}%`,'--delay':`${-i*.37}s`,'--size':`${i%6?2:4}px`,'--dx':`${Math.cos(i*2.4)*(160+i*5)}px`,'--dy':`${Math.sin(i*2.4)*(160+i*4)}px`}));
const STAGES = ['Your idea is reaching the seal.','The sky is gathering its light.','The ancient rings are aligning…','The gateway between worlds is opening.','A new world is born.','Every great world begins with a small idea.'];
const clamp = n=>Math.max(0,Math.min(1,n));
const ease = n=>{n=clamp(n);return n*n*(3-2*n);};
const COLOURS={moon:'#d9f3ff',forest:'#b7f5d8',sun:'#ffe1ab'};
export default function Sanctuary(){
 const sectionRef=useRef(null),sceneRef=useRef(null);
 const clock=useRef({time:0,running:false,done:false,angles:[0,0,0],align:null,phase:-1});
 const [idea,setIdea]=useState(readIdea),[active,setActive]=useState(0),[motion,setMotion]=useState(true);
 const [phase,setPhase]=useState(-1),[running,setRunning]=useState(false),[done,setDone]=useState(false),[reduced,setReduced]=useState(false);
 const [ready,setReady]=useState(false),[assetError,setAssetError]=useState(false);
 const hasIdea=idea.elements.length>0;
 // Обновление цвета работает сразу после изменения мастерской, без перезагрузки.
 useEffect(()=>{const change=e=>setIdea(e.detail),storage=e=>{if(e.key===IDEA_KEY||e.key===null)setIdea(readIdea())};window.addEventListener(IDEA_EVENT,change);window.addEventListener('storage',storage);return()=>{window.removeEventListener(IDEA_EVENT,change);window.removeEventListener('storage',storage)};},[]);
 useEffect(()=>{let cancelled=false;Promise.all(['/sanctuary/dragon.png','/sanctuary/wings.png','/sanctuary/background.png'].map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=reject;im.src=src}))).then(()=>{if(!cancelled)setReady(true)}).catch(()=>{if(!cancelled)setAssetError(true)});return()=>{cancelled=true};},[]);
 // Единые часы: движения и финал останавливаются вместе при паузе или уходе со сцены.
 useEffect(()=>{
  const section=sectionRef.current,scene=sceneRef.current,reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,raf=null,last=0,x=0,y=0,tx=0,ty=0;
  const paint=(name,value)=>scene.style.setProperty(name,value);
  function finish(){const c=clock.current;c.time=16;c.running=false;c.done=true;c.phase=5;c.angles=[0,0,0];setRunning(false);setDone(true);setPhase(5);paint('--charge',1);paint('--lift',0);paint('--wave',0);paint('--burst',0);paint('--stars',1);paint('--travel',1);paint('--beam',0);paint('--rift',.22);paint('--sky-light',.25);paint('--cinema',0);section.style.setProperty('--cinema',0);paint('--ring-a','0deg');paint('--ring-b','0deg');paint('--ring-c','0deg');}
  function tick(now){
   raf=null;const dt=last?(now-last)/1000:0;last=now;const c=clock.current;
   x+=(tx-x)*(1-Math.exp(-dt/ .16));y+=(ty-y)*(1-Math.exp(-dt/ .16));paint('--sx',`${x}px`);paint('--sy',`${y}px`);paint('--look',`${x*.065}deg`);
   if(c.running){
    c.time+=dt;const t=c.time;
    const next=t<3?0:t<6?1:t<8?2:t<12?3:t<16?4:5;
    if(next!==c.phase){c.phase=next;setPhase(next)}
    const charge=ease((t-1.3)/4.7),lift=ease((t-3.4)/3.6)*(1-ease((t-12)/4));
    paint('--charge',charge);paint('--lift',lift);paint('--travel',ease(t/2.2));paint('--beam',t<2.2?Math.sin(Math.PI*clamp(t/2.2)):0);
    paint('--wave',ease((t-8)/4)*5.5);paint('--burst',t>=8?1-ease((t-8)/5):0);paint('--stars',ease((t-11)/3));const cinema=ease(t/2.5)*(1-ease((t-13)/3));paint('--cinema',cinema);section.style.setProperty('--cinema',cinema);paint('--rift',ease((t-7.5)/2)*(1-.78*ease((t-12)/4)));paint('--sky-light',ease((t-7)/3)*(1-.75*ease((t-13)/3)));paint('--stream',ease((t-8)/6));
    paint('--scatter',ease((t-8)/5));
    if(t<6){const speed=1+ease((t-2)/4)*12;c.angles=c.angles.map((v,i)=>v+[4,-6,9][i]*dt*speed)}
    else {if(!c.align)c.align=c.angles.map((v,i)=>[v,(i===1?Math.floor(v/360):Math.ceil(v/360))*360]);c.angles=c.align.map(([a,b])=>a+(b-a)*ease((t-6)/2))}
    if(t>=16)finish();
   }else if(!c.done)c.angles=c.angles.map((v,i)=>v+[4,-6,9][i]*dt);
   c.angles.forEach((v,i)=>paint(['--ring-a','--ring-b','--ring-c'][i],`${v}deg`));raf=requestAnimationFrame(tick);
  }
  function sync(){setReduced(reduce.matches);const paused=!visible||document.hidden||!motion||reduce.matches;section.classList.toggle('sanctuary--paused',paused);for(const svg of section.querySelectorAll('svg')){if(paused)svg.pauseAnimations?.();else svg.unpauseAnimations?.();}if(raf!==null)cancelAnimationFrame(raf);raf=null;last=0;if(reduce.matches&&clock.current.running)finish();if(!paused)raf=requestAnimationFrame(tick);else {paint('--sx','0px');paint('--sy','0px')}}
  function move(e){if(e.pointerType!=='mouse')return;const b=section.getBoundingClientRect();tx=((e.clientX-b.left)/b.width-.5)*64;ty=((e.clientY-b.top)/b.height-.5)*38;}
  function leave(){tx=ty=0}function scroll(){if(!matchMedia('(pointer: fine)').matches)ty=Math.max(-20,Math.min(20,-section.getBoundingClientRect().top*.025));}
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()},{threshold:.08});observer.observe(section);sync();
  section.addEventListener('pointermove',move);section.addEventListener('pointerleave',leave);window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);
  return()=>{if(raf!==null)cancelAnimationFrame(raf);observer.disconnect();section.removeEventListener('pointermove',move);section.removeEventListener('pointerleave',leave);window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',sync);reduce.removeEventListener('change',sync)};
 },[motion]);
 function launch(){
  if(clock.current.running||!ready)return;
  const c=clock.current;c.time=0;c.done=false;c.align=null;c.phase=0;c.running=true;setDone(false);setPhase(0);setRunning(true);
  if(reduced){c.running=false;c.done=true;c.phase=5;c.angles=[0,0,0];setRunning(false);setDone(true);setPhase(5);for(const [k,v]of Object.entries({'--charge':1,'--stars':1,'--lift':0,'--beam':0,'--burst':0,'--ring-a':'0deg','--ring-b':'0deg','--ring-c':'0deg','--rift':.22,'--sky-light':.25,'--cinema':0}))sceneRef.current.style.setProperty(k,v)}
  else {setMotion(true);if(innerWidth<=760)document.getElementById('guardian-stage')?.scrollIntoView({behavior:'smooth',block:'start'});}
 }
 function skip(){const c=clock.current;c.angles=[0,0,0];c.running=false;c.done=true;c.phase=5;setRunning(false);setDone(true);setPhase(5);sectionRef.current.style.setProperty('--cinema',0);for(const[k,v]of Object.entries({'--cinema':0,'--rift':.22,'--sky-light':.25,'--beam':0,'--burst':0,'--lift':0,'--stars':1,'--charge':1,'--wave':0}))sceneRef.current.style.setProperty(k,v)}
 function navigate(event,id){event.preventDefault();const target=document.getElementById(id);if(target&&!target.hasAttribute("tabindex"))target.setAttribute("tabindex","-1");target?.focus({preventScroll:true});target?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}
 return <section id="sanctuary" ref={sectionRef} tabIndex={-1} aria-labelledby="sanctuary-title" className={`sky-sanctuary ${running?'is-awakening':''} ${done?'is-complete':''}`} style={{'--guardian-colour':COLOURS[idea.theme]||COLOURS.moon}}>
  <div className="sky-sanctuary__scene" ref={sceneRef} aria-hidden="true"><div className="sky-sanctuary__canvas">
   <img className="sky-sanctuary__background" src="/sanctuary/background.png" alt=""/>
   <div className="guardian-sky-veil"/><div className="guardian-gateway"><div className="guardian-gateway__well"/><div className="guardian-gateway__horizon"/><div className="guardian-gateway__column"/><div className="guardian-gateway__rays">{Array.from({length:12},(_,i)=><i key={i} style={{'--ray-angle':`${i*30}deg`}}/>)}</div></div><MagicSeal/><GuardianDragon/>
   <div className="guardian-star-stream">{Array.from({length:46},(_,i)=><i key={i} style={{'--star-angle':`${i*137.5}deg`,'--star-distance':`${230+i*18}px`,'--star-delay':`${-(i%11)*.18}s`}}/>)}</div><div className="guardian-offering"/><div className="guardian-wave"/>
   <svg className="guardian-stars" viewBox="0 0 600 240"><path d="M30 160L115 125L180 155L230 100L210 30L285 65L320 10L370 50L440 25L400 110L445 145L530 115L570 140L520 180L460 175L420 220L360 180L300 190L230 100"/>{[[30,160],[115,125],[180,155],[230,100],[210,30],[285,65],[320,10],[370,50],[440,25],[400,110],[445,145],[530,115],[570,140],[520,180],[460,175],[420,220],[360,180],[300,190]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={i%3?3:5}/>)}</svg>
   <div className="guardian-dust">{SPARKS.map((s,i)=><i key={i} style={s}/>)}</div>
   <div className="sky-sanctuary__guide"><Lumi className="sky-sanctuary__lumi"/></div><div className="sky-sanctuary__mist"/>
  </div><div className="sky-sanctuary__sparks">{SPARKS.map((s,i)=><i key={i} style={s}/>)}</div></div>
  <div className="sky-sanctuary__shade"/>
  <header className="sky-sanctuary__header"><span>✦ BEYOND THE SCREEN</span><div className="guardian-controls">{running&&<button type="button" onClick={skip}>Skip finale</button>}<button type="button" aria-pressed={motion} disabled={reduced} onClick={()=>setMotion(v=>!v)}>{reduced?'Reduced motion':motion?'Pause motion':'Resume motion'}</button></div></header>
  <div id="guardian-stage" className="guardian-stage"><div className="guardian-stage__caption" aria-hidden="true">{running?(!motion?'The moment is paused.':STAGES[phase]):done?'The guardian remembers your idea.':'The Sky Guardian'}{running&&<span>{phase+1} / 5</span>}</div></div>
  <div className="sky-sanctuary__content" inert={running?true:undefined}><p className="sky-sanctuary__eyebrow">04 — The Sky Sanctuary</p>
   <h2 id="sanctuary-title" key={done?"final":"intro"}>{done?<>Every great world<br/>begins with<br/><em>a small idea.</em></>:<>My journey<br/>has only just<br/><em>begun.</em></>}</h2>
   <p className="sky-sanctuary__intro">{done?'This is where one journey ends — and my journey as a frontend developer begins.':'You built an idea. You explored how it feels. Now give it a world of its own.'}</p>
   <p className="guardian-origin">{hasIdea?'✦ Carrying your workshop colours':'✧ A silver spark to begin your journey'}</p>
   <button type="button" className="sky-sanctuary__launch" onClick={launch} disabled={running||!ready}>{assetError?'Scene images could not load':!ready?'Preparing the guardian…':running?'The guardian is awakening…':done?'Experience it again ↻':'Awaken the guardian ✦'}</button>
   <p className="guardian-progress" role="status" aria-live="polite">{assetError?'Check the three images in public/sanctuary, then reload.':running?(!motion?'Paused. Choose Resume motion to continue.':STAGES[phase]):done?STAGES[5]:reduced?'A still version of the finale will be shown.':'A 16-second journey between worlds. Take a moment to watch.'}</p>
   <div className="sky-sanctuary__paths" role="group" aria-label="Explore my next steps">{PATHS.map((item,i)=><button type="button" key={item.name} aria-pressed={active===i} aria-controls="sanctuary-path" onClick={()=>setActive(i)}><span aria-hidden="true">{item.symbol}</span>{item.name}</button>)}</div>
   <div id="sanctuary-path" className="sky-sanctuary__detail" key={active}><h3>{PATHS[active].title}</h3><p>{PATHS[active].text}</p></div>
  </div>
  <footer className="sky-sanctuary__footer"><a href="#observatory" onClick={e=>navigate(e,'observatory')}>← Back to the observatory</a><span>04 / 04 — Imagine. Build. Become.</span><a href="#top" onClick={e=>navigate(e,'top')}>Back to the portal ↑</a></footer>
 </section>
}
