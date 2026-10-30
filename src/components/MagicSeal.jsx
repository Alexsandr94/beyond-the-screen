// Векторная печать: три независимых кольца и геометрические руны.
const RUNES = ['M-5 7V-7L5 0L-5 3','M-5-6L5 6M5-6L-5 6M0-8V8','M-5 7V-7H5L0 0L5 7','M0-8L6 0L0 8L-6 0Z','M-5-7L5 0L-5 7M0-8V8','M-5 7L0-7L5 7M-3 2H3'];
export default function MagicSeal(){return <div className="guardian-seal" aria-hidden="true">
 <div className="guardian-seal__aura"/>
 <svg className="guardian-seal__outer" viewBox="0 0 600 600" fill="none"><circle cx="300" cy="300" r="280"/><circle cx="300" cy="300" r="258"/>{Array.from({length:36},(_,i)=><g key={i} transform={`translate(300 300) rotate(${i*10}) translate(0 -269)`}><path className="guardian-seal__rune" style={{'--rune':i}} d={RUNES[i%6]}/></g>)}</svg><svg className="guardian-seal__middle" viewBox="0 0 600 600" fill="none"><circle cx="300" cy="300" r="242"/><path d="M300 58L510 421H90ZM300 542L90 179H510Z"/>{Array.from({length:6},(_,i)=><path key={i} transform={`rotate(${i*60} 300 300)`} d="M300 48L309 65L300 82L291 65Z"/>)}</svg><svg className="guardian-seal__inner" viewBox="0 0 600 600" fill="none"><circle cx="300" cy="300" r="172"/><circle cx="300" cy="300" r="166" strokeDasharray="2 15"/>{Array.from({length:8},(_,i)=><path key={i} transform={`rotate(${i*45} 300 300)`} d="M300 125Q365 235 300 300Q235 235 300 125Z"/>)}</svg><svg className="guardian-seal__compass" viewBox="0 0 600 600" fill="none"><path d="M300 0V35M300 565V600M0 300H35M565 300H600"/><circle cx="300" cy="300" r="8"/>
 </svg>
 <div className="guardian-seal__orbit"><i/><i/><i/></div>
</div>}
