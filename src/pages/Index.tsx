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

  if (!store.currentUser) {
    return (
      <AuthScreen
        onLogin={(phone, password) => {
          const user = store.login(phone, password);
          return !!user;
        }}
        onRegister={(name, phone, password, tag, avatar) => {
          store.register(name, phone, password, tag, avatar);
        }}
      />
    );
  }

  const handleOpenChat = (chat: Chat) => {
    setOpenChat(chat);
  };

  const handleStartChat = (user: User) => {
    const existing = store.chats.find(c =>
      c.participants.includes(store.currentUser!.id) &&
      c.participants.includes(user.id)
    );
    if (existing) {
      setOpenChat(existing);
      setTab('chats');
    }
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
                users={store.users}
                currentUser={store.currentUser}
                formatLastSeen={store.formatLastSeen}
                onStartChat={handleStartChat}
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
