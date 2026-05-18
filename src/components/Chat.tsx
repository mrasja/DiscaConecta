'use client';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { getConvId } from '@/lib/firebase-rtdb';
import { showMessageNotification, notifyRecipient } from '@/components/NotificationPermission';

interface ChatProps {
  convId: string;
  otherUser: { id: string; name: string; avatar?: string; role: string };
  onClose?: () => void;
}

export function Chat({ convId, otherUser, onClose }: ChatProps) {
  const { appUser, firebaseUser, token: authToken } = useAuth();
  const { messages, send, sending, bottomRef } = useChat(convId);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    await send(text, otherUser.id);
    inputRef.current?.focus();
    if (authToken && appUser) {
      const senderName = (appUser as any).full_name || (appUser as any).fullName || 'Alguien';
      notifyRecipient(authToken, otherUser.id, senderName, text);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isMe = (senderId: string) => senderId === firebaseUser?.uid;

  // Notificar cuando llega un mensaje del otro usuario
  const prevCountRef = useRef(0);
  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = messages.length;
    if (curr > prev && prev > 0) {
      const last = messages[curr - 1];
      if (!isMe(last.senderId)) {
        showMessageNotification(otherUser.name, last.text);
      }
    }
    prevCountRef.current = curr;
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            {otherUser.avatar
              ? <img src={otherUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              : <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">{otherUser.name[0]}</span>
                </div>
            }
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{otherUser.name}</p>
            <p className="text-xs text-gray-400 capitalize">{otherUser.role}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <span className="text-4xl mb-2 block">💬</span>
            <p className="text-sm text-gray-400">Iniciá la conversación</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}
            className={`flex items-end gap-2 ${isMe(msg.senderId) ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isMe(msg.senderId) && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mb-1">
                <span className="text-indigo-600 text-xs font-bold">{otherUser.name[0]}</span>
              </div>
            )}
            <div className={`max-w-[70%] ${isMe(msg.senderId) ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${isMe(msg.senderId)
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'}`}>
                {msg.text}
              </div>
              <span className="text-xs text-gray-400 px-1">
                {new Date(msg.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <input ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escribí un mensaje..."
            maxLength={500}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
          />
          <button onClick={handleSend} disabled={!input.trim() || sending}
            className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0">
            {sending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            }
          </button>
        </div>
        <p className="text-xs text-gray-300 mt-1 text-right">{input.length}/500</p>
      </div>
    </div>
  );
}