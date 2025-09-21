import React, { useState, useEffect } from 'react';
import AnimatedProgressBar from './AnimatedProgressBar';

/**
 * Exemple d'utilisation du composant AnimatedProgressBar
 * Peut être utilisé pour tester ou comme référence
 */
const AnimatedProgressBarExample = () => {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Simulation d'une progression automatique
  useEffect(() => {
    let interval;
    if (isRunning && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          if (newProgress >= 100) {
            setIsRunning(false);
            return 100;
          }
          return newProgress;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isRunning, progress]);

  const handleStart = () => {
    setProgress(0);
    setIsRunning(true);
  };

  const handleReset = () => {
    setProgress(0);
    setIsRunning(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Exemples AnimatedProgressBar</h2>
      
      {/* Exemple avec progression dynamique */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Progression dynamique</h3>
        <AnimatedProgressBar 
          progress={progress} 
          color="primary"
          animated={true}
        />
        <p>Progression: {Math.round(progress)}%</p>
        <div style={{ gap: '1rem', display: 'flex' }}>
          <button onClick={handleStart} disabled={isRunning}>
            Démarrer
          </button>
          <button onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {/* Exemples avec différentes couleurs */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Différentes couleurs</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Primary (75%)</p>
          <AnimatedProgressBar progress={75} color="primary" />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Success (60%)</p>
          <AnimatedProgressBar progress={60} color="success" />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Warning (40%)</p>
          <AnimatedProgressBar progress={40} color="warning" />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Danger (25%)</p>
          <AnimatedProgressBar progress={25} color="danger" />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Info (85%)</p>
          <AnimatedProgressBar progress={85} color="info" />
        </div>
      </div>

      {/* Exemples avec différentes vitesses */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Différentes vitesses d'animation</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Animation rapide (1s)</p>
          <AnimatedProgressBar progress={70} color="success" animationDuration={1} />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Animation normale (2s)</p>
          <AnimatedProgressBar progress={70} color="primary" animationDuration={2} />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Animation lente (4s)</p>
          <AnimatedProgressBar progress={70} color="info" animationDuration={4} />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Sans animation</p>
          <AnimatedProgressBar progress={70} color="warning" animated={false} />
        </div>
      </div>
    </div>
  );
};

export default AnimatedProgressBarExample;
