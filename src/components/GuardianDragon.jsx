// Все части используют исходное изображение. Маски отделяют зоны движения.
export default function GuardianDragon(){return <div className="guardian-dragon" aria-hidden="true">
 <div className="guardian-dragon__wings guardian-dragon__wings--far"><img src="/sanctuary/wings.png" alt=""/></div>
 <div className="guardian-dragon__wings guardian-dragon__wings--near"><img src="/sanctuary/wings.png" alt=""/></div>
 <div className="guardian-dragon__living">
  <img className="guardian-dragon__body" src="/sanctuary/dragon.png" alt=""/>
  <div className="guardian-dragon__head"><img src="/sanctuary/dragon.png" alt=""/><span className="guardian-dragon__eye"/><span className="guardian-dragon__lid"/><span className="guardian-dragon__breath-light"/></div>
  <img className="guardian-dragon__tail" src="/sanctuary/dragon.png" alt=""/>
  <div className="guardian-dragon__heart"/>
 </div>
</div>}
