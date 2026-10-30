import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ObservatoryTransition.css";

// Все значения — миллисекунды после загрузки изображений.
const TIMING = { approach: 5000, orbit: 5600, reveal: 7200, finish: 8000 };
const ASSETS = ["background.png", "rings.png", "foreground.png"];
const ROOT = "/transitions/observatory/";
const DUST = Array.from({ length: 56 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 17) % 100}%`,
  "--delay": `${-i * 0.19}s`,
  "--size": `${i % 7 ? 2 : 4}px`,
}));

export default function ObservatoryTransition({
  pageRef,
  onCovered,
  onComplete,
}) {
  const skipRef = useRef(null),
    finishRef = useRef(null),
    artRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [phase, setPhase] = useState("loading");
  const [fallback, setFallback] = useState(false);
  const [paused, setPaused] = useState(document.hidden);

  const parallaxActive = phase !== "loading" && phase !== "orbit" && phase !== "reveal";
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
          : t >= TIMING.orbit
            ? "orbit"
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
        setFallback(results.some((ok) => !ok));
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
  const orbit = phase === "orbit" || phase === "reveal";
  return createPortal(
    <div
      className={`orbit-passage composite-passage phase-${phase}${phase === "reveal" ? " is-revealing" : ""}${paused ? " is-paused" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="passage-title"
      onPointerMove={move}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 };
      }}
      style={{ "--passage-duration": "2400ms", "--passage-reveal": "800ms" }}
    >
      <h2 id="passage-title" className="passage-sr-only">
        From the workshop to the observatory
      </h2>
      {phase === "loading" && (
        <div className="passage-loading" role="status">
          <span aria-hidden="true">✦</span>
          <p>Preparing the next world</p>
        </div>
      )}
      {phase !== "loading" && (
        <div className="panorama" ref={artRef} aria-hidden="true">
          <div className="panorama__camera">
            <div className="panorama__canvas">
              {fallback ? (
                <img
                  className="panorama__fallback"
                  src={`${ROOT}reference.png`}
                  alt=""
                />
              ) : (
                <>
                  <div className="panorama__far">
                    <img src={`${ROOT}background.png`} alt="" />
                  </div>
                  <div className="panorama__clouds" />
                  <div className="panorama__rings">
                    <img src={`${ROOT}rings.png`} alt="" />
                  </div>
                  <div className="panorama__cards">
                    {Array.from({ length: 18 }, (_, i) => (
                      <div
                        key={i}
                        className="panorama__card"
                        style={{
                          left: `${13 + ((i * 11) % 35)}%`,
                          top: `${9 + ((i * 17) % 59)}%`,
                          "--delay": `${-i * 0.31}s`,
                          "--turn": `${((i % 5) - 2) * 8}deg`,
                          "--duration": `${5 + (i % 4)}s`,
                        }}
                      >
                        <i />
                        <span />
                        <b />
                        <span />
                        <span />
                      </div>
                    ))}
                  </div>
                  <div className="panorama__near">
                    <img src={`${ROOT}foreground.png`} alt="" />
                    <div className="panorama__tail-glow" />
                  </div>
                </>
              )}
              <div className="panorama__dust">
                {DUST.map((style, i) => (
                  <i key={i} style={style} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {orbit && (
        <div className="orbit-passage__second" aria-hidden="true">
          <div className="orbit-passage__sky" />
          <div className="orbit-passage__rings">
            <i />
            <i />
            <i />
          </div>
          <div className="orbit-passage__fragments">
            {Array.from({ length: 24 }, (_, i) => (
              <i
                key={i}
                style={{
                  "--angle": `${i * 15}deg`,
                  "--delay": `${(i % 5) * 0.04}s`,
                  "--distance": `${200 + (i % 4) * 55}px`,
                }}
              />
            ))}
          </div>
          <div className="orbit-passage__copy">
            <p>FROM IDEAS TO EXPERIENCES</p>
            <h2>A new perspective.</h2>
            <span>Entering the observatory</span>
          </div>
        </div>
      )}
      <p className="panorama__chapter" aria-hidden="true">
        02 <span>⟶</span> 03
      </p>
      <button
        ref={skipRef}
        type="button"
        className="orbit-passage__skip"
        onClick={() => finishRef.current?.()}
        aria-label="Skip both transition stages and enter the observatory"
      >
        Skip ↗
      </button>
    </div>,
    document.body,
  );
}
