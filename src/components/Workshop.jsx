import { useEffect, useRef, useState } from "react";
import Lumi from "./Lumi";
import "./Workshop.css";

const OBJECTS = [
  {
    id: "html",
    title: "HTML",
    subtitle: "Structure",
    image: "html-crystal.png",
    number: 1,
  },
  {
    id: "css",
    title: "CSS",
    subtitle: "Style",
    image: "css-palette.png",
    number: 2,
  },
  {
    id: "js",
    title: "JavaScript",
    subtitle: "Interaction",
    image: "js-orb.png",
    number: 3,
  },
];
const THEMES = ["lavender", "ocean", "sunset"];
const EXPLANATIONS = [
  "Start with the blue crystal. Give your idea a structure, a style and a little life.",
  "HTML gives a page its structure: a heading, some content and a button. Now choose the palette.",
  "CSS shapes how a page looks. Click the palette again to try another colour, then activate the golden sphere.",
  "JavaScript makes a page respond. Try the button in your little website — you have built something interactive.",
];

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
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useState(0);
  const [opened, setOpened] = useState(false);
  const [round, setRound] = useState(0);
  useWorkshopParallax(sectionRef, stageRef);

  function activate(item) {
    if (item.number > step + 1) return;
    setSelected(item.id);
    if (item.id === "css" && step >= 2)
      setTheme((value) => (value + 1) % THEMES.length);
    setStep((value) => Math.max(value, item.number));
  }
  function reset() {
    setStep(0);
    setSelected(null);
    setTheme(0);
    setOpened(false);
    setRound((value) => value + 1);
  }

  return (
    <section
      className="workshop workshop--paused"
      id="about"
      aria-labelledby="workshop-title"
      tabIndex={-1}
      ref={sectionRef}
    >
      <div className="workshop__copy">
        <p className="workshop__eyebrow">02 — The Workshop</p>
        <h2 id="workshop-title">
          Ideas become
          <br />
          <em>experiences.</em>
        </h2>
        <p className="workshop__intro">
          I’m Alexander, an IT student and an aspiring frontend developer. I’m
          learning how design, code and interaction work together.
        </p>
        <p className="workshop__goal">
          My goal is to create websites that are clear, useful and exciting to
          explore.
        </p>
        <div className="workshop__instruction">
          <span className="workshop__instruction-label">
            Build a little world
          </span>
          <p aria-live="polite" aria-atomic="true">
            {EXPLANATIONS[step]}
          </p>
          <div
            className="workshop__progress"
            aria-label={`${step} of 3 steps completed`}
          >
            {[1, 2, 3].map((number) => (
              <span
                key={number}
                className={step >= number ? "is-complete" : ""}
                aria-hidden="true"
              />
            ))}
          </div>
          <button
            type="button"
            className="workshop__reset"
            onClick={reset}
            disabled={step === 0}
          >
            Start again <span aria-hidden="true">↺</span>
          </button>
        </div>
      </div>

      <div className="workshop__scene">
        <div className="workshop__stage" ref={stageRef}>
          <img
            className="workshop__layer workshop__landscape"
            src="/workshop/01-landscape.png"
            alt=""
            decoding="async"
            draggable={false}
          />
          <img
            className="workshop__layer workshop__room"
            src="/workshop/02-room.png"
            alt=""
            decoding="async"
            draggable={false}
          />
          <div className="workshop__dust" aria-hidden="true">
            {Array.from({ length: 30 }, (_, index) => (
              <span
                key={index}
                style={{
                  "--dx": `${(index * 31) % 100}%`,
                  "--dy": `${(index * 47) % 100}%`,
                  "--duration": `${10 + (index % 7)}s`,
                  "--delay": `${-index * 0.9}s`,
                }}
              />
            ))}
          </div>
          <img
            className="workshop__layer workshop__table"
            src="/workshop/03-table.png"
            alt=""
            decoding="async"
            draggable={false}
          />
          <Lumi className="workshop__lumi" />

          <div className="workshop__preview-anchor">
            <div
              className={`workshop__preview theme-${THEMES[theme]} ${step >= 2 ? "is-styled" : ""} ${step === 3 ? "is-alive" : ""}`}
            >
              <div className="workshop__preview-bar">
                <span />
                <span />
                <span />
                <span className="workshop__preview-caption">
                  Your little world
                </span>
              </div>
              {step === 0 ? (
                <div className="workshop__empty">
                  <span aria-hidden="true">✧</span>
                  <p>
                    Every creation starts
                    <br />
                    with an idea.
                  </p>
                </div>
              ) : (
                <div className="workshop__mini-site">
                  <div className="workshop__mini-art" aria-hidden="true">
                    <span>✦</span>
                  </div>
                  <p className="workshop__mini-label">A new beginning</p>
                  <h3>Hello, new world.</h3>
                  <p>A little idea. A place to grow.</p>
                  <button
                    type="button"
                    disabled={step < 3}
                    aria-expanded={opened}
                    aria-controls="workshop-mini-message"
                    onClick={() => setOpened((value) => !value)}
                  >
                    {opened ? "Close the discovery" : "Make something happen"}{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                  <p
                    id="workshop-mini-message"
                    className="workshop__mini-message"
                    hidden={!opened}
                  >
                    You brought this little world to life.
                  </p>
                </div>
              )}
              {step === 3 && (
                <div
                  className="workshop__completion"
                  key={round}
                  aria-hidden="true"
                >
                  {Array.from({ length: 12 }, (_, index) => (
                    <i
                      key={index}
                      style={{
                        "--angle": `${index * 30}deg`,
                        "--burst-delay": `${(index % 3) * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className="workshop__objects"
            role="group"
            aria-label="Build your website in three steps"
          >
            {OBJECTS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`workshop__object workshop__object--${item.id} ${step >= item.number ? "is-activated" : ""} ${selected === item.id ? "is-selected" : ""}`}
                onClick={() => activate(item)}
                disabled={item.number > step + 1}
                aria-pressed={selected === item.id}
                aria-label={`${item.title}: ${item.subtitle}${item.id === "css" && step >= 2 ? ". Click to change colour" : ""}`}
              >
                <span className="workshop__object-halo" aria-hidden="true" />
                <img
                  src={`/workshop/${item.image}`}
                  alt=""
                  decoding="async"
                  draggable={false}
                />
                <span className="workshop__object-label">
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="workshop__shade" aria-hidden="true" />
      <footer className="workshop__footer">
        <a href="#top" onClick={onReturn}>
          ← Back to the portal
        </a>
        <a href="#observatory" onClick={onContinue}>
          Enter the observatory ↗
        </a>
        <span>
          02 / 04 <span aria-hidden="true">—</span> The Workshop
        </span>
      </footer>
    </section>
  );
}
