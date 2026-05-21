'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { getConvId, setTyping, subscribeTyping } from '@/lib/firebase-rtdb';
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
  const [otherTyping, setOtherTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Suscribir a typing del otro usuario
  useEffect(() => {
    if (!otherUser.id) return;
    return subscribeTyping(convId, otherUser.id, setOtherTyping);
  }, [convId, otherUser.id]);

  // Limpiar typing al desmontar
  useEffect(() => {
    return () => {
      if (firebaseUser?.uid) setTyping(convId, firebaseUser.uid, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [convId, firebaseUser?.uid]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!firebaseUser?.uid) return;
    setTyping(convId, firebaseUser.uid, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(convId, firebaseUser.uid!, false);
    }, 2000);
  }, [convId, firebaseUser?.uid]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    if (firebaseUser?.uid) {
      setTyping(convId, firebaseUser.uid, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
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

  const highlightText = (text: string, query: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-gray-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const toggleSearch = () => {
    setShowSearch(v => !v);
    setSearchQuery('');
    if (!showSearch) setTimeout(() => searchRef.current?.focus(), 100);
  };

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
        <div className="flex items-center gap-1">
          <button onClick={toggleSearch} aria-label="Buscar en la conversación"
            className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input ref={searchRef} type="search" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar en la conversación..."
              className="w-full pl-8 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
            {searchQuery && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {filteredMessages.length} resultado{filteredMessages.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <span className="text-4xl mb-2 block">💬</span>
            <p className="text-sm text-gray-400">Iniciá la conversación</p>
          </div>
        )}
        {filteredMessages.map((msg) => (
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
                {searchQuery ? highlightText(msg.text, searchQuery) : msg.text}
              </div>
              <span className="text-xs text-gray-400 px-1">
                {new Date(msg.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {/* Typing indicator */}
        {otherTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 text-xs font-bold">{otherUser.name[0]}</span>
            </div>
            <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <input ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
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