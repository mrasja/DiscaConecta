'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/ConversationList';
import { Chat } from '@/components/Chat';
import { useAuth } from '@/context/AuthContext';
import { BackHeader } from '@/components/BackHeader';

function MensajesContent() {
  const { appUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (authLoading) return;
    if (!appUser) { router.replace('/login'); return; }
  }, [appUser, authLoading, router]);

  const [selectedConv, setSelectedConv] = useState<{
    id: string;
    otherUser: { id: string; name: string; avatar?: string; role: string };
  } | null>(null);

  // Auto-abrir conversación cuando se llega desde un perfil de profesional
  useEffect(() => {
    const conv = searchParams.get('conv');
    const uid  = searchParams.get('uid');
    const name = searchParams.get('name');
    if (conv && uid && name) {
      setSelectedConv({
        id: conv,
        otherUser: { id: uid, name: decodeURIComponent(name), role: 'profesional' },
      });
    }
  }, [searchParams]);

  if (authLoading || !appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <div className="h-[calc(100vh)] flex overflow-hidden">
        {/* Sidebar de conversaciones */}
        <div className={`w-full sm:w-80 border-r border-gray-100 flex flex-col flex-shrink-0
          ${selectedConv ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-gray-100">
            <BackHeader title="Mensajes" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              selectedConvId={selectedConv?.id}
              onSelect={(conv) => setSelectedConv({ id: conv.id, otherUser: conv.otherUser })}
            />
          </div>
        </div>

        {/* Ventana de chat */}
        <div className={`flex-1 min-w-0 ${selectedConv ? 'flex' : 'hidden sm:flex'} flex-col`}>
          {selectedConv && appUser ? (
            <Chat
              convId={selectedConv.id}
              otherUser={selectedConv.otherUser}
              onClose={() => setSelectedConv(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center px-6">
                <span className="text-6xl mb-4 block">💬</span>
                <p className="text-gray-600 font-semibold">Seleccioná una conversación</p>
                <p className="text-sm text-gray-400 mt-1">
                  o iniciá una nueva desde el perfil de un profesional
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MensajesPage() {
  return (
    <Suspense>
      <MensajesContent />
    </Suspense>
  );
}
