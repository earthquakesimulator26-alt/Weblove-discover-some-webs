import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Bot, Search, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import ZergRush from './ZergRush';
import MinecraftEgg from './MinecraftEgg';
import HtmlDoctypeEgg from './HtmlDoctypeEgg';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

type SearchPageProps = {
  query: string;
  onNavigate: (url: string) => void;
};

export default function SearchPage({ query, onNavigate }: SearchPageProps) {
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  
  // Easter eggs state
  const [barrelRoll, setBarrelRoll] = useState(false);
  const [askew, setAskew] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [upsideDown, setUpsideDown] = useState(false);
  const [sepia, setSepia] = useState(false);
  const [bletchleyDecoding, setBletchleyDecoding] = useState(false);
  const [anagramMode, setAnagramMode] = useState(false);
  const [zergRush, setZergRush] = useState(false);
  const [htmlCodeStorm, setHtmlCodeStorm] = useState(false);

  useEffect(() => {
    // Reset effects
    setBarrelRoll(false);
    setAskew(false);
    setTerminal(false);
    setUpsideDown(false);
    setSepia(false);
    setBletchleyDecoding(false);
    setAnagramMode(false);
    setZergRush(false);
    setHtmlCodeStorm(false);

    const q = query.toLowerCase().trim();
    
    // Trigger Easter Eggs
    if (q === 'do a barrel roll') setBarrelRoll(true);
    if (q === 'askew') setAskew(true);
    if (q === 'google terminal') setTerminal(true);
    if (q === 'stranger things') setUpsideDown(true);
    if (q === 'wizard of oz') setSepia(true); // Simplified for now
    if (q === 'bletchley park') setBletchleyDecoding(true);
    if (q === 'anagram') setAnagramMode(true);
    if (q === 'zerg rush') setZergRush(true);
    if (q === 'html doctype') setHtmlCodeStorm(true);
    if (q === 'text adventure') {
      console.log("%cWelcome to Text Adventure!", "color: #4285F4; font-size: 24px; font-weight: bold;");
      console.log("Type `play()` to start exploring the mysteries of the internet.");
      (window as any).play = () => console.log("You find yourself in a dark digital forest. There is a blinking cursor to the north.");
    }
    
    // Simulate AI Search
    setLoading(true);
    const fetchResults = async () => {
      try {
        const stream = await ai.models.generateContentStream({
          model: "gemini-3-flash-preview",
          contents: `Provide a direct answer and a list of 3 relevant search results for the query: "${query}". 
          Format the output precisely as JSON:
          {
            "answer": "Direct concise answer here. Use markdown if helpful.",
            "results": [
              { "title": "Result Title", "url": "https://example.com/path", "snippet": "A short snippet describing the page." }
            ]
          }
          Ensure it is valid JSON and nothing else.`
        });

        let fullText = "";
        for await (const chunk of stream) {
          if (chunk.text) fullText += chunk.text;
        }

        const jsonStr = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);
        setAnswer(data.answer || "No direct answer found.");
        setResults(data.results || []);
      } catch (err) {
        console.error("Search error:", err);
        setAnswer("Hmm, I couldn't find an answer for that. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [query]);

  if (terminal) {
    return (
      <div className="bg-black p-8 text-green-500 font-mono h-full flex flex-col pt-12 overflow-y-auto">
        <p>G O O G L E  T E R M I N A L  S Y S T E M</p>
        <p>QUERY: {query.toUpperCase()}</p>
        <div className="mt-8">
          {loading ? <p>SEARCHING...</p> : (
            <>
              <p>{answer.toUpperCase()}</p>
              <div className="mt-8 space-y-4">
                {results.map((r, i) => (
                  <div key={i} className="cursor-pointer hover:bg-green-900" onClick={() => onNavigate(r.url)}>
                    <p>--&gt; {r.title.toUpperCase()}</p>
                    <p>{r.url}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full w-full bg-white overflow-y-auto pt-10 pb-20 px-8 transition-transform duration-1000",
      barrelRoll && "animate-[spin_2s_ease-in-out]",
      askew && "-rotate-2 origin-center",
      upsideDown && "rotate-180 invert hue-rotate-180 delay-1000 duration-[5000ms]",
      sepia && "sepia duration-[3000ms]"
    )}>
      {zergRush && <ZergRush />}
      {htmlCodeStorm && <HtmlDoctypeEgg />}
      
      <div className="max-w-3xl mx-auto pt-8">
        {anagramMode && (
          <p className="text-red-600 mb-6 font-medium text-lg">Did you mean: <span className="italic text-indigo-600 cursor-pointer">nag a ram</span></p>
        )}

        {query.toLowerCase() === 'once in a blue moon' && (
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
             <h3 className="text-2xl text-slate-800">1.16699016 × 10<sup>-8</sup> hertz</h3>
          </div>
        )}

        {query.toLowerCase() === 'spinner' && (
          <div className="mb-8 p-12 bg-slate-50 border border-slate-200 rounded-xl flex justify-center items-center">
             <div className="w-32 h-32 border-[16px] border-indigo-600 border-t-purple-500 rounded-full animate-spin hover:animate-[spin_0.2s_linear_infinite] cursor-pointer shadow-lg" />
          </div>
        )}

        {query.toLowerCase() === 'minecraft' && (
          <MinecraftEgg />
        )}

        {/* AI Answer Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              AI Answer
              {bletchleyDecoding && (
                <span className="animate-pulse bg-slate-800 text-green-400 font-mono text-xs px-2 py-0.5 rounded">
                  DFCODING...
                </span>
              )}
            </h2>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
            </div>
          ) : (
            <div className="prose prose-sm text-slate-700 leading-relaxed max-w-none">
              {answer}
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="space-y-8">
          {loading ? (
             Array.from({length: 3}).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-48 animate-pulse"></div>
                  <div className="h-5 bg-slate-200 rounded w-96 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                </div>
             ))
          ) : (
            results.map((result, i) => (
              <div key={i} className="group">
                <div className="flex items-center gap-2 text-[13px] text-slate-600 mb-1">
                  <span>{result.url}</span>
                </div>
                <button 
                  onClick={() => onNavigate(result.url)}
                  className="text-xl text-indigo-600 font-medium group-hover:underline text-left"
                >
                  {result.title}
                </button>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {result.snippet}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
