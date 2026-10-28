import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ObservatoryTransition.css";

// Продолжительность именно пространства между мирами, после подхода к порталу.
const TRANSITION_MS = 4500;
const COVER_MS = 240;
const REVEAL_MS = 800;

export default function ObservatoryTransition({
  pageRef,
  onCovered,
  onComplete,
}) {
  const skipRef = useRef(null);
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
      className={`orbit-passage${revealing ? " is-revealing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="orbit-title"
      style={{
        "--passage-duration": `${TRANSITION_MS}ms`,
        "--passage-reveal": `${REVEAL_MS}ms`,
      }}
    >
      <div className="orbit-passage__sky" aria-hidden="true" />
      <div className="orbit-passage__rings" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="orbit-passage__fragments" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <i
            key={i}
            style={{
              "--angle": `${i * 15}deg`,
              "--delay": `${(i % 5) * 0.08}s`,
              "--distance": `${200 + (i % 4) * 55}px`,
            }}
          />
        ))}
      </div>
      <div className="orbit-passage__copy">
        <p>FROM IDEAS TO EXPERIENCES</p>
        <h2 id="orbit-title">A new perspective.</h2>
        <span>Entering the observatory</span>
      </div>
      <button
        ref={skipRef}
        type="button"
        className="orbit-passage__skip"
        onClick={() => finishRef.current?.()}
        aria-label="Skip transition and enter the observatory"
      >
        Skip ↗
      </button>
    </div>,
    document.body,
  );
}
