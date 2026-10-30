import { useEffect, useRef, useState } from "react";
import Lumi from "./Lumi";
import { EMPTY_IDEA, ELEMENTS, readIdea, writeIdea } from "./worldIdea";
import "./Workshop.css";
const TOOLS = [
 {id:'html',name:'HTML',label:'Structure',image:'html-crystal.png'},
 {id:'css',name:'CSS',label:'Style',image:'css-palette.png'},
 {id:'js',name:'JavaScript',label:'Behaviour',image:'js-orb.png'},
];
const THEMES = [
 {id:'moon',name:'Moonlight',color:'#d5bfff'},
 {id:'forest',name:'Enchanted forest',color:'#9ee5c3'},
 {id:'sun',name:'Golden hour',color:'#ffd19a'},
];
const LABELS = {heading:'Heading',text:'Description',button:'Button'};
const TAGS = {heading:'<h1>Hello, new world.</h1>',text:'<p>A little idea. A place to grow.</p>',button:'<button>Awaken my idea</button>'};
const COPY = {
 html:['Give your world a shape.','Add three HTML elements. Each tag creates a different part of the page.'],
 css:['Give your world a feeling.','Choose a theme. CSS changes the appearance; your content stays the same.'],
 js:['Give your world a little magic.','Connect an action, then try the button inside your creation.'],
};
// Координаты храним в ref: движение мыши не перерисовывает React-компонент.
function useWorkshopParallax(sectionRef, stageRef) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = window.matchMedia(
      "(min-width: 1001px) and (hover: hover) and (pointer: fine)",
    );
    let visible = false;
    let frame = null;
    let lastTime = 0;
    let target = { x: 0, y: 0, scroll: 0 };
    let current = { ...target };

    function paint() {
      stage.style.setProperty("--wx", String(current.x));
      stage.style.setProperty("--wy", String(current.y));
      stage.style.setProperty("--ws", String(current.scroll));
    }
    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = 0;
    }
    function tick(now) {
      frame = null;
      if (!visible || motion.matches || document.hidden) return;
      const dt = lastTime ? Math.min(now - lastTime, 64) : 16;
      lastTime = now;
      const smoothing = 1 - Math.exp(-dt / 130);
      let difference = 0;
      for (const key of ["x", "y", "scroll"]) {
        current[key] += (target[key] - current[key]) * smoothing;
        difference += Math.abs(target[key] - current[key]);
      }
      paint();
      if (difference > 0.001) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    }
    function schedule() {
      if (frame === null && visible && !motion.matches && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    }
    function onMove(event) {
      if (!mouse.matches || event.pointerType !== "mouse") return;
      const bounds = section.getBoundingClientRect();
      target.x = Math.max(
        -0.5,
        Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5),
      );
      target.y = Math.max(
        -0.5,
        Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5),
      );
      schedule();
    }
    function onLeave() {
      target.x = 0;
      target.y = 0;
      schedule();
    }
    function onScroll() {
      if (!visible) return;
      const bounds = section.getBoundingClientRect();
      target.scroll = Math.max(
        -1,
        Math.min(
          1,
          (innerHeight / 2 - bounds.top - bounds.height / 2) / innerHeight,
        ),
      );
      schedule();
    }
    function onPreference() {
      stop();
      current = { x: 0, y: 0, scroll: 0 };
      target = { ...current };
      paint();
      section.classList.toggle("workshop--still", motion.matches);
      onVisibility();
      if (!motion.matches) onScroll();
    }
    function onVisibility() {
      for (const svg of section.querySelectorAll("svg")) {
        if (!visible || document.hidden || motion.matches)
          svg.pauseAnimations?.();
        else svg.unpauseAnimations?.();
      }
      section.classList.toggle("workshop--paused", !visible || document.hidden);
      if (document.hidden) stop();
      else onScroll();
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        section.classList.toggle("workshop--visible", visible);
        onVisibility();
      },
      { threshold: 0 },
    );
    observer.observe(section);
    onPreference();
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onPreference);
    mouse.addEventListener("change", onPreference);
    return () => {
      stop();
      observer.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onPreference);
      mouse.removeEventListener("change", onPreference);
    };
  }, [sectionRef, stageRef]);
}

