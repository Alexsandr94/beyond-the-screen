import { useEffect, useRef, useState } from "react";
import Lumi from "./Lumi";
import { ELEMENTS, IDEA_KEY, IDEA_EVENT, readIdea } from "./worldIdea";
import "./Observatory.css";
const EXPERIMENTS = [
 {id:'depth',name:'Depth',title:'A little distance changes everything.',text:'Compare a flat scene with moving layers. Near objects move more than distant ones.'},
 {id:'mood',name:'Mood',title:'Same words. A different feeling.',text:'Try two moods. Colour, light and rhythm change the impression, while your content stays the same.'},
 {id:'response',name:'Feedback',title:'A good interface answers you.',text:'Both buttons add one star after a short delay. Compare how clearly they tell you what is happening.'},
];
const COLOURS = {moon:'#d5bfff',forest:'#9ee5c3',sun:'#ffd19a'};
const DEMO = {elements:ELEMENTS,theme:'moon',action:'portal',styled:true,wired:true};
const STARS = Array.from({length:30},(_,i)=>({left:`${i*37%100}%`,top:`${i*61%100}%`,'--delay':`${-i*.43}s`,'--size':`${i%5?2:3}px`}));
function useObservatoryMotion(sectionRef, stageRef, enabled, depth) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false,
      frame = null,
      previous = 0;
    let x = 0,
      y = 0,
      targetX = 0,
      targetY = 0;
    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previous = 0;
    }
    function paint() {
      stage.style.setProperty("--ox", `${x * depth}px`);
      stage.style.setProperty("--oy", `${y * depth}px`);
    }
    function tick(now) {
      frame = null;
      if (!visible || document.hidden || reduce.matches || !enabled) return;
      const amount =
        1 - Math.exp(-Math.min(previous ? now - previous : 16, 64) / 130);
      previous = now;
      x += (targetX - x) * amount;
      y += (targetY - y) * amount;
      paint();
      if (Math.abs(x - targetX) + Math.abs(y - targetY) > 0.001)
        frame = requestAnimationFrame(tick);
    }
    function schedule() {
      if (
        frame === null &&
        visible &&
        enabled &&
        !reduce.matches &&
        !document.hidden
      )
        frame = requestAnimationFrame(tick);
    }
    function move(e) {
      if (e.pointerType !== "mouse") return;
      const b = section.getBoundingClientRect();
      targetX = (e.clientX - b.left) / b.width - 0.5;
      targetY = (e.clientY - b.top) / b.height - 0.5;
      schedule();
    }
    function leave() {
      targetX = 0;
      targetY = 0;
      schedule();
    }
    function scroll() {
      if (!visible || matchMedia("(pointer: fine)").matches) return;
      targetY = Math.max(
        -0.5,
        Math.min(
          0.5,
          (-section.getBoundingClientRect().top / innerHeight) * 0.4,
        ),
      );
      schedule();
    }
    function sync() {
      const paused = !visible || document.hidden || reduce.matches || !enabled;
      section.classList.toggle("observatory--paused", paused);
      for (const svg of section.querySelectorAll("svg")) {
        if (paused) svg.pauseAnimations?.();
        else svg.unpauseAnimations?.();
      }
      if (paused) {
        stop();
        x = 0;
        y = 0;
        paint();
      } else schedule();
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(section);
    sync();
    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);
    return () => {
      stop();
      observer.disconnect();
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("visibilitychange", sync);
      reduce.removeEventListener("change", sync);
    };
  }, [sectionRef, stageRef, enabled, depth]);
}

