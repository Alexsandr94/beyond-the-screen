import { useRef, useState } from 'react'
import './App.css'

export default function App() {
  const sceneRef = useRef(null)
  const [isExploring, setIsExploring] = useState(false)
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)
  function handleMouseMove(event) {
    if (isExploring) return
  const scene = sceneRef.current
  if (!scene) return

  const bounds = event.currentTarget.getBoundingClientRect()

  const x = (event.clientX - bounds.left) / bounds.width - 0.5
  const y = (event.clientY - bounds.top) / bounds.height - 0.5

  scene.style.setProperty('--mouse-x', x)
  scene.style.setProperty('--mouse-y', y)
}

function handleMouseLeave() {
  const scene = sceneRef.current
  if (!scene) return

  scene.style.setProperty('--mouse-x', 0)
  scene.style.setProperty('--mouse-y', 0)
}
  function handleExplore(event) {
  event.preventDefault()

  const scene = sceneRef.current

  if (scene) {
    scene.style.setProperty('--mouse-x', 0)
    scene.style.setProperty('--mouse-y', 0)
  }

  setIsExploring(true)
}

  function handleCursorMove(event) {
  const dot = cursorDotRef.current
  const ring = cursorRingRef.current

  if (!dot || !ring) return

  const x = `${event.clientX}px`
  const y = `${event.clientY}px`

  dot.style.left = x
  dot.style.top = y

  ring.style.left = x
  ring.style.top = y

  dot.style.opacity = '1'
  ring.style.opacity = '1'

  const isInteractive = event.target.closest('a, button')

  ring.classList.toggle('is-hovering', Boolean(isInteractive))
}

