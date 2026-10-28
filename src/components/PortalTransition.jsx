import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./PortalTransition.css";

// Продолжительность именно пространства между мирами, после подхода к порталу.
const TRANSITION_MS = 7000;
const COVER_MS = 240;
const REVEAL_MS = 800;

const PARTICLES = Array.from({ length: 64 }, (_, index) => {
  const angle = index * 2.399963;
  const distance = 45 + (index % 9) * 7;
  return {
    "--px": `${Math.cos(angle) * distance}vw`,
    "--py": `${Math.sin(angle) * distance}vh`,
    "--particle-delay": `${-(index % 17) * 0.16}s`,
    "--particle-size": `${index % 7 === 0 ? 4 : 2}px`,
  };
});

export default function PortalTransition({ pageRef, onCovered, onComplete }) {
  const skipRef = useRef(null);
  const artRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  // Плавная интерполяция: события мыши только задают цель, rAF двигает слои.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame;
    let x = 0;
    let y = 0;
    let previous = performance.now();
    function tick(now) {
      const amount = 1 - Math.exp(-Math.min(now - previous, 64) / 110);
      previous = now;
      x += (pointer.current.x - x) * amount;
      y += (pointer.current.y - y) * amount;
      artRef.current?.style.setProperty("--depth-x", `${x}px`);
      artRef.current?.style.setProperty("--depth-y", `${y}px`);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function movePointer(event) {
    if (event.pointerType !== "mouse") return;
    pointer.current = {
      x: (event.clientX / window.innerWidth - 0.5) * 90,
      y: (event.clientY / window.innerHeight - 0.5) * 60,
    };
  }
  const finishRef = useRef(null);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    const page = pageRef.current;
    const root = document.documentElement;
    const body = document.body;
    const previousOverflow = root.style.overflow;
    const previousBehavior = root.style.scrollBehavior;
    const previousPadding = body.style.paddingRight;
    const previousInert = page?.inert ?? false;
    const previousFocus = document.activeElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const startedAt = performance.now();
    const timers = [];
    let covered = false;
    let finished = false;
    let restored = false;

    const scrollbar = window.innerWidth - root.clientWidth;
    if (scrollbar > 0) {
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight || "0") + scrollbar}px`;
    }
    root.style.overflow = "hidden";
    root.style.scrollBehavior = "auto";
    if (page) page.inert = true;
    skipRef.current?.focus({ preventScroll: true });

    function cover() {
      if (covered) return;
      covered = true;
      onCovered();
    }
    function restore() {
      if (restored) return;
      restored = true;
      root.style.overflow = previousOverflow;
      root.style.scrollBehavior = previousBehavior;
      body.style.paddingRight = previousPadding;
      if (page) page.inert = previousInert;
    }
    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(window.clearTimeout);
      cover();
      restore();
      onComplete();
    }
    finishRef.current = finish;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        finish();
      } else if (event.key === "Tab") {
        // Единственная кнопка диалога — Skip; фокус не уходит за оверлей.
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
        // Space на Skip сохраняет стандартное нажатие кнопки.
        if (event.key !== " " || document.activeElement !== skipRef.current)
          event.preventDefault();
        event.stopPropagation();
      }
    }
    function preventScroll(event) {
      event.preventDefault();
    }
    function onMotionChange() {
      if (motion.matches) finish();
    }
    function onVisibility() {
      if (!document.hidden && performance.now() - startedAt >= TRANSITION_MS)
        finish();
    }
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotionChange);

    if (motion.matches) timers.push(window.setTimeout(finish, 0));
    else {
      timers.push(window.setTimeout(cover, COVER_MS));
      timers.push(
        window.setTimeout(() => setRevealing(true), TRANSITION_MS - REVEAL_MS),
      );
      timers.push(window.setTimeout(finish, TRANSITION_MS));
    }
    return () => {
      timers.forEach(window.clearTimeout);
      finishRef.current = null;
      restore();
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotionChange);
      if (
        !finished &&
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [pageRef, onCovered, onComplete]);

  return createPortal(
    <div
      className={`between-worlds${revealing ? " is-revealing" : ""}`}
      onPointerMove={movePointer}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 };
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="between-title"
      aria-describedby="between-description"
      style={{
        "--between-duration": `${TRANSITION_MS}ms`,
        "--between-reveal": `${REVEAL_MS}ms`,
      }}
    >
      <div className="between-worlds__art" ref={artRef} aria-hidden="true">
        <div className="between-worlds__camera">
          <div className="between-worlds__plate">
            <img
              className="between-worlds__background"
              src="/transitions/between-worlds.png"
              alt=""
            />
            <div className="between-worlds__portal-light" />
            <div className="between-worlds__tail-light" />
            <div className="between-worlds__tail-sparks">
              {Array.from({ length: 24 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    "--i": i,
                    left: `${42 + ((i * 7) % 22)}%`,
                    top: `${56 + ((i * 11) % 22)}%`,
                  }}
                />
              ))}
            </div>
            <div className="between-worlds__printed-skip-cover" />
          </div>
          <div className="between-worlds__particles">
            {PARTICLES.map((style, index) => (
              <span key={index} style={style} />
            ))}
          </div>
          <div className="between-worlds__near-dust">
            {PARTICLES.slice(0, 18).map((style, index) => (
              <span key={index} style={style} />
            ))}
          </div>
        </div>
      </div>
      <div className="between-worlds__copy">
        <p className="between-worlds__eyebrow">Between worlds</p>
        <h2 id="between-title">
          Every world begins
          <br />
          with an idea.
        </h2>
        <p id="between-description">Entering the workshop</p>
      </div>
      <button
        ref={skipRef}
        type="button"
        className="between-worlds__skip"
        onClick={() => finishRef.current?.()}
        aria-label="Skip transition and enter the workshop"
      >
        Skip <span aria-hidden="true">↗</span>
      </button>
    </div>,
    document.body,
  );
}
