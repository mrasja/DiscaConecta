'use client';
import { useEffect, useState } from 'react';
import { subscribeToConversations, subscribeTotalUnread } from '@/lib/firebase-rtdb';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ConvMeta {
  id: string;
  lastMessage?: string;
  lastMessageAt?: number;
  otherUser: { id: string; name: string; avatar?: string; role: string };
}

interface ConversationListProps {
  selectedConvId?: string;
  onSelect: (conv: ConvMeta) => void;
}

export function ConversationList({ selectedConvId, onSelect }: ConversationListProps) {
  const { appUser, firebaseUser } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  // Cargar conversaciones desde Postgres (metadata)
  const { data: conversations = [] } = useQuery<ConvMeta[]>({
    queryKey: ['conversations'],
    queryFn: () => fetch('/api/conversations', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
    }).then(r => r.json()),
    refetchInterval: 10000, // polling cada 10s para actualizar last message
  });

  // Total no leídos (Firebase)
  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeTotalUnread(firebaseUser.uid, setTotalUnread);
  }, [firebaseUser]);

  if (!conversations.length) {
    return (
      <div className="text-center py-12 px-4">
        <span className="text-4xl mb-3 block">💬</span>
        <p className="text-sm text-gray-500 font-medium">Sin conversaciones aún</p>
        <p className="text-xs text-gray-400 mt-1">Contactá a un profesional desde su perfil</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map(conv => (
        <button key={conv.id} onClick={() => onSelect(conv)}
          className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left
            ${selectedConvId === conv.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''}`}>
          <div className="relative flex-shrink-0">
            {conv.otherUser.avatar
              ? <img src={conv.otherUser.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
              : <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">{conv.otherUser.name[0]}</span>
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-gray-900 text-sm truncate">{conv.otherUser.name}</p>
              {conv.lastMessageAt && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(conv.lastMessageAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'Sin mensajes aún'}</p>
            </div>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{conv.otherUser.role}</p>
          </div>
        </button>
      ))}
    </div>
  );
}