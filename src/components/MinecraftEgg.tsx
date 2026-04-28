import { useState, useEffect } from 'react';

export default function MinecraftEgg() {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (!active) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Ignore clicks on our activation button
      if ((e.target as HTMLElement).closest('.mc-button')) return;

      const scale = Math.random() < 0.5 ? 1 : 2;
      // Add particles
      setParticles(prev => [
        ...prev,
        { id: Date.now(), x: e.clientX, y: e.clientY }
      ]);

      // "Mine" the element by making it invisible but keeping layout
      const target = e.target as HTMLElement;
      if (target && target.tagName !== 'BODY' && target.tagName !== 'HTML') {
        target.style.transition = 'opacity 0.2s';
        target.style.opacity = '0';
        setTimeout(() => {
          target.style.visibility = 'hidden';
        }, 200);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    document.body.style.cursor = 'crosshair';

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.body.style.cursor = 'default';
    };
  }, [active]);

  // Cleanup particles
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => {
        setParticles(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  return (
    <>
      <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-mono">Minecraft</h2>
          <p className="text-sm text-slate-600 mt-1">Click the grass block to start mining!</p>
        </div>
        <button 
          onClick={() => setActive(!active)}
          className={`mc-button w-16 h-16 transition-transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center border-4 border-[#3c2813] bg-[#744c28] relative shadow-lg ${active ? 'animate-pulse' : ''}`}
        >
          {/* Grass top */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-[#51a030] border-b-4 border-[#3b7222]"></div>
          {/* Dirt details */}
          <div className="w-2 h-2 bg-[#5d3b1b] absolute bottom-2 left-2"></div>
          <div className="w-2 h-2 bg-[#8c5e31] absolute top-6 right-2"></div>
        </button>
      </div>

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} className="fixed pointer-events-none z-50 flex gap-1" style={{ left: p.x - 10, top: p.y - 10 }}>
           <div className="w-2 h-2 bg-[#5d3b1b] animate-[bounce_0.5s_ease-out_forwards]"></div>
           <div className="w-2 h-2 bg-gray-400 animate-[bounce_0.6s_ease-out_forwards]"></div>
           <div className="w-2 h-2 bg-[#51a030] animate-[bounce_0.4s_ease-out_forwards]"></div>
        </div>
      ))}
    </>
  );
}
