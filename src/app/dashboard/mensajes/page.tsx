'use client';
import { useState } from 'react';
import { ConversationList } from '@/components/ConversationList';
import { Chat } from '@/components/Chat';
import { getConvId } from '@/lib/firebase-rtdb';
import { useAuth } from '@/context/AuthContext';

export default function MensajesPage() {
  const { appUser } = useAuth();
  const [selectedConv, setSelectedConv] = useState<{
    id: string;
    otherUser: { id: string; name: string; avatar?: string; role: string };
  } | null>(null);

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white overflow-hidden">
      {/* Sidebar de conversaciones */}
      <div className={`w-full sm:w-80 border-r border-gray-100 flex flex-col
        ${selectedConv ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Mensajes</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            selectedConvId={selectedConv?.id}
            onSelect={(conv) => setSelectedConv({ id: conv.id, otherUser: conv.otherUser })}
          />
        </div>
      </div>

      {/* Ventana de chat */}
      <div className={`flex-1 ${selectedConv ? 'flex' : 'hidden sm:flex'} flex-col`}>
        {selectedConv && appUser ? (
          <Chat
            convId={selectedConv.id}
            otherUser={selectedConv.otherUser}
            onClose={() => setSelectedConv(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <span className="text-6xl mb-4 block">💬</span>
              <p className="text-gray-500 font-medium">Seleccioná una conversación</p>
              <p className="text-sm text-gray-400 mt-1">o iniciá una nueva desde el perfil de un profesional</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
