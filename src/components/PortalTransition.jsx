import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./PortalTransition.css";

// Все значения — миллисекунды после загрузки изображений.
const TIMING = { approach: 5000, title: 5600, reveal: 9200, finish: 10000 };
const ASSETS = [
  "background.png",
  "portal.png",
  "foreground.png",
  "title-background.png",
];
const ROOT = "/workshop/";
const DUST = Array.from({ length: 56 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 17) % 100}%`,
  "--delay": `${-i * 0.19}s`,
  "--size": `${i % 7 ? 2 : 4}px`,
}));

export default function PortalTransition({ pageRef, onCovered, onComplete }) {
  const skipRef = useRef(null),
    finishRef = useRef(null),
    artRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [phase, setPhase] = useState("loading");
  const [fallback, setFallback] = useState(false);
  const [paused, setPaused] = useState(document.hidden);

  const parallaxActive =
    phase !== "loading" && phase !== "title" && phase !== "reveal";
  useEffect(() => {
    if (!parallaxActive) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = null,
      x = 0,
      y = 0,
      previous = 0;
    function tick(now) {
      frame = null;
      if (document.hidden || reduce.matches) return;
      const delta = Math.min(previous ? now - previous : 16, 64);
      previous = now;
      const amount = 1 - Math.exp(-delta / 140);
      x += (pointer.current.x - x) * amount;
      y += (pointer.current.y - y) * amount;
      artRef.current?.style.setProperty("--pan-x", `${x}px`);
      artRef.current?.style.setProperty("--pan-y", `${y}px`);
      frame = requestAnimationFrame(tick);
    }
    function visibility() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previous = 0;
      if (!document.hidden && !reduce.matches)
        frame = requestAnimationFrame(tick);
    }
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [parallaxActive]);

  useEffect(() => {
    const page = pageRef.current,
      root = document.documentElement,
      body = document.body;
    const old = {
      overflow: root.style.overflow,
      behavior: root.style.scrollBehavior,
      padding: body.style.paddingRight,
      inert: page?.inert ?? false,
      focus: document.activeElement,
    };
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false,
      finished = false,
      covered = false,
      started = false;
    let accumulated = 0,
      lastStarted = null,
      timer = null,
      coverTimer = null;
    const assetTimers = [];
    const gap = innerWidth - root.clientWidth;
    if (gap > 0)
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight || "0") + gap}px`;
    root.style.overflow = "hidden";
    root.style.scrollBehavior = "auto";
    if (page) page.inert = true;
    skipRef.current?.focus({ preventScroll: true });
    function cover() {
      if (!covered) {
        covered = true;
        onCovered();
      }
    }
    function restore() {
      root.style.overflow = old.overflow;
      root.style.scrollBehavior = old.behavior;
      body.style.paddingRight = old.padding;
      if (page) page.inert = old.inert;
    }
    function finish() {
      if (finished || disposed) return;
      finished = true;
      clearTimeout(timer);
      clearTimeout(coverTimer);
      assetTimers.forEach(clearTimeout);
      cover();
      restore();
      onComplete();
    }
    finishRef.current = finish;
    function elapsed() {
      return (
        accumulated +
        (lastStarted === null ? 0 : performance.now() - lastStarted)
      );
    }
    function schedule() {
      clearTimeout(timer);
      if (finished || disposed || !started || document.hidden) return;
      const t = elapsed();
      if (t >= TIMING.finish) {
        finish();
        return;
      }
      const nextPhase =
        t >= TIMING.reveal
          ? "reveal"
          : t >= TIMING.title
            ? "title"
            : t >= TIMING.approach
              ? "approach"
              : "panorama";
      setPhase(nextPhase);
      const nextTime = Object.values(TIMING).find((value) => value > t);
      timer = setTimeout(schedule, Math.max(1, nextTime - t));
    }
    function visibility() {
      setPaused(document.hidden);
      if (document.hidden) {
        accumulated = elapsed();
        lastStarted = null;
        clearTimeout(timer);
      } else if (started) {
        lastStarted = performance.now();
        schedule();
      }
    }
    function preference() {
      if (motion.matches) finish();
    }
    function key(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        finish();
      } else if (event.key === "Tab") {
        event.preventDefault();
        skipRef.current?.focus({ preventScroll: true });
      } else if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      ) {
        if (event.key !== " " || document.activeElement !== skipRef.current)
          event.preventDefault();
        event.stopPropagation();
      }
    }
    function prevent(event) {
      event.preventDefault();
    }
    window.addEventListener("keydown", key, true);
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", preference);
    coverTimer = setTimeout(cover, 240);
    if (motion.matches) timer = setTimeout(finish, 0);
    else {
      // Время загрузки не отнимает секунды у просмотра сцены.
      Promise.all(
        ASSETS.map(
          (name) =>
            new Promise((resolve) => {
              const img = new Image();
              const timeout = setTimeout(() => resolve(false), 10000);
              assetTimers.push(timeout);
              img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
              };
              img.src = ROOT + name;
            }),
        ),
      ).then((results) => {
        if (disposed || finished) return;
        setFallback(results.slice(0, 3).some((ok) => !ok));
        started = true;
        lastStarted = document.hidden ? null : performance.now();
        setPhase("panorama");
        schedule();
      });
    }
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(coverTimer);
      assetTimers.forEach(clearTimeout);
      finishRef.current = null;
      restore();
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("wheel", prevent);
      window.removeEventListener("touchmove", prevent);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", preference);
      if (
        !finished &&
        old.focus instanceof HTMLElement &&
        old.focus.isConnected
      )
        old.focus.focus({ preventScroll: true });
    };
  }, [pageRef, onCovered, onComplete]);

  function move(event) {
    if (event.pointerType !== "mouse") return;
    pointer.current = {
      x: (event.clientX / innerWidth - 0.5) * 90,
      y: (event.clientY / innerHeight - 0.5) * 56,
    };
  }
  const titleVisible = phase === "title" || phase === "reveal";
  return createPortal(
    <div
      className={`workshop-passage phase-${phase}${phase === "reveal" ? " is-revealing" : ""}${paused ? " is-paused" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workshop-passage-title"
      onPointerMove={move}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 };
      }}
    >
      <h2 id="workshop-passage-title" className="workshop-passage__sr">
        Entering The Workshop — Where ideas come to life.
      </h2>
      {phase === "loading" && (
        <div className="workshop-passage__loading" role="status">
          <span aria-hidden="true">✦</span>
          <p>Preparing the next world</p>
        </div>
      )}
      {phase !== "loading" && (
        <div className="workshop-panorama" ref={artRef} aria-hidden="true">
          <div className="workshop-panorama__camera">
            <div className="workshop-panorama__canvas">
              {fallback ? (
                <img
                  className="workshop-panorama__fallback"
                  src={`${ROOT}reference.png`}
                  alt=""
                />
              ) : (
                <>
                  <div className="workshop-panorama__far">
                    <img src={`${ROOT}background.png`} alt="" />
                  </div>
                  <div className="workshop-panorama__portal">
                    <img src={`${ROOT}portal.png`} alt="" />
                    <div className="workshop-panorama__portal-light" />
                  </div>
                  <div className="workshop-panorama__near">
                    <img src={`${ROOT}foreground.png`} alt="" />
                    <div className="workshop-panorama__tail-light" />
                  </div>
                </>
              )}
              <div className="workshop-panorama__dust">
                {DUST.map((style, i) => (
                  <i key={i} style={style} />
                ))}
              </div>
            </div>
          </div>
          {!fallback && (
            <div className="workshop-panorama__copy">
              <p>BETWEEN WORLDS</p>
              <h2>
                Every world
                <br />
                begins with an idea.
              </h2>
            </div>
          )}
        </div>
      )}
      {titleVisible && (
        <div className="workshop-title" aria-hidden="true">
          <div className="workshop-title__background" />
          <svg
            className="workshop-title__sigil"
            viewBox="0 0 600 600"
            fill="none"
          >
            <g className="workshop-title__orbit">
              <circle cx="300" cy="300" r="253" />
              <circle cx="300" cy="300" r="240" strokeDasharray="1 12" />
              <circle cx="300" cy="300" r="220" />
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 300 300)`}>
                  <path d="M300 28 L304 43 L319 47 L304 51 L300 66 L296 51 L281 47 L296 43 Z" />
                  <circle cx="300" cy="80" r="3" />
                </g>
              ))}
            </g>
            <path d="M300 0V85 M300 515V600 M40 300H90 M510 300H560" />
            <path d="M280 77A23 23 0 0 0 320 77A20 20 0 0 1 280 77Z" />
            <circle cx="300" cy="525" r="22" />
            <path d="M300 493V557 M268 525H332 M278 503L322 547 M278 547L322 503" />
          </svg>
          <div className="workshop-title__dust">
            {DUST.slice(0, 36).map((style, i) => (
              <i key={i} style={style} />
            ))}
          </div>
          <div className="workshop-title__copy">
            <p>CHAPTER II</p>
            <h2>The Workshop</h2>
            <span className="workshop-title__rule">◇</span>
            <em>Where ideas come to life.</em>
          </div>
        </div>
      )}
      <button
        ref={skipRef}
        className="workshop-passage__skip"
        type="button"
        onClick={() => finishRef.current?.()}
        aria-label="Skip panorama and title screen and enter the workshop"
      >
        Skip ↗
      </button>
    </div>,
    document.body,
  );
}
