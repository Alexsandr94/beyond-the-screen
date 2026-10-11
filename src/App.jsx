import { useRef, useState } from 'react'
import './App.css'

export default function App() {
  const sceneRef = useRef(null)
  const [isExploring, setIsExploring] = useState(false)
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)
  function handleMouseMove(event) {
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
        <span className="magic-cursor__dot" />
        <span className="magic-cursor__ring" />
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
        </div>

        {/* Затемнение под текстом помогает сохранить читаемость. */}
        <div className="hero__shade" aria-hidden="true" />

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
              <span>new world.</span>
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
          <a className="text-link" href="#top">Back to the portal <span aria-hidden="true">↑</span></a>
        </div>
      </section>
    </main>
  )
}
