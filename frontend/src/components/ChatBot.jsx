import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Loader2, MessageCircle, Send, X, Copy, Check, Trash2, Sparkles, Shield, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const QUICK_PROMPTS = [
  { label: '📌 Track by ID', prompt: 'How to track incident?' },
  { label: '🖥️ Registered Assets', prompt: 'How many assets are registered?' },
  { label: '🚨 Incident Stats', prompt: 'What is the current incident stats?' },
  { label: '👥 Registered Users', prompt: 'Tell me about registered users' },
  { label: '🏢 Active Teams', prompt: 'Tell me about active teams' },
  { label: '⚠️ Security Alerts', prompt: 'Show active security alerts' },
  { label: '🛡️ Threat Intel', prompt: 'Show blocked threat intel IOCs' },
  { label: '📚 All Modules', prompt: 'Show all modules' },
];

const CHATBOT_API = 'http://127.0.0.1:5000/chat';

const ChatBot = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: "👋 **Hello! I am SentinelCore Security AI Assistant.**\n\nI can analyze platform statistics and security operations in real time:\n• 🖥️ **Registered Assets** (`how many assets`)\n• 🚨 **Incident Status** (`incident status`)\n• 👥 **Registered Users** (`about registered users`)\n• 🏢 **Active Teams** (`about teams`)\n• ⚠️ **Security Alerts** (`active alerts`)\n• 🛡️ **Threat Intel IOCs** (`blocked threat intel`)\n\nHow can I help your SOC team today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isOpen, messages, loading]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        from: 'bot',
        text: "👋 Chat session reset. Ask me about **Assets**, **Incidents**, **Users**, **Teams**, **Alerts**, or **Threat Intel**!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const sendMessage = async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((current) => [...current, { from: 'user', text: trimmed, timestamp: timeStr }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(CHATBOT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) throw new Error('Chatbot server unavailable');

      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          from: 'bot',
          text: data.reply || 'I could not prepare a reply right now.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: 'bot',
          text: "⚠️ **Chatbot Server Offline**\n\nPlease ensure `python chatbot_server.py` is running on port 5000 to query live security statistics.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Rich formatted text parser for bot response cards
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) return <div key={idx} className="h-2" />;

      // Format bullet lines
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      let cleanLine = isBullet ? line.trim().replace(/^[-•]\s*/, '') : line;

      // Replace bold syntax **text** and inline code `code`
      const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);

      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-sky-200">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={pIdx} className="mx-1 rounded bg-sky-950/80 px-1.5 py-0.5 font-mono text-[11px] text-sky-300 border border-sky-500/20">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-slate-200">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400 flex-shrink-0" />
            <span className="flex-1 leading-relaxed">{formattedLine}</span>
          </div>
        );
      }

      // Action hint line
      if (line.includes('💡') || line.includes('/assets') || line.includes('/incidents') || line.includes('/users') || line.includes('/teams')) {
        const routeMatch = line.match(/\/(assets|incidents|users|teams|alerts|threat-intel|dashboard|vulnerabilities)/);
        const targetRoute = routeMatch ? routeMatch[0] : null;

        return (
          <div key={idx} className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 p-2.5 text-xs text-sky-200">
            <span className="flex-1 leading-normal">{formattedLine}</span>
            {targetRoute && (
              <button
                type="button"
                onClick={() => { navigate(targetRoute); setIsOpen(false); }}
                className="inline-flex items-center gap-1 flex-shrink-0 rounded-lg bg-sky-500 px-2.5 py-1 font-semibold text-white shadow transition hover:bg-sky-400 text-[11px] cursor-pointer"
              >
                Open <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      }

      return (
        <p key={idx} className="my-1 leading-relaxed text-slate-200">
          {formattedLine}
        </p>
      );
    });
  };

  const chatWindow = (
    <section className="mb-4 flex h-[580px] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-sky-400/30 bg-[#090d18]/96 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl sc-scale-in">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-950/80 via-[#0d1629] to-sky-950/80 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/40 bg-gradient-to-br from-blue-600 to-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.35)]">
              <Bot className="h-5.5 w-5.5" />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#090d18] bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide text-white">Sentinel AI Guide</h2>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300">
                LIVE AI
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">Security Operations Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClearChat}
            title="Clear Chat History"
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:border-red-400/40 hover:text-red-300 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:text-white cursor-pointer"
            aria-label="Close chatbot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Messages Body */}
      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((message, index) => (
          <div
            key={`${message.from}-${index}`}
            className={`flex flex-col ${message.from === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="font-semibold">{message.from === 'user' ? 'You' : 'Sentinel AI'}</span>
              <span>•</span>
              <span>{message.timestamp}</span>
            </div>
            <div className="group relative max-w-[90%]">
              <div
                className={`rounded-2xl px-4 py-3 text-xs shadow-lg transition-all ${
                  message.from === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-tr-xs'
                    : 'border border-white/12 bg-slate-900/90 text-slate-200 rounded-tl-xs backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                }`}
              >
                {message.from === 'user' ? (
                  <p className="leading-relaxed">{message.text}</p>
                ) : (
                  renderMessageContent(message.text)
                )}
              </div>
              {message.from === 'bot' && (
                <button
                  type="button"
                  onClick={() => handleCopy(message.text, index)}
                  className="absolute -right-7 top-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Copy response"
                >
                  {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2.5 rounded-2xl border border-sky-400/30 bg-slate-900/90 px-4 py-3 text-xs text-sky-300 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
              <span className="font-mono text-slate-300">Fetching Sentinel AI security stats...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="border-t border-white/10 bg-[#070b14]/90 p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3 w-3 text-sky-400" /> Quick Security Queries
          </span>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-none">
          {QUICK_PROMPTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => sendMessage(item.prompt)}
              className="cursor-pointer rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-sky-400/50 hover:bg-sky-500/15 hover:text-sky-200"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about assets, incidents, users, teams, alerts..."
            className="glass-input min-w-0 flex-1 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 rounded-xl"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/40 bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && chatWindow}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group relative ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-sky-400/40 bg-gradient-to-br from-blue-600 via-sky-500 to-sky-400 text-white shadow-[0_16px_36px_rgba(14,165,233,0.35)] backdrop-blur transition hover:scale-110 cursor-pointer"
        aria-label="Toggle Sentinel AI Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Bot className="h-7 w-7 transition-transform group-hover:rotate-12" />
          </>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
