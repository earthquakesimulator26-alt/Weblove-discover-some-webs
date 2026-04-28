import { useState, useEffect } from 'react';

export default function ZergRush() {
  const [zerglings, setZerglings] = useState<{ id: number, x: number, y: number, hp: number }[]>([]);

  useEffect(() => {
    // Spawn zerglings
    const spawnInterval = setInterval(() => {
      setZerglings(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.random() * window.innerWidth,
          y: -50,
          hp: 3 // clicks to destroy
        }
      ]);
    }, 1000);

    // Move zerglings down
    const moveInterval = setInterval(() => {
      setZerglings(prev => 
        prev.map(z => ({
          ...z,
          y: z.y + 2, // fall speed
        })).filter(z => z.hp > 0 && z.y < window.innerHeight + 100)
      );
    }, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, []);

  const handleClick = (id: number) => {
    setZerglings(prev => 
      prev.map(z => z.id === id ? { ...z, hp: z.hp - 1 } : z)
    );
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {zerglings.map(z => (
        <div 
          key={z.id}
          onClick={() => handleClick(z.id)}
          className="absolute w-8 h-8 rounded-full border-4 border-red-500 bg-white shadow flex items-center justify-center font-bold text-red-500 cursor-crosshair pointer-events-auto select-none"
          style={{ transform: `translate(${z.x}px, ${z.y}px)`, opacity: z.hp / 3 }}
        >
          O
        </div>
      ))}
    </div>
  );
}
