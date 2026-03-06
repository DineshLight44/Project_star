import React, { useEffect, useRef, useState } from 'react';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
};

const supportsSpeechRecognition =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'assistant',
      text: 'Hi, I am your AI voice assistant. Ask me anything or tap the mic to speak.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!supportsSpeechRecognition) return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition as SpeechRecognition;
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: idRef.current++,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.reply ?? data.response ?? JSON.stringify(data);

      const assistantMessage: ChatMessage = {
        id: idRef.current++,
        role: 'assistant',
        text: aiText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: idRef.current++,
        role: 'assistant',
        text:
          'Sorry, I could not reach the AI backend. Please make sure the FastAPI server is running.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleListening = () => {
    if (!supportsSpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="w-full max-w-3xl h-[80vh] mx-4 flex flex-col rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl backdrop-blur">
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">AI Voice Chatbot</h1>
            <p className="text-xs text-slate-400">
              Powered by your FastAPI backend at <code className="font-mono">/chat</code>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${
                supportsSpeechRecognition ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span>{supportsSpeechRecognition ? 'Voice ready' : 'Voice unavailable'}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-emerald-500 text-emerald-50 rounded-br-sm'
                    : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        <footer className="px-4 pb-4 pt-2 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`flex h-11 w-11 items-center justify-center rounded-full border text-slate-100 transition-all ${
                isListening
                  ? 'border-rose-500 bg-rose-600/90 shadow-lg shadow-rose-500/40'
                  : 'border-slate-700 bg-slate-800 hover:border-emerald-500 hover:text-emerald-300'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
              >
                {isListening ? (
                  <path d="M6 6h4v12H6zM14 6h4v12h-4z" />
                ) : (
                  <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h2a1 1 0 1 1 0 2H9a1 1 0 0 1 0-2h2v-3.07A7 7 0 0 1 5 11a1 1 0 0 1 2 0 5 5 0 1 0 10 0Z" />
                )}
              </svg>
            </button>

            <div className="flex-1 flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/60">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message or use the mic…"
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={isSending || !input.trim()}
                className="inline-flex h-9 items-center rounded-xl bg-emerald-500 px-3 text-xs font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Press Enter to send. Make sure your FastAPI server exposes a{' '}
            <code className="font-mono">POST /chat</code> endpoint that returns JSON like{' '}
            <code className="font-mono">{"{ reply: \"...\" }"}</code>.
          </p>
        </footer>
      </div>
    </div>
  );
};

