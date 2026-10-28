export default function Lumi({ className = '' }) {
  return (
    <div className={`lumi ${className}`} aria-hidden="true">
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
            'M 29 70 C 17 62, 3 73, 9 85 S 29 94, 22 106',
            'M 27 68 C 13 63, 1 77, 8 88 S 26 97, 22 106',
            'M 30 73 C 20 66, 7 74, 12 84 S 31 95, 22 106',

            // Верхний хвост справа.
            'M 65 64 C 75 51, 91 57, 96 70 C 99 78, 96 84, 92 85',
            'M 67 66 C 78 56, 89 61, 93 72 C 97 79, 95 83, 92 85',
            'M 64 68 C 76 60, 86 64, 91 75 C 94 80, 94 83, 92 85',

            // Нижний хвост справа.
            'M 62 82 C 77 78, 98 92, 95 104 C 94 113, 77 110, 73 117',
            'M 64 85 C 78 82, 94 94, 92 103 C 91 110, 78 109, 73 117',
            'M 63 88 C 76 86, 89 96, 88 103 C 87 108, 77 110, 73 117',
          ].map((path, trailIndex) =>
            Array.from({ length: 10 }, (_, index) => {
              const duration = 10 + (trailIndex % 3) * 1.2
              const begin = -((index * duration) / 10 + trailIndex * 0.17)

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
            }),
          )}
        </svg>
      </div>{' '}
      {/* конец lumi__idle */}
    </div>
  )
}