export default function Workshop({ onReturn, onContinue }) {
 const sectionRef=useRef(null), stageRef=useRef(null), timerRef=useRef(null);
 const [idea,setIdea]=useState(readIdea), [tool,setTool]=useState('html');
 const [highlight,setHighlight]=useState('heading');
 const [withoutCSS,setWithoutCSS]=useState(false), [withoutJS,setWithoutJS]=useState(false);
 const [playing,setPlaying]=useState(false), [run,setRun]=useState(0);
 const [saved,setSaved]=useState(true);
 const [message,setMessage]=useState('Start with HTML. Add a heading to your world.');
 const full=idea.elements.length===3, styled=idea.styled&&!withoutCSS;
 const accent=THEMES.find(t=>t.id===idea.theme).color;
 useWorkshopParallax(sectionRef,stageRef);
 useEffect(()=>{setSaved(writeIdea(idea));},[idea]);
 useEffect(()=>()=>clearTimeout(timerRef.current),[]);
 function stop(){clearTimeout(timerRef.current);setPlaying(false);}
 function add(name){
  setHighlight(name);
  setIdea(old=>({...old,elements:ELEMENTS.filter(n=>n===name||old.elements.includes(n))}));
  setMessage(`${LABELS[name]} selected. Notice its tag and the matching element in your creation.`);
 }
 function theme(id){stop();setWithoutCSS(false);setIdea(old=>({...old,theme:id,styled:true}));setMessage('Style applied! Remove CSS below to compare the same HTML without this design.');}
 function launch(){
  if(!idea.wired||withoutJS){setMessage(withoutJS?'JavaScript is off in the demo. The button looks the same, but its action does not run.':'This is an HTML button. Open JavaScript and connect an action to make it respond.');return;}
  stop();setRun(n=>n+1);setPlaying(true);setIdea(old=>({...old,completed:true}));
  setMessage(idea.action==='portal'?'Your portal opened! JavaScript responded to your click.':'Your stars connected! JavaScript responded to your click.');
  timerRef.current=setTimeout(()=>setPlaying(false),matchMedia('(prefers-reduced-motion: reduce)').matches?1500:4200);
 }
 function reset(){stop();setIdea({...EMPTY_IDEA,elements:[]});setTool('html');setWithoutCSS(false);setWithoutJS(false);setHighlight('heading');setMessage('A fresh beginning. Add your first HTML element.');}
 const done=[full,idea.styled,idea.completed];
 return <section id="about" className="workshop workshop--paused" ref={sectionRef} tabIndex={-1} aria-labelledby="workshop-title" style={{'--idea-accent':accent}}>
  <div className="workshop__scene" aria-hidden="true"><div className="workshop__stage" ref={stageRef}>
   <img className="workshop__layer workshop__landscape" src="/workshop/01-landscape.png" alt=""/>
   <img className="workshop__layer workshop__room" src="/workshop/02-room.png" alt=""/>
   <img className="workshop__layer workshop__table" src="/workshop/03-table.png" alt=""/>
   <div className="workshop__dust">{Array.from({length:24},(_,i)=><i key={i} style={{left:`${i*37%100}%`,top:`${i*53%100}%`,'--delay':`${-i*.7}s`}}/>)}</div>
  </div></div><div className="workshop__shade" aria-hidden="true"/>
  <header className="workshop__heading"><div><p className="workshop__eyebrow">02 — The Workshop</p><h2 id="workshop-title">Build a little <em>world.</em></h2></div><p>I’m Alexander, an aspiring frontend developer.<br/>Explore the three tools behind an interactive website.</p></header>
  <div className="workshop__layout">
   <div className="workshop__lesson">
    <nav className="workshop__steps" aria-label="Choose a web technology">{TOOLS.map((t,i)=><button type="button" key={t.id} aria-pressed={tool===t.id} onClick={()=>setTool(t.id)}><span aria-hidden="true">{done[i]?'✓':`0${i+1}`}</span>{t.name}</button>)}</nav>
    <div className="workshop__lesson-body"><p className="workshop__kicker">{TOOLS.find(t=>t.id===tool).label}</p><h3>{COPY[tool][0]}</h3><p className="workshop__explanation">{COPY[tool][1]}</p>
     {tool==='html'&&<>
      <div className="workshop__choices">{ELEMENTS.map(name=><button type="button" key={name} aria-pressed={idea.elements.includes(name)} onClick={()=>add(name)}>{idea.elements.includes(name)?'✓':'+'} {LABELS[name]}</button>)}</div>
      <div className="workshop__code" aria-label="HTML for your creation">{ELEMENTS.map(name=><code key={name} className={highlight===name?'is-selected':''}>{idea.elements.includes(name)?TAGS[name]:`<!-- Add ${LABELS[name].toLowerCase()} -->`}</code>)}</div>
      <p className="workshop__hint">HTML names the parts. CSS styles them. JavaScript connects their behaviour.</p>
      {full&&<button type="button" className="workshop__next" onClick={()=>setTool('css')}>Next: style with CSS →</button>}
     </>}
     {tool==='css'&&<>
      {!full&&<p className="workshop__requirement">First add all three elements in HTML.</p>}
      <div className="workshop__themes" role="group" aria-label="Choose a theme">{THEMES.map(t=><button type="button" key={t.id} disabled={!full} aria-pressed={idea.styled&&idea.theme===t.id} onClick={()=>theme(t.id)}><span style={{background:t.color}}/>{t.name}</button>)}</div>
      <pre className="workshop__code"><code>{`/* Part of your theme */\n.card {\n  color: ${accent};\n  border-radius: 20px;\n}`}</code></pre>
      <p className="workshop__hint">Colours, spacing, typography and button shapes are CSS. Try “Remove CSS” to see the difference.</p>
      {idea.styled&&<button type="button" className="workshop__next" onClick={()=>setTool('js')}>Next: connect JavaScript →</button>}
     </>}
     {tool==='js'&&<>
      {!full&&<p className="workshop__requirement">First add all three elements in HTML.</p>}
      <div className="workshop__choices" role="group" aria-label="Choose an action">{['portal','stars'].map(action=><button type="button" key={action} disabled={!full} aria-pressed={idea.action===action} onClick={()=>{stop();setIdea(old=>({...old,action,wired:false,completed:false}));setMessage('Action selected. Connect it to your button.');}}>{action==='portal'?'◉ Open a portal':'✧ Connect stars'}</button>)}</div>
      <pre className="workshop__code"><code>{`// Simplified example\nbutton.addEventListener("click", () => {\n  ${idea.action==='portal'?'openPortal':'connectStars'}();\n});`}</code></pre>
      <button type="button" className="workshop__next" disabled={!full||idea.wired} onClick={()=>{setIdea(old=>({...old,wired:true}));setWithoutJS(false);setMessage('Connected! Press “Awaken my idea” inside your creation.');}}>{idea.wired?'✓ Connected — try your button':'Connect action to button'}</button>
      <p className="workshop__hint">An event listener waits for a click, then calls a function. Switch JavaScript off and try again.</p>
     </>}
    </div>
    <p className="workshop__feedback" role="status" aria-live="polite" aria-atomic="true">{message}</p>
   </div>
   <div className="workshop__creation-area">
    <div className="workshop__preview-bar"><span>✦ Your creation</span><span>{idea.elements.length}/3 elements</span></div>
    <div className={`workshop__preview ${styled?`is-styled theme-${idea.theme}`:'is-plain'} ${playing?'is-playing':''} ${!idea.elements.length?'is-empty':''}`}>
     <div className="workshop__mini-site">
      {!idea.elements.length&&<div className="workshop__empty"><span aria-hidden="true">◇</span><p>An empty canvas.<br/>Your first HTML element starts the story.</p></div>}
      {idea.elements.includes('heading')&&<h3 className={tool==='html'&&highlight==='heading'?'is-highlighted':''}>Hello, new world.</h3>}
      {idea.elements.includes('text')&&<p className={tool==='html'&&highlight==='text'?'is-highlighted':''}>A little idea. A place to grow.</p>}
      {idea.elements.includes('button')&&<button type="button" className={tool==='html'&&highlight==='button'?'is-highlighted':''} onClick={launch}>{playing?'Replay the magic ↻':'Awaken my idea ↗'}</button>}
     </div>
     <div className="workshop__effect" key={run} aria-hidden="true">{playing&&(idea.action==='portal'?<div className="workshop__portal-effect"><i/><i/><span>✦</span></div>:<svg className="workshop__constellation" viewBox="0 0 200 150"><path d="M30 110L65 45L110 70L155 25L175 100L110 70L125 130L30 110"/>{[[30,110],[65,45],[110,70],[155,25],[175,100],[125,130]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" style={{'--delay':`${i*.15}s`}}/>)}</svg>)}{playing&&<div className="workshop__burst">{Array.from({length:18},(_,i)=><i key={i} style={{'--angle':`${i*20}deg`,'--delay':`${i%3*.08}s`}}/>)}</div>}</div>
    </div>
    <div className="workshop__compare" role="group" aria-label="Compare technologies"><span>What changes?</span><label><input type="checkbox" disabled={!idea.styled} checked={withoutCSS} onChange={e=>{setWithoutCSS(e.target.checked);setMessage(e.target.checked?'CSS removed from the demo: the same HTML and JavaScript still work.':'CSS restored. Your design is back.');}}/> Remove CSS</label><label><input type="checkbox" disabled={!idea.wired} checked={withoutJS} onChange={e=>{stop();setWithoutJS(e.target.checked);setMessage(e.target.checked?'JavaScript removed from the demo: press your button and compare its response.':'JavaScript restored. Your button can run its action again.');}}/> Remove JavaScript</label></div>
    <div className="workshop__tools-row"><div className="workshop__objects" role="group" aria-label="Magical tools">{TOOLS.map(t=><button type="button" key={t.id} className="workshop__object" aria-label={`Explore ${t.name}`} aria-pressed={tool===t.id} onClick={()=>setTool(t.id)}><img src={`/workshop/${t.image}`} alt="" draggable={false}/><strong>{t.name}</strong><small>{t.label}</small></button>)}</div><div className="workshop__guide"><Lumi className="workshop__lumi"/></div></div>
    <div className={`workshop__result ${idea.completed?'is-complete':''}`}><span className="workshop__artifact" aria-hidden="true">{idea.completed?'✦':'◇'}</span><p><strong>{idea.completed?'Your idea is alive.':'Structure → style → interaction'}</strong><span>{idea.completed?(saved?'Saved in this browser. Replay it or keep exploring.':'Ready for this visit. Browser storage is unavailable.'):'Build and test your creation to awaken your idea.'}</span></p><button type="button" disabled={!idea.elements.length} onClick={reset}>Start again ↺</button></div>
   </div>
  </div>
  <footer className="workshop__footer"><a href="#top" onClick={onReturn}>← Back to the portal</a><span>02 / 04 — Create your idea</span><a href="#observatory" onClick={onContinue}>Enter the observatory ↗</a></footer>
 </section>;
}
