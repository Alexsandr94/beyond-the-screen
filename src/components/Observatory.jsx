import { useEffect, useRef, useState } from "react";
import Lumi from "./Lumi";
import "./Observatory.css";

const THEMES = [
  { name: "Moonlight", colour: "#b9dfff", second: "#c6b6ff" },
  { name: "Aurora", colour: "#a5f2dc", second: "#97b9ff" },
  { name: "Stardust", colour: "#ffdcad", second: "#e8b6f6" },
];
const STARS = Array.from({ length: 48 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 61 + 7) % 100}%`,
  "--delay": `${-i * 0.43}s`,
  "--size": `${i % 5 === 0 ? 3 : 1.5}px`,
}));

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

export default function Observatory() {
  const sectionRef = useRef(null),
    stageRef = useRef(null);
  const [theme, setTheme] = useState(0);
  const [depth, setDepth] = useState(65);
  const [motion, setMotion] = useState(true);
  const [discovered, setDiscovered] = useState(false);
  const [research, setResearch] = useState(false);
  useObservatoryMotion(sectionRef, stageRef, motion, depth);
  function reset() {
    setTheme(0);
    setDepth(65);
    setMotion(true);
    setDiscovered(false);
  }
  function back(e) {
    e.preventDefault();
    const target = document.getElementById("about");
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <section
      id="observatory"
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="observatory-title"
      className="observatory observatory--paused"
      style={{
        "--obs-accent": THEMES[theme].colour,
        "--obs-secondary": THEMES[theme].second,
      }}
    >
      <div className="observatory__scene" ref={stageRef}>
        <img
          className="observatory__background"
          src="/observatory/observatory-sky.png"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <img
          className="observatory__room"
          src="/observatory/observatory-room.png"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="observatory__stars" aria-hidden="true">
          {STARS.map((style, i) => (
            <i key={i} style={style} />
          ))}
        </div>
        <div className="observatory__shade" />
        <div className="observatory__instrument">
          <div className="observatory__orbits" aria-hidden="true">
            <i />
            <i />
            <i />
            <span className="observatory__satellite" />
            <span className="observatory__satellite second" />
          </div>
          <div className="observatory__screen">
            <div className="observatory__window-bar">
              <span>✦ AURORA</span>
              <span>EXPERIMENT 03</span>
            </div>
            <div className="observatory__mini-art" aria-hidden="true">
              <div className="observatory__moon" />
              <div className="observatory__mountains" />
            </div>
            <div className="observatory__mini-copy">
              <p>A little world of possibilities</p>
              <h3>
                A more
                <br />
                <em>human web.</em>
              </h3>
              <p>Thoughtful details make a difference.</p>
              <button
                type="button"
                aria-expanded={discovered}
                aria-controls="observatory-discovery"
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  event.currentTarget.focus({ preventScroll: true });
                }}
                onClick={() => setDiscovered((v) => !v)}
              >
                {discovered ? "Close the discovery" : "Discover a detail"}{" "}
                <span aria-hidden="true">↗</span>
              </button>
              <p
                id="observatory-discovery"
                className="observatory__discovery"
                hidden={!discovered}
              >
                A website can respond to you — and still feel simple to use.
              </p>
            </div>
          </div>
          <div className="observatory__platform" aria-hidden="true" />
        </div>
        <Lumi className="observatory__lumi" />
        <div className="observatory__foreground" aria-hidden="true">
          {STARS.slice(0, 12).map((style, i) => (
            <i key={i} style={style} />
          ))}
        </div>
      </div>
      <div className="observatory__copy">
        <p className="observatory__eyebrow">03 — The Observatory</p>
        <h2 id="observatory-title">
          Design changes
          <br />
          <em>how we feel.</em>
        </h2>
        <p>
          The same idea can feel calm, mysterious or full of energy. Explore how
          colour, depth and movement change this little world.
        </p>
        <p className="observatory__personal">
          As a future frontend developer, I want to combine creativity with
          clear, comfortable interaction.
        </p>
        <button
          className="observatory__research-toggle"
          type="button"
          aria-expanded={research}
          aria-controls="observatory-research"
          onClick={() => setResearch((v) => !v)}
        >
          What makes a website memorable?{" "}
          <span aria-hidden="true">{research ? "−" : "+"}</span>
        </button>
        <div
          id="observatory-research"
          hidden={!research}
          className="observatory__research"
        >
          <p className="observatory__eyebrow">Websites as Art</p>
          <p>
            My survey explores what people notice first, which devices they use,
            and which websites they remember.
          </p>
          <p>
            The results will help me compare my design choices with visitors’
            preferences.
          </p>
        </div>
      </div>
      <fieldset className="observatory__controls">
        <legend>Shape the experience</legend>
        <button
          className="observatory__colour"
          type="button"
          onClick={() => setTheme((v) => (v + 1) % THEMES.length)}
        >
          <span aria-hidden="true">◈</span>
          <strong>Colour</strong>
          <small>{THEMES[theme].name}</small>
        </button>
        <label className="observatory__depth">
          <strong>
            Depth <output>{depth}%</output>
          </strong>
          <input
            aria-label="Parallax depth"
            type="range"
            min="0"
            max="100"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
          <small>Move your pointer to explore</small>
        </label>
        <button
          className="observatory__motion"
          type="button"
          aria-pressed={motion}
          onClick={() => setMotion((v) => !v)}
        >
          <span aria-hidden="true">✧</span>
          <strong>Motion</strong>
          <small>
            {motion ? "On · click to pause" : "Off · click to resume"}
          </small>
        </button>
        <button type="button" className="observatory__reset" onClick={reset}>
          Reset ↺
        </button>
        <span className="observatory__status" aria-live="polite">
          {THEMES[theme].name} palette. Depth {depth}%. Motion{" "}
          {motion ? "on" : "off"}.
        </span>
      </fieldset>
      <footer className="observatory__footer">
        <a href="#about" onClick={back}>
          ← Back to the workshop
        </a>
        <span>03 / 04 — The Observatory</span>
      </footer>
    </section>
  );
}
