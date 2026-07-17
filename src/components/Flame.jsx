import React, { useState, useEffect } from 'react';
import './Flame.css';

export default function Flame({ level = 2, energy = 60 }) {
  // Niveaux: 1: Étincelle, 2: Flamme, 3: Brasier, 4: Diamant, 5: Âmes sœurs, 6: Légende
  
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Determine size and color based on level
  const getFlameClass = () => {
    let classes = ['flame-container'];
    if (pulse) classes.push('pulse');
    
    switch(level) {
      case 1: classes.push('level-1'); break;
      case 2: classes.push('level-2'); break;
      case 3: classes.push('level-3'); break;
      case 4: classes.push('level-4'); break;
      case 5: classes.push('level-5'); break;
      case 6: classes.push('level-6'); break;
      default: classes.push('level-2');
    }
    return classes.join(' ');
  };

  return (
    <div className="flame-wrapper">
      <div className="energy-ring" style={{ '--energy-percent': `${energy}%` }}></div>
      <div className={getFlameClass()}>
        <div className="flame-core"></div>
        <div className="flame-outer"></div>
        {level >= 3 && <div className="flame-sparks"></div>}
      </div>
      <div className="energy-text">{energy}%</div>
    </div>
  );
}
