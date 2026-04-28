import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Search, ExternalLink, Bot, User, Send, StopCircle, RefreshCw } from 'lucide-react';
import { cn } from './lib/utils';
import { GoogleGenAI, Type } from '@google/genai';
import SearchPage from './components/SearchPage';

// Initialize the GoogleGenAI instance
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
};

export default function App() {
  // Browser State
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [currentUrl, setCurrentUrl] = useState('https://example.com');
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      content: "Hello! I am your AI browsing assistant. Ask me questions about the current page, or tell me to summarize it.",
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let target = urlInput.trim();
    if (!target) return;
    
    const looksLikeUrl = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(target) || target.startsWith('localhost:');
    
    if (looksLikeUrl) {
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'https://' + target;
      }
      setUrlInput(target);
      setCurrentUrl(target);
      setIsLoading(true);
    } else {
      setUrlInput(target);
      setCurrentUrl(`search:${target}`);
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(k => k + 1);
  };

  const getProxiedUrl = (url: string) => {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  };

  const iframeProxyUrl = getProxiedUrl(currentUrl);

  const fetchPageContent = async () => {
    try {
      const res = await fetch(getProxiedUrl(currentUrl));
      if (!res.ok) throw new Error("Failed to fetch proxy");
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Clean up irrelevant things from doc to save tokens
      doc.querySelectorAll('script, style, nav, footer, header, svg, img').forEach(el => el.remove());
      return doc.body.textContent || doc.body.innerText || "No content found.";
    } catch (e) {
      console.error(e);
      return "Unable to retrieve page content.";
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, presetMessage?: string) => {
    if (e) e.preventDefault();
    const query = presetMessage || chatInput.trim();
    if (!query || isTyping) return;

    setChatInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const pageText = await fetchPageContent();
      
      const contents = [
        {
          role: "user",
          parts: [{ text: `Here is the main text content of the website I am currently viewing (URL: ${currentUrl}):\n\n=== START CONTENT ===\n${pageText.substring(0, 30000)}\n=== END CONTENT ===\n\nUser Question/Request task: ${query}` }]
        }
      ];

      // Assuming conversation history isn't strictly necessary per turn besides what we explicitly prepend
      // But we can construct the history minus the huge injected text
      const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const streamResponse = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [...history, ...contents],
        config: {
          systemInstruction: "You are an AI assistant integrated into a web browser. You answer questions and summarize content purely based on the current webpage the user is viewing. Keep answers concise, clear, and focused on the context provided.",
        }
      });

      const responseMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: responseMsgId, role: 'model', content: '' }]);

      for await (const chunk of streamResponse) {
        if (chunk.text) {
          setMessages(prev => prev.map(m => m.id === responseMsgId ? { ...m, content: m.content + chunk.text } : m));
        }
      }
    } catch (error) {
      console.error("AI Generation Error: ", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Sorry, I ran into an error while processing that." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSummarize = () => {
    handleSendMessage(undefined, "Please summarize this page.");
  };

  return (
    <div className="flex h-screen w-full bg-slate-200 font-sans antialiased text-slate-900 flex-col overflow-hidden">
      
      {/* Browser Toolbar */}
      <div className="flex items-center gap-3 bg-white px-4 py-2 border-b border-slate-200 shrink-0">
        <div className="flex gap-4 text-slate-400">
          <button className="text-lg cursor-pointer hover:text-slate-600 disabled:opacity-50 transition-colors pb-0.5" title="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button className="text-lg cursor-pointer hover:text-slate-600 disabled:opacity-50 transition-colors pb-0.5" title="Forward">
            <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={handleReload}
            className="text-lg cursor-pointer hover:text-slate-600 transition-colors pb-0.5"
            title="Reload">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleNavigate} className="flex-1 bg-slate-100 rounded-full flex items-center px-4 py-1.5 border border-slate-200 relative max-w-4xl mx-auto">
          <span className="text-slate-400 mr-2 text-sm">🔒</span>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-600 focus:outline-none shadow-none"
            placeholder="Enter URL to browse..."
          />
        </form>

        <div className="flex gap-3 items-center ml-auto">
          <a 
            href={currentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
            AI
          </div>
        </div>
      </div>

      {/* Main Window */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Viewport */}
        <div className="flex-1 relative bg-white">
          {isLoading && !currentUrl.startsWith('search:') && (
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden z-10">
              <div className="h-full bg-indigo-500 w-1/3 animate-[marquee_1s_infinite_linear]" style={{animation: 'indeterminate-progress 1s infinite linear'}}></div>
            </div>
          )}
          {currentUrl.startsWith('search:') ? (
            <SearchPage 
              query={currentUrl.substring(7)} 
              onNavigate={(url) => { setUrlInput(url); setCurrentUrl(url); setIsLoading(true); }} 
            />
          ) : (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={iframeProxyUrl}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-none bg-white block"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="Browser View"
            />
          )}
        </div>

        {/* AI Bot Sidebar */}
        <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col shadow-2xl shrink-0 z-10">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <h2 className="font-bold text-slate-800 text-sm">AI Navigator</h2>
            </div>
            <button 
              onClick={handleSummarize}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Summarize
            </button>
          </div>

          {/* Quick Actions optional, using just summarize above */}

          {/* Chat Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex flex-col w-full", msg.role === 'user' ? "items-end" : "items-start")}>
                <div className={cn(
                  "text-xs p-3 shadow-sm max-w-[90%]",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none" 
                    : "bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none space-y-2 whitespace-pre-wrap"
                )}>
                  {msg.content || (msg.role === 'model' && isTyping && "...")}
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1]?.role === 'user' && (
               <div className="flex items-start">
                 <div className="bg-white border border-slate-200 text-slate-500 italic text-[10px] p-3 rounded-2xl rounded-tl-none">
                    AI is analyzing source data...
                 </div>
               </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <form onSubmit={handleSendMessage} className="relative">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask a question about this page..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-10 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none min-h-[55px] max-h-32"
                rows={2}
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isTyping}
                className="absolute right-2 bottom-2 bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send Message"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              </button>
            </form>
          </div>
          <div className="bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-widest shrink-0">
            <span>Connection: Secure</span>
            <span>Engine: v4.2-Pro</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes indeterminate-progress {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(300%) }
        }
      `}</style>
    </div>
  );
}
