import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import Lumi from "./components/Lumi";
import Workshop from "./components/Workshop";
import Observatory from "./components/Observatory";
import ObservatoryTransition from "./components/ObservatoryTransition";
import PortalTransition from "./components/PortalTransition";

import Sanctuary from "./components/Sanctuary";
import SanctuaryTransition from "./components/SanctuaryTransition";

const JOURNEY_SECONDS = 6;
const DEPARTURE_SECONDS = 0.35;

function getLumiPosition(progress) {
  const secondHalf = progress > 0.5;

  const localProgress = secondHalf ? (progress - 0.5) * 2 : progress * 2;

  const start = secondHalf
    ? { x: 63, y: 60, width: 10 }
    : { x: 55, y: 64, width: 13 };

  const end = secondHalf
    ? { x: 72, y: 54, width: 6 }
    : { x: 63, y: 60, width: 10 };

  return {
    x: start.x + (end.x - start.x) * localProgress,
    y: start.y + (end.y - start.y) * localProgress,
    width: start.width + (end.width - start.width) * localProgress,
  };
}

export default function App() {
  const sceneRef = useRef(null);
  const mainRef = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const cursorFrameRef = useRef(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const parallaxFrameRef = useRef(null);
  const parallaxPositionRef = useRef({ x: 0, y: 0 });
  const exploringRef = useRef(false);
  const [isExploring, setIsExploring] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const transitionActiveRef = useRef(false);
  const [showObservatoryTransition, setShowObservatoryTransition] =
    useState(false);
  const observatoryTransitionRef = useRef(false);
  const revealObservatory = useCallback(() => {
    document
      .getElementById("observatory")
      ?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);
  const finishObservatoryTransition = useCallback(() => {
    observatoryTransitionRef.current = false;
    setShowObservatoryTransition(false);
    document.getElementById("observatory")?.focus({ preventScroll: true });
  }, []);
  function enterObservatory(event) {
    event.preventDefault();
    if (observatoryTransitionRef.current) return;
    hideCursor();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealObservatory();
      finishObservatoryTransition();
      return;
    }
    observatoryTransitionRef.current = true;
    setShowObservatoryTransition(true);
  }

  const [showSanctuaryTransition, setShowSanctuaryTransition] = useState(false);
  const sanctuaryTransitionRef = useRef(false);
  const revealSanctuary = useCallback(() => {
    document
      .getElementById("sanctuary")
      ?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);
  const finishSanctuaryTransition = useCallback(() => {
    sanctuaryTransitionRef.current = false;
    setShowSanctuaryTransition(false);
    document.getElementById("sanctuary")?.focus({ preventScroll: true });
  }, []);
  function enterSanctuary(event) {
    event.preventDefault();
    if (sanctuaryTransitionRef.current) return;
    hideCursor();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealSanctuary();
      finishSanctuaryTransition();
      return;
    }
    sanctuaryTransitionRef.current = true;
    setShowSanctuaryTransition(true);
  }

  // Прокручиваем под непрозрачным слоем: посетитель не видит скачка страницы.
  const revealWorkshop = useCallback(() => {
    document.getElementById("about")?.scrollIntoView({
      behavior: "instant",
      block: "start",
    });
  }, []);

  const finishTransition = useCallback(() => {
    transitionActiveRef.current = false;
    exploringRef.current = false;
    setShowTransition(false);
    setIsExploring(false);
    document.getElementById("about")?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    // Начинаем загрузку фона заранее, во время просмотра первого экрана.
    const image = new Image();
    image.src = "/workshop/background.png";
  }, []);

  function hideCursor() {
    if (cursorFrameRef.current !== null) {
      cancelAnimationFrame(cursorFrameRef.current);
      cursorFrameRef.current = null;
    }
    mainRef.current?.classList.remove("has-magic-cursor");
    for (const element of [cursorDotRef.current, cursorRingRef.current]) {
      if (element) element.style.opacity = "0";
    }
    cursorRingRef.current?.classList.remove("is-hovering");
  }

  function resetParallax() {
    if (parallaxFrameRef.current !== null) {
      cancelAnimationFrame(parallaxFrameRef.current);
      parallaxFrameRef.current = null;
    }
    parallaxPositionRef.current = { x: 0, y: 0 };
    sceneRef.current?.style.setProperty("--mouse-x", "0");
    sceneRef.current?.style.setProperty("--mouse-y", "0");
  }

  // Обработчики и ожидающие кадры удаляются при размонтировании.
  useEffect(() => {
    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onVisibility = () => {
      if (document.hidden) hideCursor();
    };
    const onInputChange = () => {
      hideCursor();
      resetParallax();
    };
    window.addEventListener("blur", onInputChange);
    document.addEventListener("visibilitychange", onVisibility);
    mouse.addEventListener("change", onInputChange);
    motion.addEventListener("change", onInputChange);
    return () => {
      window.removeEventListener("blur", onInputChange);
      document.removeEventListener("visibilitychange", onVisibility);
      mouse.removeEventListener("change", onInputChange);
      motion.removeEventListener("change", onInputChange);
      hideCursor();
      resetParallax();
    };
  }, []);

  useEffect(() => {
    if (!isExploring) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    let previousScrollY = window.scrollY;

    const cancelJourney = () => {
      if (transitionActiveRef.current) return;
      window.clearTimeout(timer);
      exploringRef.current = false;
      setIsExploring(false);
    };
    const finishJourney = () => {
      if (!document.getElementById("about")) {
        cancelJourney();
        return;
      }
      if (motion.matches) {
        revealWorkshop();
        finishTransition();
        return;
      }
      hideCursor();
      transitionActiveRef.current = true;
      setShowTransition(true);
    };
    const onKeyDown = (event) => {
      if (
        [
          "Escape",
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      ) {
        cancelJourney();
      }
    };
    const onScroll = () => {
      const currentY = window.scrollY;
      // При ручном возвращении вверх восстанавливаем первый экран.
      if (currentY < previousScrollY - 1) cancelJourney();
      previousScrollY = currentY;
    };
    const onMotionChange = () => {
      if (motion.matches && !transitionActiveRef.current) {
        window.clearTimeout(timer);
        finishJourney();
      }
    };
    const delay = motion.matches
      ? 0
      : (DEPARTURE_SECONDS + JOURNEY_SECONDS) * 1000 + 250;
    timer = window.setTimeout(finishJourney, delay);

    // Ручная прокрутка отменяет отложенный автоматический переход.
    window.addEventListener("wheel", cancelJourney, { passive: true });
    window.addEventListener("touchmove", cancelJourney, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    motion.addEventListener("change", onMotionChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("wheel", cancelJourney);
      window.removeEventListener("touchmove", cancelJourney);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      motion.removeEventListener("change", onMotionChange);
    };
  }, [isExploring, revealWorkshop, finishTransition]);

  function handleMouseMove(event) {
    if (exploringRef.current || event.pointerType !== "mouse") return;
    if (
      !window.matchMedia(
        "(min-width: 761px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    parallaxPositionRef.current = {
      x: (event.clientX - bounds.left) / bounds.width - 0.5,
      y: (event.clientY - bounds.top) / bounds.height - 0.5,
    };
    if (parallaxFrameRef.current !== null) return;
    parallaxFrameRef.current = requestAnimationFrame(() => {
      parallaxFrameRef.current = null;
      const { x, y } = parallaxPositionRef.current;
      sceneRef.current?.style.setProperty("--mouse-x", String(x));
      sceneRef.current?.style.setProperty("--mouse-y", String(y));
    });
  }

  function handleExplore(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (exploringRef.current) return;
    resetParallax();
    event.currentTarget.blur();
    exploringRef.current = true;
    setIsExploring(true);
  }

  function handleReturn() {
    exploringRef.current = false;
    setIsExploring(false);
    resetParallax();
  }

  function handleCursorMove(event) {
    if (
      event.pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      hideCursor();
      return;
    }
    cursorPositionRef.current = { x: event.clientX, y: event.clientY };
    const interactive =
      event.target instanceof Element &&
      event.target.closest(
        'a, button, input, select, textarea, [role="button"]',
      );
    cursorRingRef.current?.classList.toggle(
      "is-hovering",
      Boolean(interactive),
    );
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;
    // Точка следует за мышью без задержки; кольцо догоняет её по кадрам.
    const place = (element, x, y) => {
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      element.style.opacity = "1";
    };
    place(dot, event.clientX, event.clientY);
    const first = !mainRef.current?.classList.contains("has-magic-cursor");
    mainRef.current?.classList.add("has-magic-cursor");
    if (first) {
      ring.dataset.x = String(event.clientX);
      ring.dataset.y = String(event.clientY);
    }
    if (cursorFrameRef.current !== null) return;
    let previous = performance.now();
    function tick(now) {
      const target = cursorPositionRef.current;
      const amount = 1 - Math.exp(-Math.min(now - previous, 64) / 55);
      previous = now;
      const x = Number(ring.dataset.x) + (target.x - Number(ring.dataset.x)) * amount;
      const y = Number(ring.dataset.y) + (target.y - Number(ring.dataset.y)) * amount;
      ring.dataset.x = String(x);
      ring.dataset.y = String(y);
      place(ring, x, y);
      cursorFrameRef.current = Math.hypot(target.x - x, target.y - y) > 0.1
        ? requestAnimationFrame(tick) : null;
    }
    cursorFrameRef.current = requestAnimationFrame(tick);
  }

  return (
    <main
      ref={mainRef}
      onPointerMove={handleCursorMove}
      onPointerLeave={hideCursor}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") hideCursor();
      }}
    >
      <div className="magic-cursor" aria-hidden="true">
        <span className="magic-cursor__dot" ref={cursorDotRef} />
        <span className="magic-cursor__ring" ref={cursorRingRef} />
      </div>
      <section
        className={isExploring ? "hero is-exploring" : "hero"}
        style={{
          "--journey-duration": `${JOURNEY_SECONDS}s`,
          "--departure-delay": `${DEPARTURE_SECONDS}s`,
        }}
        id="top"
        aria-labelledby="hero-title"
        onPointerMove={handleMouseMove}
        onPointerLeave={resetParallax}
      >
        {/* Декоративные слои: дальний фон, долина, портал, передний план. */}
        <div className="scene" ref={sceneRef} aria-hidden="true">
          <img
            className="scene__layer"
            src="/scene/01-distant-landscape.png"
            alt=""
          />
          <img
            className="scene__layer"
            src="/scene/02-middle-valley.png"
            alt=""
          />
          <div className="magic-birds" aria-hidden="true">
            {[0, 1, 2].map((birdIndex) => (
              <div
                className={`magic-bird magic-bird--${birdIndex + 1}`}
                key={birdIndex}
              >
                <div className="magic-bird__trail">
                  {Array.from({ length: 10 }, (_, index) => (
                    <span
                      key={index}
                      style={{
                        "--trail-delay": `${-index * 0.32 - birdIndex * 0.4}s`,
                        "--trail-duration": `${2.8 + (index % 3) * 0.4}s`,
                        "--trail-drift": `${((index % 5) - 2) * 7}px`,
                        "--trail-size": `${index % 3 === 0 ? 3 : 2}px`,
                      }}
                    />
                  ))}
                </div>
                <div className="magic-bird__sprite" />
              </div>
            ))}
          </div>
          <div className="portal">
            <div className="portal__view">
              <img src="/scene/04-world-beyond.png" alt="" />
            </div>
            <img
              className="portal__frame"
              src="/scene/03-portal-frame.png"
              alt=""
            />
            {/* Позиции частиц постоянные: каждый рендер не меняет анимацию. */}
            <div className="portal__particles">
              {Array.from({ length: 60 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    "--x": `${18 + ((index * 17) % 66)}%`,
                    "--delay": `${-index * 0.7}s`,
                    "--duration": `${5 + (index % 5)}s`,
                    "--drift": `${((index % 3) - 1) * 28}px`,
                  }}
                />
              ))}
            </div>
          </div>
          <img
            className="scene__layer scene__foreground"
            src="/scene/05-foreground-stairway.png"
            alt=""
          />
          {/* Затемнение под текстом помогает сохранить читаемость. */}
          <div className="hero__shade" aria-hidden="true" />
          <div className="lumi-footprints" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => {
              const progress = index / 11;
              const position = getLumiPosition(progress);

              const side = index % 2 === 0 ? -1 : 1;

              // Приблизительная точка опоры лап внутри кадра.
              const footX = position.x + position.width * 0.7;

              // Перевод высоты картинки в проценты высоты сцены.
              const footY =
                position.y + position.width * (6 / 5) * (1672 / 941) * 0.85;

              return (
                <span
                  className="lumi-footprint"
                  key={index}
                  style={{
                    "--step-x": `${footX + side * position.width * 0.035}%`,
                    "--step-y": `${footY}%`,
                    "--step-delay": `${
                      DEPARTURE_SECONDS + progress * JOURNEY_SECONDS + 0.15
                    }s`,
                    "--step-scale": position.width / 13,
                  }}
                >
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              );
            })}
          </div>
          <Lumi />
        </div>{" "}
        {/* конец scene */}
        <header className="header">
          <a
            className="brand"
            href="#top"
            onClick={handleReturn}
            tabIndex={isExploring ? -1 : undefined}
            aria-label="Beyond the Screen — home"
          >
            <span className="brand__mark" aria-hidden="true">
              ✦
            </span>
            <span>Beyond the Screen</span>
          </a>
          <a
            className="text-link"
            href="#about"
            tabIndex={isExploring ? -1 : undefined}
          >
            About the project <span aria-hidden="true">↗</span>
          </a>
        </header>
        <div className="hero__content">
          <div className="hero__copy">
            <div className="title-dust title-dust--back" aria-hidden="true">
              {Array.from({ length: 72 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    "--dust-x": `${(index * 37) % 100}%`,
                    "--dust-y": `${(index * 23) % 100}%`,
                    "--dust-size": `${2 + (index % 3)}px`,
                    "--dust-duration": `${8 + (index % 5)}s`,
                    "--dust-delay": `${-index * 0.73}s`,
                  }}
                />
              ))}
            </div>
            <p className="eyebrow">Code meets creativity</p>
            <h1 id="hero-title">
              Every idea
              <br />
              opens a<br />
              <span>new world</span>
            </h1>
            <div className="title-dust title-dust--front" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    "--dust-x": `${(index * 37 + 11) % 100}%`,
                    "--dust-y": `${(index * 23 + 7) % 100}%`,
                    "--dust-size": `${2 + (index % 2)}px`,
                    "--dust-duration": `${10 + (index % 5)}s`,
                    "--dust-delay": `${-index * 1.3}s`,
                  }}
                />
              ))}
            </div>
            <p className="hero__description">
              An interactive journey into my future in frontend.
            </p>
            <a
              className="explore-button"
              href="#about"
              onClick={handleExplore}
              tabIndex={isExploring ? -1 : undefined}
              aria-disabled={isExploring || undefined}
            >
              Explore the World <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="hero__footer">
          <span className="chapter">
            <b>01</b> / 04 <span className="chapter__line" aria-hidden="true" />
          </span>
          <a
            className="scroll-link"
            href="#about"
            tabIndex={isExploring ? -1 : undefined}
          >
            Scroll to discover <span aria-hidden="true">↓</span>
          </a>
          <span className="chapter-name">The Portal</span>
        </div>
      </section>

      <Workshop onReturn={handleReturn} onContinue={enterObservatory} />
      <Observatory onContinue={enterSanctuary} />
      <Sanctuary />
      {showSanctuaryTransition && (
        <SanctuaryTransition
          pageRef={mainRef}
          onCovered={revealSanctuary}
          onComplete={finishSanctuaryTransition}
        />
      )}
      {showObservatoryTransition && (
        <ObservatoryTransition
          pageRef={mainRef}
          onCovered={revealObservatory}
          onComplete={finishObservatoryTransition}
        />
      )}
      {showTransition && (
        <PortalTransition
          pageRef={mainRef}
          onCovered={revealWorkshop}
          onComplete={finishTransition}
        />
      )}
    </main>
  );
}