export default function Observatory({ onContinue }) {
 const sectionRef=useRef(null), timers=useRef({}), previewTimer=useRef(null);
 const [idea,setIdea]=useState(readIdea), [experiment,setExperiment]=useState('depth');
 const [motion,setMotion]=useState(true), [depth,setDepth]=useState(65), [layers,setLayers]=useState(false);
 const [mood,setMood]=useState('calm'), [depthSeen,setDepthSeen]=useState([]), [moodsSeen,setMoodsSeen]=useState([]);
 const [tried,setTried]=useState([]), [busy,setBusy]=useState({plain:false,clear:false}), [counts,setCounts]=useState({plain:0,clear:0});
 const [preview,setPreview]=useState(false), [previewRun,setPreviewRun]=useState(0);
 const [notice,setNotice]=useState('Start by comparing Flat and Depth. Move your pointer to explore.');
 const [research,setResearch]=useState(false);
 useObservatoryMotion(sectionRef,sectionRef,motion,depth);
 useEffect(()=>{
  const change=e=>setIdea(e.detail);
  const storage=e=>{if(e.key===IDEA_KEY||e.key===null)setIdea(readIdea());};
  window.addEventListener(IDEA_EVENT,change);window.addEventListener('storage',storage);
  return()=>{window.removeEventListener(IDEA_EVENT,change);window.removeEventListener('storage',storage);};
 },[]);
 useEffect(()=>()=>{Object.values(timers.current).forEach(clearTimeout);clearTimeout(previewTimer.current);},[]);
 const hasCreation=idea.elements.length>0, creation=hasCreation?idea:DEMO;
 const accent=mood==='energy'?'#ffd294':mood==='mystery'?'#cfb5ff':COLOURS[creation.theme];
 const completed=[depthSeen.includes('flat')&&depthSeen.includes('deep'),moodsSeen.length>=2,tried.includes('plain')&&tried.includes('clear')];
 const count=completed.filter(Boolean).length;
 const active=EXPERIMENTS.find(e=>e.id===experiment);
 function chooseDepth(mode){setDepth(mode==='flat'?0:80);setDepthSeen(old=>old.includes(mode)?old:[...old,mode]);setNotice(mode==='flat'?'Flat: all scene layers stay in place. Now compare Depth.':'Depth: near layers move farther than distant layers. Move your pointer, or use Show layers.');}
 function chooseMood(value){setMood(value);setMoodsSeen(old=>old.includes(value)?old:[...old,value]);setNotice(value==='calm'?'Calm restores the colours of your workshop idea and a slower rhythm.':value==='energy'?'Energy uses warm light and a quicker rhythm. The content is unchanged.':'Mystery uses violet light, darker surroundings and a slow glow. The content is unchanged.');}
 function tryResponse(kind){
  if(timers.current[kind])return;
  setBusy(old=>({...old,[kind]:true}));
  timers.current[kind]=setTimeout(()=>{
   delete timers.current[kind];setBusy(old=>({...old,[kind]:false}));
   setCounts(old=>({...old,[kind]:old[kind]+1}));setTried(old=>old.includes(kind)?old:[...old,kind]);
   setNotice(kind==='clear'?'The feedback button announced progress and completion. You did not have to guess.':'The quiet button finished too, but gave no visual progress cue. Now compare the other button.');
  },1200);
 }
 function launchPreview(){
  if(!creation.wired){setNotice('Your workshop button has no action yet. Connect JavaScript in the workshop to activate it.');return;}
  clearTimeout(previewTimer.current);setPreviewRun(n=>n+1);setPreview(true);
  setNotice(creation.action==='portal'?'The portal action from your workshop is still connected.':'The constellation action from your workshop is still connected.');
  previewTimer.current=setTimeout(()=>setPreview(false),matchMedia('(prefers-reduced-motion: reduce)').matches?1500:4000);
 }
 function reset(){clearTimeout(previewTimer.current);setPreview(false);Object.values(timers.current).forEach(clearTimeout);timers.current={};setBusy({plain:false,clear:false});setCounts({plain:0,clear:0});setTried([]);setDepthSeen([]);setMoodsSeen([]);setDepth(65);setLayers(false);setMood('calm');setNotice('Experiments reset. Your workshop creation is unchanged.');}
 function back(event){event.preventDefault();const target=document.getElementById('about');target?.focus({preventScroll:true});target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 return <section id="observatory" ref={sectionRef} tabIndex={-1} aria-labelledby="observatory-title" className="observatory observatory--paused" style={{'--obs-accent':accent,'--obs-rhythm':mood==='energy'?'3s':mood==='mystery'?'9s':'7s'}}>
  <div className="observatory__scene" aria-hidden="true"><img className="observatory__background" src="/observatory/observatory-sky.png" alt="" loading="lazy"/><img className="observatory__room" src="/observatory/observatory-room.png" alt="" loading="lazy"/><div className="observatory__stars">{STARS.map((style,i)=><i key={i} style={style}/>)}</div></div><div className="observatory__shade" aria-hidden="true"/>
  <header className="observatory__heading"><div><p className="observatory__eyebrow">03 — The Observatory</p><h2 id="observatory-title">Discover how design <em>feels.</em></h2></div><button type="button" className="observatory__motion" aria-pressed={motion} onClick={()=>setMotion(v=>!v)}>{motion?'Pause motion':'Resume motion'}</button></header>
  <div className="observatory__layout">
   <div className="observatory__lesson">
    <nav className="observatory__tabs" aria-label="Choose an experiment">{EXPERIMENTS.map((e,i)=><button type="button" key={e.id} aria-pressed={experiment===e.id} onClick={()=>setExperiment(e.id)}><span aria-hidden="true">{completed[i]?'✦':`0${i+1}`}</span>{e.name}</button>)}</nav>
    <div className="observatory__lesson-body"><p className="observatory__kicker">Experiment {EXPERIMENTS.indexOf(active)+1} / 3</p><h3>{active.title}</h3><p className="observatory__explanation">{active.text}</p>
    {experiment==='depth'&&<>
     <div className="observatory__choices"><button type="button" aria-pressed={depth===0} onClick={()=>chooseDepth('flat')}>Flat</button><button type="button" aria-pressed={depth>0} onClick={()=>chooseDepth('deep')}>Depth</button><button type="button" aria-pressed={layers} onClick={()=>setLayers(v=>!v)}>{layers?'Hide layers':'Show layers'}</button></div>
     <label className="observatory__range">Parallax strength <output>{depth}%</output><input type="range" min="0" max="100" value={depth} onChange={e=>setDepth(Number(e.target.value))}/></label>
     <p className="observatory__hint">Compare both buttons to discover your first star. On touch screens, scrolling moves the scene; Show layers makes the structure visible without moving a pointer.</p>
     {!motion&&<p className="observatory__hint">Motion is paused. Show layers still lets you inspect the three planes.</p>}
    </>}
    {experiment==='mood'&&<><div className="observatory__choices" role="group" aria-label="Choose a mood">{[['calm','Calm'],['energy','Energy'],['mystery','Mystery']].map(([id,name])=><button type="button" key={id} aria-pressed={mood===id} onClick={()=>chooseMood(id)}>{name}</button>)}</div><p className="observatory__hint">Try at least two moods to discover another star. Calm brings back your workshop palette. These choices do not overwrite your original design.</p><div className="observatory__mood-description"><span aria-hidden="true">{mood==='energy'?'☀':mood==='mystery'?'☾':'✧'}</span><p>{mood==='energy'?'Warm, bright, lively.':mood==='mystery'?'Dark, quiet, curious.':'Soft light. Room to breathe.'}</p></div></>}
    {experiment==='response'&&<><div className="observatory__response-pair"><div><p>A · Little feedback</p><button type="button" className="observatory__quiet" disabled={busy.plain} onClick={()=>tryResponse('plain')}>Add a star</button><span>Stars: {counts.plain}</span></div><div><p>B · Clear feedback</p><button type="button" className="observatory__clear" disabled={busy.clear} aria-busy={busy.clear} onClick={()=>tryResponse('clear')}>{busy.clear?'Adding…':counts.clear?'Add another star':'Add a star'}</button><span aria-live="polite">{busy.clear?'Working…':counts.clear?`✓ Added · Stars: ${counts.clear}`:'Stars: 0'}</span></div></div><p className="observatory__hint">Both actions take 1.2 seconds. Try both to discover your third star. Progress and confirmation help people understand an interface.</p></>}
    </div><p className="observatory__notice" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
    <button type="button" className="observatory__reset" onClick={reset}>Reset experiments ↺</button>
   </div>
   <div className="observatory__showcase">
    <div className="observatory__window-bar"><span>{hasCreation?'✦ From your workshop':'◇ Sample idea — you can build your own'}</span><span>{mood}</span></div>
    <div className={`observatory__viewer mood-${mood} ${layers?'show-layers':''} ${creation.styled?'is-styled':'is-plain'}`}>
     <div className="observatory__plane observatory__plane--far" aria-hidden="true"><span className="observatory__moon"/><span className="observatory__plane-label">01 · Distant sky</span></div>
     <div className="observatory__plane observatory__plane--middle" aria-hidden="true"><div className="observatory__mountains"/><span className="observatory__plane-label">02 · Landscape</span></div>
     <div className="observatory__mini-copy"><span className="observatory__plane-label">03 · Your content</span>{creation.elements.includes('heading')&&<h3>Hello, new world.</h3>}{creation.elements.includes('text')&&<p>A little idea. A place to grow.</p>}{creation.elements.includes('button')&&<button type="button" onClick={launchPreview}>{preview?'Replay the magic ↻':'Awaken my idea ↗'}</button>}</div>
     <div className="observatory__preview-effect" aria-hidden="true" key={previewRun}>{preview&&(creation.action==='portal'?<span className="observatory__portal">✦</span>:<svg viewBox="0 0 120 100"><path d="M10 70L35 15L70 50L100 10L110 80L70 50L60 90Z"/>{[[10,70],[35,15],[70,50],[100,10],[110,80],[60,90]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3"/>)}</svg>)}</div>
    </div>
    <div className="observatory__discovery"><div className="observatory__dragon-map" role="img" aria-label={`Dragon constellation: ${count} of 3 discoveries`}>
     <svg viewBox="0 0 360 160" fill="none"><g className={completed[0]?'is-lit':''}><path d="M35 126L78 109L130 118L164 94L194 99L218 121L260 132L290 119"/><circle cx="130" cy="118" r="4"/></g><g className={completed[1]?'is-lit':''}><path d="M164 94L143 35L193 62L205 17L239 44L273 25L253 77L218 121"/><circle cx="205" cy="17" r="4"/></g><g className={completed[2]?'is-lit':''}><path d="M194 99L206 77L230 61L258 63L279 51L304 59L285 75L260 81L243 108L260 132"/><path d="M279 51L281 38L289 54"/><circle cx="280" cy="62" r="3"/></g></svg>
     <div className="observatory__discovery-stars" aria-hidden="true">{completed.map((value,i)=><span className={value?'is-lit':''} key={i}>✦</span>)}</div>
     </div><div className="observatory__discovery-copy"><p className="observatory__kicker">{count} / 3 discoveries</p><h3>{count===3?'The guardian is waiting.':'A constellation is taking shape.'}</h3><p>{count===3?'Your experiments revealed the dragon. Carry your curiosity into the next world.':'Explore depth, mood and feedback. Each discovery lights part of the dragon.'}</p></div><div className="observatory__guide"><Lumi className="observatory__lumi"/></div></div>
   </div>
  </div>
  <details className="observatory__research" open={research} onToggle={e=>setResearch(e.currentTarget.open)}><summary>Why am I exploring this?</summary><p>For my project “My Career Aspiration”, I am exploring how website design and interaction affect people’s impressions. I want to become a frontend developer who makes websites both expressive and easy to use.</p></details>
  <footer className="observatory__footer"><a href="#about" onClick={back}>← Back to the workshop</a><span>03 / 04 — Discover the difference</span><a href="#sanctuary" onClick={onContinue}>Meet the dragon ↗</a></footer>
 </section>;
}
