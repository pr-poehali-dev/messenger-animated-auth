import { useState } from 'react';
import { useMessengerStore } from '@/store/messengerStore';
import { Chat, User } from '@/types/messenger';
import AuthScreen from '@/components/messenger/AuthScreen';
import ChatsScreen from '@/components/messenger/ChatsScreen';
import ChatScreen from '@/components/messenger/ChatScreen';
import SearchScreen from '@/components/messenger/SearchScreen';
import SettingsScreen from '@/components/messenger/SettingsScreen';
import BottomNav from '@/components/messenger/BottomNav';

type Tab = 'chats' | 'search' | 'settings';

export default function Index() {
  const store = useMessengerStore();
  const [tab, setTab] = useState<Tab>('chats');
  const [openChat, setOpenChat] = useState<Chat | null>(null);

  const unreadTotal = store.chats.reduce((sum, c) => sum + c.unreadCount, 0);

  if (store.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-float" style={{ background: 'var(--grad-1)' }}>💬</div>
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!store.currentUser) {
    return (
      <AuthScreen
        onCheckPhone={store.checkPhone}
        onLogin={async (phone, password) => {
          const user = await store.login(phone, password);
          return !!user;
        }}
        onRegister={async (name, phone, password, tag, avatar) => {
          await store.register(name, phone, password, tag, avatar);
        }}
      />
    );
  }

  const handleOpenChat = (chat: Chat) => {
    setOpenChat(chat);
    setTab('chats');
  };

  const handleStartChat = async (user: User) => {
    const chatId = await store.openChatWith(user);
    const chat: Chat = store.chats.find(c => c.id === chatId) || { id: chatId, participants: [], unreadCount: 0, isPinned: false };
    setOpenChat(chat);
    setTab('chats');
  };

  const handleTabChange = (newTab: Tab) => {
    setOpenChat(null);
    setTab(newTab);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        {openChat && tab === 'chats' ? (() => {
          const other = store.getOtherUser(openChat);
          if (!other) return null;
          return (
            <ChatScreen
              chat={openChat}
              currentUser={store.currentUser!}
              otherUser={other}
              messages={store.getChatMessages(openChat.id)}
              onBack={() => setOpenChat(null)}
              onSendMessage={(text, sticker) => store.sendMessage(openChat.id, text, sticker)}
              onAddReaction={(msgId, emoji) => store.addReaction(msgId, emoji)}
              onLoad={() => store.loadMessages(openChat.id)}
              formatLastSeen={store.formatLastSeen}
            />
          );
        })() : (
          <div className="h-full overflow-hidden">
            {tab === 'chats' && (
              <ChatsScreen
                chats={store.chats}
                currentUser={store.currentUser}
                getOtherUser={store.getOtherUser}
                onOpenChat={handleOpenChat}
                formatLastSeen={store.formatLastSeen}
              />
            )}
            {tab === 'search' && (
              <SearchScreen
                currentUser={store.currentUser}
                formatLastSeen={store.formatLastSeen}
                onStartChat={handleStartChat}
                onSearchUsers={store.searchUsers}
              />
            )}
            {tab === 'settings' && (
              <SettingsScreen
                currentUser={store.currentUser}
                onUpdateProfile={store.updateProfile}
                onLogout={store.logout}
                onDeleteAccount={store.logout}
              />
            )}
          </div>
        )}
      </div>

      {!openChat && (
        <BottomNav active={tab} onChange={handleTabChange} unreadTotal={unreadTotal} />
      )}
    </div>
  );
}
