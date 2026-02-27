CREATE TABLE am_users (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(64) UNIQUE,
    display_name VARCHAR(128) NOT NULL DEFAULT 'Пользователь',
    avatar_color VARCHAR(16) NOT NULL DEFAULT '#2d8cf0',
    bio TEXT DEFAULT '',
    stars_balance INT NOT NULL DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    premium_until TIMESTAMPTZ,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    system_display_phone VARCHAR(20),
    status VARCHAR(16) NOT NULL DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);