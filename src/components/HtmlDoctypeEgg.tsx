import { useState, useEffect } from 'react';

export default function HtmlDoctypeEgg() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const newLine = `<div class="node-${count}" id="elm-${Math.random().toString(36).substr(2, 5)}">\n  <span class="text-${Math.random() > 0.5 ? 'red' : 'blue'}">Generated Line ${count}</span>\n</div>`;
      setLines(prev => [...prev, newLine].slice(-150)); // Keep last 150 lines
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 pointer-events-none overflow-hidden flex flex-col justify-end p-4">
      <div className="text-emerald-500 font-mono text-xs md:text-sm whitespace-pre-wrap break-all opacity-80 leading-relaxed shadow-lg">
        {`<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>So Many Lines</title>\n</head>\n<body>\n`}
        {lines.join('\n')}
        <div className="animate-pulse">_</div>
      </div>
    </div>
  );
}
