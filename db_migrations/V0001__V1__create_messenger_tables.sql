CREATE TABLE IF NOT EXISTS t_p22192869_messenger_animated_a.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    tag VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p22192869_messenger_animated_a.chats (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p22192869_messenger_animated_a.chat_members (
    chat_id INTEGER REFERENCES t_p22192869_messenger_animated_a.chats(id),
    user_id INTEGER REFERENCES t_p22192869_messenger_animated_a.users(id),
    is_pinned BOOLEAN DEFAULT FALSE,
    unread_count INTEGER DEFAULT 0,
    PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS t_p22192869_messenger_animated_a.messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES t_p22192869_messenger_animated_a.chats(id),
    sender_id INTEGER REFERENCES t_p22192869_messenger_animated_a.users(id),
    text TEXT,
    sticker VARCHAR(10),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p22192869_messenger_animated_a.reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES t_p22192869_messenger_animated_a.messages(id),
    user_id INTEGER REFERENCES t_p22192869_messenger_animated_a.users(id),
    emoji VARCHAR(10) NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON t_p22192869_messenger_animated_a.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON t_p22192869_messenger_animated_a.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON t_p22192869_messenger_animated_a.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_users_tag ON t_p22192869_messenger_animated_a.users(tag);
CREATE INDEX IF NOT EXISTS idx_users_phone ON t_p22192869_messenger_animated_a.users(phone);