function handleCursorLeave() {
  const dot = cursorDotRef.current
  const ring = cursorRingRef.current

  if (!dot || !ring) return

  dot.style.opacity = '0'
  ring.style.opacity = '0'
  ring.classList.remove('is-hovering')
}

  return (
      <main
        onMouseMove={handleCursorMove}
        onMouseLeave={handleCursorLeave}
      >
      <div className="magic-cursor" aria-hidden="true">
        <span className="magic-cursor__dot" ref={cursorDotRef} />
        <span className="magic-cursor__ring" ref={cursorRingRef} />
      </div>
      <section
          className={isExploring ? 'hero is-exploring' : 'hero'}
          id="top"
          aria-labelledby="hero-title"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
      >
        {/* Декоративные слои: дальний фон, долина, портал, передний план. */}
        <div className="scene" ref={sceneRef} aria-hidden="true">
          <img className="scene__layer" src="/scene/01-distant-landscape.png" alt="" />
          <img className="scene__layer" src="/scene/02-middle-valley.png" alt="" />

          <div className="portal">
            <div className="portal__view">
              <img src="/scene/04-world-beyond.png" alt="" />
            </div>
            <img className="portal__frame" src="/scene/03-portal-frame.png" alt="" />
            {/* Позиции частиц постоянные: каждый рендер не меняет анимацию. */}
            <div className="portal__particles">
              {Array.from({ length: 60 }, (_, index) => (
                <span key={index} style={{
                  '--x': `${18 + (index * 17) % 66}%`,
                  '--delay': `${-index * 0.7}s`,
                  '--duration': `${5 + index % 5}s`,
                  '--drift': `${(index % 3 - 1) * 28}px`,
                }} />
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
            <div className="lumi">
              <div className="lumi-footprints" aria-hidden="true">
                {Array.from({ length: 12 }, (_, index) => {
                  const progress = index / 11

                  return (
                    <span
                      className="lumi-footprint"
                      key={index}
                      style={{
                        '--step-x': `${63 + progress * 12 + (index % 2 ? 0.4 : -0.4)}%`,
                        '--step-y': `${85 - progress * 20}%`,
                        '--step-delay': `${0.2 + progress * 5.4}s`,
                        '--step-scale': 1 - progress * 0.45,
                      }}
                    >
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  )
                })}
              </div>
            <div className="lumi__walk" />
            <div className="lumi__idle">
          <img
            className="lumi__ear lumi__ear--left"
            src="/characters/lumi-ear-left.png"
            alt=""
            draggable={false}
          />

          <img
            className="lumi__ear lumi__ear--right"
            src="/characters/lumi-ear-right.png"
            alt=""
            draggable={false}
          />

          <img
            className="lumi__image"
            src="/characters/lumi-body.png"
            alt=""
            draggable={false}
          />
          <img
            className="lumi__blink"
            src="/characters/lumi-blink.png"
            alt=""
            draggable={false}
          />
          <img
            className="lumi__glow"
            src="/characters/lumi-glow.png"
            alt=""
            draggable={false}
          />

          <svg
            className="lumi__magic"
            viewBox="0 0 100 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
              {[
                
                  // Хвост слева.
                  "M 29 70 C 17 62, 3 73, 9 85 S 29 94, 22 106",
                  "M 27 68 C 13 63, 1 77, 8 88 S 26 97, 22 106",
                  "M 30 73 C 20 66, 7 74, 12 84 S 31 95, 22 106",

                  // Верхний хвост справа.
                  "M 65 64 C 75 51, 91 57, 96 70 C 99 78, 96 84, 92 85",
                  "M 67 66 C 78 56, 89 61, 93 72 C 97 79, 95 83, 92 85",
                  "M 64 68 C 76 60, 86 64, 91 75 C 94 80, 94 83, 92 85",

                  // Нижний хвост справа.
                  "M 62 82 C 77 78, 98 92, 95 104 C 94 113, 77 110, 73 117",
                  "M 64 85 C 78 82, 94 94, 92 103 C 91 110, 78 109, 73 117",
                  "M 63 88 C 76 86, 89 96, 88 103 C 87 108, 77 110, 73 117",
                ].map((path, trailIndex) =>
                Array.from({ length: 10 }, (_, index) => {
                  const duration = 10 + (trailIndex % 3) * 1.2
                  const begin = -(index * duration / 10 + trailIndex * 0.17)

                  return (
                    <circle
                      key={`${trailIndex}-${index}`}
                      r={index % 4 === 0 ? 0.65 : 0.38}
                      fill={trailIndex === 1 ? '#dfbaff' : '#fff5ff'}
                    >
                      <animateMotion
                        dur={`${duration}s`}
                        begin={`${begin}s`}
                        repeatCount="indefinite"
                        path={path}
                      />

                      <animate
                        attributeName="opacity"
                        values="0;1;1;0"
                        keyTimes="0;0.15;0.75;1"
                        dur={`${duration}s`}
                        begin={`${begin}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )
                })
              )}
          </svg>

          <div className="lumi__particles">
            {Array.from({ length: 18 }, (_, index) => (
              <span
                key={index}
                style={{
                  '--x': `${10 + (index * 19) % 80}%`,
                  '--delay': `${-index * 0.6}s`,
                  '--duration': `${3 + index % 4}s`,
                  '--drift': `${(index % 5 - 2) * 8}px`,
                }}
              />
            ))}
          </div> {/* конец lumi__particles */}
        </div> {/* конец lumi__idle */}
      </div> {/* конец lumi */}
    </div> {/* конец scene */}
        

        

        <header className="header">
          <a className="brand" href="#top" aria-label="Beyond the Screen — home">
            <span className="brand__mark" aria-hidden="true">✦</span>
            <span>Beyond the Screen</span>
          </a>
          <a className="text-link" href="#about">About the project <span aria-hidden="true">↗</span></a>
        </header>

        <div className="hero__content">
          <div className="hero__copy">
            <p className="eyebrow">Code meets creativity</p>
            <h1 id="hero-title">
              Every idea<br />
              opens a<br />
              <span>new world</span>
            </h1>
            <p className="hero__description">
              An interactive journey into my future in frontend.
            </p>
            <a
              className="explore-button"
              href="#about"
              onClick={handleExplore}
            >
              Explore the World <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="hero__footer">
          <span className="chapter"><b>01</b> / 04 <span className="chapter__line" aria-hidden="true" /></span>
          <a className="scroll-link" href="#about">Scroll to discover <span aria-hidden="true">↓</span></a>
          <span className="chapter-name">The Portal</span>
        </div>
      </section>

      {/* Ссылка href="#about" прокручивает страницу к этому блоку. */}
      <section className="about" id="about" aria-labelledby="about-title">
        <p className="eyebrow">My Career Aspiration</p>
        <div>
          <h2 id="about-title">Frontend can be <em>art.</em></h2>
          <p>
            I’m Alexander. I want to become a frontend developer and build
            websites that people enjoy exploring.
          </p>
          <p>
            Beyond the Screen is my project about the creative side of frontend:
            how design, code and interaction can bring an idea to life.
          </p>
          <a
            className="text-link"
            href="#top"
            onClick={() => setIsExploring(false)}
          >Back to the portal <span aria-hidden="true">↑</span></a>
        </div>
      </section>
    </main>
  )
}
