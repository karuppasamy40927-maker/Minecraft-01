import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';

interface ChatOverlayProps {
  mapContext: any;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ mapContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, context: mapContext }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'ai', text: data.response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Error communicating with assistant.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-cyan-600 rounded-full shadow-lg text-white hover:bg-cyan-500 transition"
        >
          <MessageSquare />
        </button>
      ) : (
        <div className="w-80 h-96 bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center text-white">
            <span className="flex items-center gap-2"><Bot size={16} /> Map Assistant</span>
            <button onClick={() => setIsOpen(false)}><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`p-2 rounded text-xs ${m.role === 'user' ? 'bg-slate-700 ml-auto' : 'bg-slate-800'}`}>
                {m.text}
              </div>
            ))}
            {isTyping && <div className="text-xs text-slate-500 italic">Assistant is typing...</div>}
          </div>
          <div className="p-2 border-t border-slate-700 flex gap-2">
            <input 
              className="flex-1 bg-slate-800 text-xs text-white p-2 rounded outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="p-2 text-cyan-400"><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
