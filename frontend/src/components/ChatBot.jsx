import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const QUICK_PROMPTS = [
  'Explain dashboard',
  'How incidents work?',
  'How to Track incident status?',
  'What is asset management?',
  'Show all modules',
];

const CHATBOT_API = 'http://127.0.0.1:5000/chat';

const ChatBot = () => {
  const { token } = useAuth();
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hii, I am the Guide of SentinelCore. Ask me about any app operation...',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isOpen, messages, loading]);

  const sendMessage = async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) {
      return;
    }

    setMessages((current) => [...current, { from: 'user', text: trimmed }]);
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

      if (!response.ok) {
        throw new Error('Chatbot server unavailable');
      }

      const data = await response.json();
      setMessages((current) => [...current, { from: 'bot', text: data.reply || 'I could not prepare a reply.' }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: 'bot',
          text: 'Chatbot is not running...',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <section className="mb-4 flex h-[520px] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/95 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.46)] backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-300">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">SentinelCore's Chatbot</h2>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300">
                  Built with Python
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <p
                  className={`max-w-[86%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    message.from === 'user'
                      ? 'bg-sky-500 text-white'
                      : 'border border-white/8 bg-white/5 text-slate-200'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <p className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking...
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/8 p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-sky-400/30 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
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
                placeholder="Ask about any app operations..."
                className="glass-input min-w-0 flex-1 px-3 py-2.5 text-xs"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500 text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-green-700 bg-[#0b1220]/90 text-sky-400 shadow-[0_16px_32px_rgba(14,295,233,0.22)] backdrop-blur transition hover:scale-105 hover:text-emerald-500 hover:border-blue-700 cursor-pointer"
        aria-label="Open chatbot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};
export default ChatBot;
