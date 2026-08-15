Here is the raw SQL code for migrations/001_init.sql exactly as provided:

```sql
-- LINKTROO Database Schema v1.0
-- Enterprise Bio Link Generator
-- Cloudflare D1 Compatible

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    password_hash TEXT DEFAULT '',
    salt TEXT DEFAULT '',
    theme TEXT DEFAULT 'dark',
    accent_color TEXT DEFAULT '#ff0080',
    secondary_color TEXT DEFAULT '#00ff88',
    background_type TEXT DEFAULT 'gradient',
    background_value TEXT DEFAULT 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a0a 100%)',
    font_family TEXT DEFAULT 'Inter',
    button_style TEXT DEFAULT '3d',
    button_color TEXT DEFAULT '#ff0080',
    button_text_color TEXT DEFAULT '#ffffff',
    profile_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    meta_title TEXT DEFAULT '',
    meta_description TEXT DEFAULT '',
    custom_domain TEXT DEFAULT '',
    remove_branding INTEGER DEFAULT 0,
    password_protected INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Links Table
CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    icon TEXT DEFAULT '🔗',
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'general',
    position INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    is_priority INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    schedule_start TEXT,
    schedule_end TEXT,
    utm_source TEXT DEFAULT '',
    utm_medium TEXT DEFAULT '',
    utm_campaign TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Analytics Table
CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    link_id TEXT,
    event_type TEXT NOT NULL,
    ip TEXT DEFAULT '',
    country TEXT DEFAULT '',
    city TEXT DEFAULT '',
    device TEXT DEFAULT '',
    browser TEXT DEFAULT '',
    referrer TEXT DEFAULT '',
    utm_source TEXT DEFAULT '',
    utm_medium TEXT DEFAULT '',
    utm_campaign TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

-- 4. Social Links Table
CREATE TABLE IF NOT EXISTS social_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    custom_icon TEXT DEFAULT '',
    position INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Email Subscribers Table
CREATE TABLE IF NOT EXISTS subscribers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, email),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Themes Table (Pre-made)
CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    background_type TEXT DEFAULT 'gradient',
    background_value TEXT DEFAULT '',
    button_style TEXT DEFAULT '3d',
    button_color TEXT DEFAULT '#ff0080',
    button_text_color TEXT DEFAULT '#ffffff',
    accent_color TEXT DEFAULT '#ff0080',
    secondary_color TEXT DEFAULT '#00ff88',
    font_family TEXT DEFAULT 'Inter',
    is_premium INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general'
);

-- 7. Collections Table
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '📁',
    position INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Link Collections Junction
CREATE TABLE IF NOT EXISTS link_collections (
    link_id TEXT NOT NULL,
    collection_id TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    PRIMARY KEY (link_id, collection_id),
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- 9. Digital Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    image_url TEXT DEFAULT '',
    file_url TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    sales_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Retargeting Pixels Table
CREATE TABLE IF NOT EXISTS pixels (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    pixel_id TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Default Themes
INSERT OR IGNORE INTO themes (id, name, background_type, background_value, button_style, button_color, button_text_color, accent_color, secondary_color, font_family, category) VALUES
('theme-dark-neon', 'Dark Neon', 'gradient', 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a0a 100%)', '3d', '#ff0080', '#ffffff', '#ff0080', '#00ff88', 'Inter', 'dark'),
('theme-cyber-pink', 'Cyber Pink', 'gradient', 'linear-gradient(135deg, #1a001a 0%, #330033 50%, #1a001a 100%)', '3d', '#ff00ff', '#ffffff', '#ff00ff', '#00ffff', 'Orbitron', 'dark'),
('theme-ocean-depth', 'Ocean Depth', 'gradient', 'linear-gradient(135deg, #001a33 0%, #003366 50%, #001a33 100%)', '3d', '#00ccff', '#ffffff', '#00ccff', '#00ffcc', 'Poppins', 'dark'),
('theme-forest-mist', 'Forest Mist', 'gradient', 'linear-gradient(135deg, #0a1a0a 0%, #1a331a 50%, #0a1a0a 100%)', '3d', '#00ff66', '#ffffff', '#00ff66', '#66ff00', 'Montserrat', 'dark'),
('theme-sunset-glow', 'Sunset Glow', 'gradient', 'linear-gradient(135deg, #331a00 0%, #663300 50%, #331a00 100%)', '3d', '#ff8800', '#ffffff', '#ff8800', '#ffcc00', 'Inter', 'dark'),
('theme-midnight-purple', 'Midnight Purple', 'gradient', 'linear-gradient(135deg, #0a001a 0%, #1a0033 50%, #0a001a 100%)', '3d', '#9900ff', '#ffffff', '#9900ff', '#ff00ff', 'Orbitron', 'dark'),
('theme-ice-crystal', 'Ice Crystal', 'gradient', 'linear-gradient(135deg, #001a1a 0%, #003333 50%, #001a1a 100%)', '3d', '#00ffff', '#ffffff', '#00ffff', '#ffffff', 'Poppins', 'dark'),
('theme-rose-gold', 'Rose Gold', 'gradient', 'linear-gradient(135deg, #1a0a0a 0%, #331a1a 50%, #1a0a0a 100%)', '3d', '#ff6666', '#ffffff', '#ff6666', '#ffaaaa', 'Montserrat', 'dark'),
('theme-emerald-city', 'Emerald City', 'gradient', 'linear-gradient(135deg, #001a0a 0%, #00331a 50%, #001a0a 100%)', '3d', '#00ff88', '#ffffff', '#00ff88', '#88ff00', 'Inter', 'dark'),
('theme-cosmic-dust', 'Cosmic Dust', 'gradient', 'linear-gradient(135deg, #0a0a1a 0%, #1a1a33 50%, #0a0a1a 100%)', '3d', '#8888ff', '#ffffff', '#8888ff', '#ccccff', 'Orbitron', 'dark');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_position ON links(position);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_social_user_id ON social_links(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

Copy and save as migrations/001_init.sql.
