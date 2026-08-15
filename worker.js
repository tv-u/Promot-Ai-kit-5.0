// ═══════════════════════════════════════════════════════════════
// LINKTROO — Enterprise Bio Link Generator Free Tool
// Cloudflare Worker Backend API v1.0
// 134+ Features | Pink/Green/Black Theme | Zero Competition SEO
// ═══════════════════════════════════════════════════════════════

// ─── CONFIGURATION ───
const CONFIG = {
APP_NAME: 'LINKTROO',
APP_URL: 'https://linktroo.pages.dev',
RATE_LIMIT: 100,
RATE_WINDOW: 60,
JWT_EXPIRY: '7d',═══════════════════════════════════════════════════════════════
MAX_LINKS: 9999,
MAX_FILE_SIZE: 5 * 1024 * 1024,
ALLOWED_ORIGINS: ['https://linktroo.pages.dev', 'http://localhost:8788'],
SOCIAL_PLATFORMS: [
'instagram', 'twitter', 'x', 'tiktok', 'youtube', 'facebook',
'linkedin', 'github', 'twitch', 'discord', 'telegram', 'whatsapp',
'snapchat', 'pinterest', 'spotify', 'soundcloud', 'medium', 'reddit'
]
};

// ─── CORS HEADERS ───
function corsHeaders(origin) {
return {
'Access-Control-Allow-Origin': origin || '*',
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Requested-With',
'Access-Control-Max-Age': '86400',
'Content-Type': 'application/json'
};
}

// ─── ERROR RESPONSE ───
function errorResponse(message, status = 400, details = null) {
return new Response(JSON.stringify({
success: false,
error: message,
details: details,
timestamp: new Date().toISOString()
}), {
status,
headers: corsHeaders()
});
}

// ─── SUCCESS RESPONSE ───
function successResponse(data, status = 200) {
return new Response(JSON.stringify({
success: true,
data,
timestamp: new Date().toISOString()
}), {
status,
headers: corsHeaders()
});
}

// ─── RATE LIMITING (KV) ───
async function checkRateLimit(request, env) {
const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
const key = rate_limit:${ip};
try {
const current = await env.KV.get(key);
const count = current ? parseInt(current) : 0;
if (count >= CONFIG.RATE_LIMIT) return false;
await env.KV.put(key, (count + 1).toString(), { expirationTtl: CONFIG.RATE_WINDOW });
return true;
} catch (e) {
console.error('Rate limit error:', e);
return true;
}
}

// ─── INPUT SANITIZATION ───
function sanitize(str) {
if (!str || typeof str !== 'string') return '';
return str
.replace(/[<>]/g, '')
.replace(/javascript:/gi, '')
.replace(/on\w+=/gi, '')
.trim()
.substring(0, 2000);
}

function sanitizeUsername(username) {
if (!username) return '';
return username.toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 30);
}

function isValidEmail(email) {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);
}

function isValidURL(url) {
try { new URL(url); return true; } catch { return false; }
}

// ─── UUID GENERATOR ───
function generateUUID() {
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
const r = Math.random() * 16 | 0;
const v = c === 'x' ? r : (r & 0x3 | 0x8);
return v.toString(16);
});
}

// ─── PASSWORD HASH ───
async function hashPassword(password, salt = null) {
salt = salt || generateUUID().replace(/-/g, '').substring(0, 16);
const encoder = new TextEncoder();
const data = encoder.encode(password + salt);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
return { hash, salt };
}

async function verifyPassword(password, storedHash, salt) {
const { hash } = await hashPassword(password, salt);
return hash === storedHash;
}

// ─── JWT UTILITIES ───
async function signJWT(payload, secret) {
const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const claims = { ...payload, iat: now, exp: now + (7 * 24 * 60 * 60) };
const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
const encodedPayload = btoa(JSON.stringify(claims)).replace(/=/g, '');
const data = new TextEncoder().encode(${encodedHeader}.${encodedPayload});
const key = await crypto.subtle.importKey(
'raw', new TextEncoder().encode(secret),
{ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
);
const signature = await crypto.subtle.sign('HMAC', key, data);
const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
return ${encodedHeader}.${encodedPayload}.${encodedSig};
}

async function verifyJWT(token, secret) {
try {
const [header, payload, signature] = token.split('.');
const data = new TextEncoder().encode(${header}.${payload});
const key = await crypto.subtle.importKey(
'raw', new TextEncoder().encode(secret),
{ name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
);
const sigBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(//g, '/')), c => c.charCodeAt(0));
const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
if (!valid) return null;
const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(//g, '/')));
if (claims.exp < Math.floor(Date.now() / 1000)) return null;
return claims;
} catch { return null; }
}

// ─── GEO & DEVICE ───
function getGeoData(request) {
return {
country: request.cf?.country || 'Unknown',
city: request.cf?.city || 'Unknown',
region: request.cf?.region || 'Unknown',
timezone: request.cf?.timezone || 'Unknown',
lat: request.cf?.latitude || null,
lon: request.cf?.longitude || null
};
}

function getDeviceInfo(request) {
const ua = request.headers.get('User-Agent') || '';
const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
const isTablet = /iPad|Tablet/i.test(ua);
let browser = 'Unknown';
if (ua.includes('Chrome')) browser = 'Chrome';
else if (ua.includes('Firefox')) browser = 'Firefox';
else if (ua.includes('Safari')) browser = 'Safari';
else if (ua.includes('Edge')) browser = 'Edge';
else if (ua.includes('Opera')) browser = 'Opera';
let os = 'Unknown';
if (ua.includes('Windows')) os = 'Windows';
else if (ua.includes('Mac')) os = 'macOS';
else if (ua.includes('Linux')) os = 'Linux';
else if (ua.includes('Android')) os = 'Android';
else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
return { device: isMobile ? (isTablet ? 'tablet' : 'mobile') : 'desktop', browser, os, userAgent: ua.substring(0, 500) };
}

// ─── ANALYTICS TRACKING ───
async function trackEvent(env, { user_id, link_id, event_type, request, extra = {} }) {
try {
const geo = getGeoData(request);
const device = getDeviceInfo(request);
const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
const referrer = request.headers.get('Referer') || 'direct';
await env.DB.prepare(  INSERT INTO analytics (user_id, link_id, event_type, ip, country, city, device, browser, referrer, utm_source, utm_medium, utm_campaign)   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)  ).bind(
user_id || null, link_id || null, event_type, ip, geo.country, geo.city,
device.device, device.browser, referrer,
extra.utm_source || '', extra.utm_medium || '', extra.utm_campaign || ''
).run();
} catch (e) { console.error('Analytics error:', e); }
}

// ═══════════════════════════════════════════════════════════════
// MAIN REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════

export default {
async fetch(request, env, ctx) {
const url = new URL(request.url);
const origin = request.headers.get('Origin') || '*';

// Preflight CORS  
if (request.method === 'OPTIONS') {  
  return new Response(null, { status: 204, headers: corsHeaders(origin) });  
}  

// Rate limiting  
const allowed = await checkRateLimit(request, env);  
if (!allowed) {  
  return errorResponse('Rate limit exceeded. Try again in 1 minute.', 429);  
}  

// Route handling  
const path = url.pathname;  
const method = request.method;  

try {  
  // ─── HEALTH CHECK ───  
  if (path === '/api/health') {  
    return successResponse({  
      status: 'healthy',  
      app: CONFIG.APP_NAME,  
      version: '1.0.0',  
      timestamp: new Date().toISOString()  
    });  
  }  

  // ─── AUTH ROUTES ───  
  if (path === '/api/auth/register' && method === 'POST') {  
    return await handleRegister(request, env);  
  }  
  if (path === '/api/auth/login' && method === 'POST') {  
    return await handleLogin(request, env);  
  }  
  if (path === '/api/auth/logout' && method === 'POST') {  
    return await handleLogout(request);  
  }  
  if (path === '/api/auth/me' && method === 'GET') {  
    return await handleGetMe(request, env);  
  }  
  if (path === '/api/auth/refresh' && method === 'POST') {  
    return await handleRefresh(request, env);  
  }  

  // ─── PROFILE ROUTES ───  
  if (path.startsWith('/api/profile/') && method === 'GET' && !path.includes('/stats')) {  
    const username = path.replace('/api/profile/', '');  
    return await handleGetPublicProfile(username, env, request);  
  }  
  if (path === '/api/profile' && method === 'PUT') {  
    return await handleUpdateProfile(request, env);  
  }  
  if (path === '/api/profile/theme' && method === 'PUT') {  
    return await handleUpdateTheme(request, env);  
  }  
  if (path === '/api/profile/stats' && method === 'GET') {  
    return await handleGetStats(request, env);  
  }  

  // ─── LINK ROUTES ───  
  if (path === '/api/links' && method === 'GET') {  
    return await handleGetLinks(request, env);  
  }  
  if (path === '/api/links' && method === 'POST') {  
    return await handleCreateLink(request, env);  
  }  
  if (path.startsWith('/api/links/') && method === 'PUT' && !path.includes('/reorder') && !path.includes('/toggle')) {  
    const id = path.replace('/api/links/', '');  
    return await handleUpdateLink(id, request, env);  
  }  
  if (path.startsWith('/api/links/') && method === 'DELETE') {  
    const id = path.replace('/api/links/', '');  
    return await handleDeleteLink(id, request, env);  
  }  
  if (path === '/api/links/reorder' && method === 'PUT') {  
    return await handleReorderLinks(request, env);  
  }  
  if (path.includes('/toggle') && method === 'PUT') {  
    const id = path.replace('/api/links/', '').replace('/toggle', '');  
    return await handleToggleLink(id, request, env);  
  }  

  // ─── ANALYTICS ROUTES ───  
  if (path === '/api/analytics/overview' && method === 'GET') {  
    return await handleAnalyticsOverview(request, env);  
  }  
  if (path === '/api/analytics/links' && method === 'GET') {  
    return await handleAnalyticsLinks(request, env);  
  }  
  if (path === '/api/analytics/traffic' && method === 'GET') {  
    return await handleAnalyticsTraffic(request, env);  
  }  
  if (path === '/api/analytics/geo' && method === 'GET') {  
    return await handleAnalyticsGeo(request, env);  
  }  
  if (path === '/api/analytics/track' && method === 'POST') {  
    return await handleTrackEvent(request, env);  
  }  

  // ─── SOCIAL LINKS ───  
  if (path === '/api/social' && method === 'GET') {  
    return await handleGetSocialLinks(request, env);  
  }  
  if (path === '/api/social' && method === 'POST') {  
    return await handleCreateSocialLink(request, env);  
  }  
  if (path.startsWith('/api/social/') && method === 'PUT') {  
    const id = path.replace('/api/social/', '');  
    return await handleUpdateSocialLink(id, request, env);  
  }  
  if (path.startsWith('/api/social/') && method === 'DELETE') {  
    const id = path.replace('/api/social/', '');  
    return await handleDeleteSocialLink(id, request, env);  
  }  

  // ─── THEMES ───  
  if (path === '/api/themes' && method === 'GET') {  
    return await handleGetThemes(env);  
  }  

  // ─── SUBSCRIBERS ───  
  if (path === '/api/subscribers' && method === 'GET') {  
    return await handleGetSubscribers(request, env);  
  }  
  if (path === '/api/subscribers' && method === 'POST') {  
    return await handleAddSubscriber(request, env);  
  }  
  if (path.startsWith('/api/subscribers/') && method === 'DELETE') {  
    const id = path.replace('/api/subscribers/', '');  
    return await handleDeleteSubscriber(id, request, env);  
  }  

  // ─── PUBLIC ROUTES (No Auth) ───  
  if (path.startsWith('/api/public/') && method === 'GET') {  
    const username = path.replace('/api/public/', '');  
    return await handleGetPublicProfile(username, env, request);  
  }  
  if (path === '/api/public/click' && method === 'POST') {  
    return await handlePublicClick(request, env);  
  }  
  if (path === '/api/public/subscribe' && method === 'POST') {  
    return await handlePublicSubscribe(request, env);  
  }  
  if (path.startsWith('/api/qr/') && method === 'GET') {  
    const username = path.replace('/api/qr/', '');  
    return await handleGenerateQR(username, env);  
  }  

  // ─── SITEMAP & ROBOTS ───  
  if (path === '/sitemap.xml' && method === 'GET') {  
    return await handleSitemap(env);  
  }  
  if (path === '/robots.txt' && method === 'GET') {  
    return new Response(`User-agent: *\nAllow: /\nSitemap: ${CONFIG.APP_URL}/sitemap.xml`, {  
      headers: { 'Content-Type': 'text/plain' }  
    });  
  }  

  // ─── 404 ───  
  return errorResponse('Not Found', 404);  

} catch (err) {  
  console.error('Worker error:', err);  
  return errorResponse('Internal Server Error', 500, err.message);  
}

}
};

// ═══════════════════════════════════════════════════════════════
// AUTH HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleRegister(request, env) {
try {
const body = await request.json();
const email = sanitize(body.email);
const password = body.password;
const username = sanitizeUsername(body.username);
const displayName = sanitize(body.display_name || username);

if (!email || !password || !username) {  
  return errorResponse('Email, password, and username are required');  
}  
if (!isValidEmail(email)) {  
  return errorResponse('Invalid email format');  
}  
if (password.length < 6) {  
  return errorResponse('Password must be at least 6 characters');  
}  
if (username.length < 3) {  
  return errorResponse('Username must be at least 3 characters');  
}  

// Check if username exists  
const existingUser = await env.DB.prepare(  
  'SELECT id FROM users WHERE username = ? OR email = ?'  
).bind(username, email).first();  

if (existingUser) {  
  return errorResponse('Username or email already exists');  
}  

const id = generateUUID();  
const { hash, salt } = await hashPassword(password);  
const now = new Date().toISOString();  

await env.DB.prepare(`  
  INSERT INTO users (id, email, username, display_name, password_hash, salt, created_at, updated_at)  
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)  
`).bind(id, email, username, displayName, hash, salt, now, now).run();  

// Generate JWT  
const token = await signJWT({ userId: id, username, email }, env.JWT_SECRET || 'linktroo-secret-key-2026');  

return successResponse({  
  user: { id, email, username, display_name: displayName },  
  token,  
  message: 'Account created successfully!'  
}, 201);

} catch (e) {
return errorResponse('Registration failed: ' + e.message, 500);
}
}

async function handleLogin(request, env) {
try {
const body = await request.json();
const email = sanitize(body.email);
const password = body.password;

if (!email || !password) {  
  return errorResponse('Email and password are required');  
}  

const user = await env.DB.prepare(  
  'SELECT id, email, username, display_name, password_hash, salt, avatar_url, theme, accent_color, background_type, background_value, bio FROM users WHERE email = ?'  
).bind(email).first();  

if (!user) {  
  return errorResponse('Invalid email or password', 401);  
}  

const valid = await verifyPassword(password, user.password_hash, user.salt);  
if (!valid) {  
  return errorResponse('Invalid email or password', 401);  
}  

const token = await signJWT(  
  { userId: user.id, username: user.username, email: user.email },  
  env.JWT_SECRET || 'linktroo-secret-key-2026'  
);  

// Update profile views  
await env.DB.prepare('UPDATE users SET profile_views = profile_views + 1 WHERE id = ?').bind(user.id).run();  

return successResponse({  
  user: {  
    id: user.id,  
    email: user.email,  
    username: user.username,  
    display_name: user.display_name,  
    avatar_url: user.avatar_url,  
    theme: user.theme,  
    accent_color: user.accent_color,  
    background_type: user.background_type,  
    background_value: user.background_value,  
    bio: user.bio  
  },  
  token,  
  message: 'Login successful!'  
});

} catch (e) {
return errorResponse('Login failed: ' + e.message, 500);
}
}

async function handleLogout(request) {
return successResponse({ message: 'Logged out successfully' });
}

async function handleGetMe(request, env) {
try {
const authHeader = request.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
return errorResponse('Unauthorized', 401);
}

const token = authHeader.replace('Bearer ', '');  
const claims = await verifyJWT(token, env.JWT_SECRET || 'linktroo-secret-key-2026');  
if (!claims) {  
  return errorResponse('Invalid or expired token', 401);  
}  

const user = await env.DB.prepare(`  
  SELECT id, email, username, display_name, bio, avatar_url, theme, accent_color, secondary_color,  
         background_type, background_value, font_family, button_style, button_color, button_text_color,  
         profile_views, total_clicks, is_verified, is_premium, meta_title, meta_description,  
         custom_domain, remove_branding, created_at  
  FROM users WHERE id = ?  
`).bind(claims.userId).first();  

if (!user) {  
  return errorResponse('User not found', 404);  
}  

return successResponse({ user });

} catch (e) {
return errorResponse('Failed to get user: ' + e.message, 500);
}
}

async function handleRefresh(request, env) {
try {
const authHeader = request.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
return errorResponse('Unauthorized', 401);
}

const token = authHeader.replace('Bearer ', '');  
const claims = await verifyJWT(token, env.JWT_SECRET || 'linktroo-secret-key-2026');  
if (!claims) {  
  return errorResponse('Invalid or expired token', 401);  
}  

const newToken = await signJWT(  
  { userId: claims.userId, username: claims.username, email: claims.email },  
  env.JWT_SECRET || 'linktroo-secret-key-2026'  
);  

return successResponse({ token: newToken });

} catch (e) {
return errorResponse('Refresh failed: ' + e.message, 500);
}
}

// ─── AUTH MIDDLEWARE HELPER ───
async function getAuthUser(request, env) {
const authHeader = request.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

const token = authHeader.replace('Bearer ', '');
const claims = await verifyJWT(token, env.JWT_SECRET || 'linktroo-secret-key-2026');
if (!claims) return null;

const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(claims.userId).first();
return user;
}

// ═══════════════════════════════════════════════════════════════
// PROFILE HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleGetPublicProfile(username, env, request) {
try {
username = sanitizeUsername(username);
if (!username) return errorResponse('Username required', 400);

const user = await env.DB.prepare(`  
  SELECT id, username, display_name, bio, avatar_url, theme, accent_color, secondary_color,  
         background_type, background_value, font_family, button_style, button_color, button_text_color,  
         profile_views, total_clicks, is_verified, is_premium, meta_title, meta_description,  
         custom_domain, remove_branding, created_at  
  FROM users WHERE username = ? AND is_active = 1  
`).bind(username).first();  

if (!user) return errorResponse('Profile not found', 404);  

// Get links  
const links = await env.DB.prepare(`  
  SELECT id, title, url, thumbnail_url, icon, description, category, position,  
         is_active, is_featured, is_priority, click_count, schedule_start, schedule_end  
  FROM links WHERE user_id = ? AND is_active = 1  
  ORDER BY is_priority DESC, position ASC, created_at DESC  
`).bind(user.id).all();  

// Get social links  
const socialLinks = await env.DB.prepare(`  
  SELECT id, platform, url, custom_icon, position, is_active  
  FROM social_links WHERE user_id = ? AND is_active = 1  
  ORDER BY position ASC  
`).bind(user.id).all();  

// Track profile view  
await trackEvent(env, { user_id: user.id, event_type: 'view', request });  
await env.DB.prepare('UPDATE users SET profile_views = profile_views + 1 WHERE id = ?').bind(user.id).run();  

return successResponse({  
  profile: user,  
  links: links.results || [],  
  social_links: socialLinks.results || []  
});

} catch (e) {
return errorResponse('Failed to get profile: ' + e.message, 500);
}
}

async function handleUpdateProfile(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const body = await request.json();  
const updates = [];  
const values = [];  

const allowedFields = [  
  'display_name', 'bio', 'avatar_url', 'meta_title', 'meta_description',  
  'custom_domain', 'remove_branding'  
];  

for (const field of allowedFields) {  
  if (body[field] !== undefined) {  
    updates.push(`${field} = ?`);  
    values.push(sanitize(body[field]));  
  }  
}  

if (updates.length === 0) {  
  return errorResponse('No fields to update');  
}  

values.push(new Date().toISOString());  
values.push(user.id);  

await env.DB.prepare(`  
  UPDATE users SET ${updates.join(', ')}, updated_at = ? WHERE id = ?  
`).bind(...values).run();  

return successResponse({ message: 'Profile updated successfully' });

} catch (e) {
return errorResponse('Update failed: ' + e.message, 500);
}
}

async function handleUpdateTheme(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const body = await request.json();  
const updates = [];  
const values = [];  

const themeFields = [  
  'theme', 'accent_color', 'secondary_color', 'background_type', 'background_value',  
  'font_family', 'button_style', 'button_color', 'button_text_color'  
];  

for (const field of themeFields) {  
  if (body[field] !== undefined) {  
    updates.push(`${field} = ?`);  
    values.push(sanitize(body[field]));  
  }  
}  

if (updates.length === 0) {  
  return errorResponse('No theme fields to update');  
}  

values.push(new Date().toISOString());  
values.push(user.id);  

await env.DB.prepare(`  
  UPDATE users SET ${updates.join(', ')}, updated_at = ? WHERE id = ?  
`).bind(...values).run();  

return successResponse({ message: 'Theme updated successfully' });

} catch (e) {
return errorResponse('Theme update failed: ' + e.message, 500);
}
}

async function handleGetStats(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

// Total views  
const viewsResult = await env.DB.prepare(  
  'SELECT profile_views FROM users WHERE id = ?'  
).bind(user.id).first();  

// Total clicks  
const clicksResult = await env.DB.prepare(`  
  SELECT SUM(click_count) as total_clicks FROM links WHERE user_id = ?  
`).bind(user.id).first();  

// Total links  
const linksResult = await env.DB.prepare(  
  'SELECT COUNT(*) as count FROM links WHERE user_id = ?'  
).bind(user.id).first();  

// Total subscribers  
const subsResult = await env.DB.prepare(  
  'SELECT COUNT(*) as count FROM subscribers WHERE user_id = ? AND is_active = 1'  
).bind(user.id).first();  

// Recent analytics (last 30 days)  
const thirtyDaysAgo = new Date();  
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  

const recentViews = await env.DB.prepare(`  
  SELECT COUNT(*) as count FROM analytics   
  WHERE user_id = ? AND event_type = 'view' AND created_at > ?  
`).bind(user.id, thirtyDaysAgo.toISOString()).first();  

const recentClicks = await env.DB.prepare(`  
  SELECT COUNT(*) as count FROM analytics   
  WHERE user_id = ? AND event_type = 'click' AND created_at > ?  
`).bind(user.id, thirtyDaysAgo.toISOString()).first();  

return successResponse({  
  total_views: viewsResult?.profile_views || 0,  
  total_clicks: clicksResult?.total_clicks || 0,  
  total_links: linksResult?.count || 0,  
  total_subscribers: subsResult?.count || 0,  
  recent_views: recentViews?.count || 0,  
  recent_clicks: recentClicks?.count || 0,  
  username: user.username,  
  profile_url: `${CONFIG.APP_URL}/@${user.username}`  
});

} catch (e) {
return errorResponse('Failed to get stats: ' + e.message, 500);
}
}

// ═══════════════════════════════════════════════════════════════
// LINK HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleGetLinks(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const links = await env.DB.prepare(`  
  SELECT id, title, url, thumbnail_url, icon, description, category, position,  
         is_active, is_featured, is_priority, click_count, schedule_start, schedule_end,  
         utm_source, utm_medium, utm_campaign, created_at  
  FROM links WHERE user_id = ?  
  ORDER BY is_priority DESC, position ASC, created_at DESC  
`).bind(user.id).all();  

return successResponse({ links: links.results || [] });

} catch (e) {
return errorResponse('Failed to get links: ' + e.message, 500);
}
}

async function handleCreateLink(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const body = await request.json();  
const title = sanitize(body.title);  
const url = sanitize(body.url);  

if (!title || !url) {  
  return errorResponse('Title and URL are required');  
}  
if (!isValidURL(url)) {  
  return errorResponse('Invalid URL format');  
}  

// Check link limit  
const countResult = await env.DB.prepare(  
  'SELECT COUNT(*) as count FROM links WHERE user_id = ?'  
).bind(user.id).first();  

if (countResult.count >= CONFIG.MAX_LINKS) {  
  return errorResponse(`Maximum ${CONFIG.MAX_LINKS} links allowed`);  
}  

const id = generateUUID();  
const now = new Date().toISOString();  

await env.DB.prepare(`  
  INSERT INTO links (id, user_id, title, url, thumbnail_url, icon, description, category,  
                     position, is_active, is_featured, is_priority, schedule_start, schedule_end,  
                     utm_source, utm_medium, utm_campaign, created_at, updated_at)  
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)  
`).bind(  
  id, user.id, title, url,  
  sanitize(body.thumbnail_url || ''),  
  sanitize(body.icon || ''),  
  sanitize(body.description || ''),  
  sanitize(body.category || 'general'),  
  body.position || 0,  
  body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,  
  body.is_featured ? 1 : 0,  
  body.is_priority ? 1 : 0,  
  body.schedule_start || null,  
  body.schedule_end || null,  
  sanitize(body.utm_source || ''),  
  sanitize(body.utm_medium || ''),  
  sanitize(body.utm_campaign || ''),  
  now, now  
).run();  

return successResponse({  
  id,  
  title,  
  url,  
  message: 'Link created successfully'  
}, 201);

} catch (e) {
return errorResponse('Failed to create link: ' + e.message, 500);
}
}

async function handleUpdateLink(id, request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const body = await request.json();  
const updates = [];  
const values = [];  

const allowedFields = [  
  'title', 'url', 'thumbnail_url', 'icon', 'description', 'category',  
  'position', 'is_active', 'is_featured', 'is_priority',  
  'schedule_start', 'schedule_end', 'utm_source', 'utm_medium', 'utm_campaign'  
];  

for (const field of allowedFields) {  
  if (body[field] !== undefined) {  
    updates.push(`${field} = ?`);  
    if (field === 'is_active' || field === 'is_featured' || field === 'is_priority') {  
      values.push(body[field] ? 1 : 0);  
    } else {  
      values.push(sanitize(body[field]));  
    }  
  }  
}  

if (updates.length === 0) {  
  return errorResponse('No fields to update');  
}  

values.push(new Date().toISOString());  
values.push(id);  
values.push(user.id);  

await env.DB.prepare(`  
  UPDATE links SET ${updates.join(', ')}, updated_at = ? WHERE id = ? AND user_id = ?  
`).bind(...values).run();  

return successResponse({ message: 'Link updated successfully' });

} catch (e) {
return errorResponse('Failed to update link: ' + e.message, 500);
}
}

async function handleDeleteLink(id, request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

await env.DB.prepare('DELETE FROM links WHERE id = ? AND user_id = ?').bind(id, user.id).run();  

return successResponse({ message: 'Link deleted successfully' });

} catch (e) {
return errorResponse('Failed to delete link: ' + e.message, 500);
}
}

async function handleReorderLinks(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const body = await request.json();  
const orders = body.orders; // Array of {id, position}  

if (!Array.isArray(orders)) {  
  return errorResponse('Orders array required');  
}  

for (const item of orders) {  
  await env.DB.prepare(  
    'UPDATE links SET position = ? WHERE id = ? AND user_id = ?'  
  ).bind(item.position, item.id, user.id).run();  
}  

return successResponse({ message: 'Links reordered successfully' });

} catch (e) {
return errorResponse('Failed to reorder: ' + e.message, 500);
}
}

async function handleToggleLink(id, request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const link = await env.DB.prepare(  
  'SELECT is_active FROM links WHERE id = ? AND user_id = ?'  
).bind(id, user.id).first();  

if (!link) return errorResponse('Link not found', 404);  

const newStatus = link.is_active ? 0 : 1;  
await env.DB.prepare(  
  'UPDATE links SET is_active = ? WHERE id = ? AND user_id = ?'  
).bind(newStatus, id, user.id).run();  

return successResponse({ is_active: !!newStatus });

} catch (e) {
return errorResponse('Toggle failed: ' + e.message, 500);
}
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleAnalyticsOverview(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

// Views over last 7 days  
const sevenDaysAgo = new Date();  
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);  

const dailyViews = await env.DB.prepare(`  
  SELECT date(created_at) as date, COUNT(*) as count  
  FROM analytics  
  WHERE user_id = ? AND event_type = 'view' AND created_at > ?  
  GROUP BY date(created_at)  
  ORDER BY date DESC  
`).bind(user.id, sevenDaysAgo.toISOString()).all();  

// Clicks over last 7 days  
const dailyClicks = await env.DB.prepare(`  
  SELECT date(created_at) as date, COUNT(*) as count  
  FROM analytics  
  WHERE user_id = ? AND event_type = 'click' AND created_at > ?  
  GROUP BY date(created_at)  
  ORDER BY date DESC  
`).bind(user.id, sevenDaysAgo.toISOString()).all();  

// Top countries  
const countries = await env.DB.prepare(`  
  SELECT country, COUNT(*) as count  
  FROM analytics  
  WHERE user_id = ? AND created_at > ?  
  GROUP BY country  
  ORDER BY count DESC  
  LIMIT 10  
`).bind(user.id, sevenDaysAgo.toISOString()).all();  

// Top devices  
const devices = await env.DB.prepare(`  
  SELECT device, COUNT(*) as count  
  FROM analytics  
  WHERE user_id = ? AND created_at > ?  
  GROUP BY device  
  ORDER BY count DESC  
`).bind(user.id, sevenDaysAgo.toISOString()).all();  

// Top browsers  
const browsers = await env.DB.prepare(`  
  SELECT browser, COUNT(*) as count  
  FROM analytics  
  WHERE user_id = ? AND created_at > ?  
  GROUP BY browser  
  ORDER BY count DESC  
`).bind(user.id, sevenDaysAgo.toISOString()).all();  

return successResponse({  
  daily_views: dailyViews.results || [],  
  daily_clicks: dailyClicks.results || [],  
  countries: countries.results || [],  
  devices: devices.results || [],  
  browsers: browsers.results || []  
});

} catch (e) {
return errorResponse('Analytics error: ' + e.message, 500);
}
}

async function handleAnalyticsLinks(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const linkStats = await env.DB.prepare(`  
  SELECT l.id, l.title, l.url, l.click_count,  
         COUNT(a.id) as analytics_clicks  
  FROM links l  
  LEFT JOIN analytics a ON l.id = a.link_id AND a.event_type = 'click'  
  WHERE l.user_id = ?  
  GROUP BY l.id  
  ORDER BY analytics_clicks DESC  
`).bind(user.id).all();  

return successResponse({ links: linkStats.results || [] });

} catch (e) {
return errorResponse('Link analytics error: ' + e.message, 500);
}
}

async function handleAnalyticsTraffic(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const thirtyDaysAgo = new Date();  
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  

const sources = await env.DB.prepare(`  
  SELECT referrer, COUNT(*) as count  
  FROM analytics  
  WHERE user_id = ? AND created_at > ?  
  GROUP BY referrer  
  ORDER BY count DESC  
  LIMIT 20  
`).bind(user.id, thirtyDaysAgo.toISOString()).all();  

const utmSources = await env.DB.prepare(`  
  SELECT utm_source, COUNT(*) as count  
  FROM analytics  
  WHERE user_id = ? AND utm_source != '' AND created_at > ?  
  GROUP BY utm_source  
  ORDER BY count DESC  
  LIMIT 10  
`).bind(user.id, thirtyDaysAgo.toISOString()).all();  

return successResponse({  
  referrers: sources.results || [],  
  utm_sources: utmSources.results || []  
});

} catch (e) {
return errorResponse('Traffic error: ' + e.message, 500);
}
}

async function handleAnalyticsGeo(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const thirtyDaysAgo = new Date();  
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  

const geoData = await env.DB.prepare(`  
  SELECT country, city, COUNT(*) as count  
  FROM analytics  
  WHERE user_id = ? AND created_at > ?  
  GROUP BY country, city  
  ORDER BY count DESC  
  LIMIT 50  
`).bind(user.id, thirtyDaysAgo.toISOString()).all();  

return successResponse({ geo: geoData.results || [] });

} catch (e) {
return errorResponse('Geo error: ' + e.message, 500);
}
}

async function handleTrackEvent(request, env) {
try {
const body = await request.json();

await trackEvent(env, {  
  user_id: body.user_id,  
  link_id: body.link_id,  
  event_type: body.event_type || 'click',  
  request,  
  extra: {  
    utm_source: body.utm_source,  
    utm_medium: body.utm_medium,  
    utm_campaign: body.utm_campaign  
  }  
});  

// Update link click count if link_id provided  
if (body.link_id) {  
  await env.DB.prepare(  
    'UPDATE links SET click_count = click_count + 1 WHERE id = ?'  
  ).bind(body.link_id).run();  

  // Update user total clicks  
  if (body.user_id) {  
    await env.DB.prepare(  
      'UPDATE users SET total_clicks = total_clicks + 1 WHERE id = ?'  
    ).bind(body.user_id).run();  
  }  
}  

return successResponse({ tracked: true });

} catch (e) {
return errorResponse('Track error: ' + e.message, 500);
}
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL LINK HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleGetSocialLinks(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const links = await env.DB.prepare(`  
  SELECT id, platform, url, custom_icon, position, is_active, created_at  
  FROM social_links WHERE user_id = ?  
  ORDER BY position ASC  
`).bind(user.id).all();  

return successResponse({ social_links: links.results || [] });

} catch (e) {
return errorResponse('Social links error: ' + e.message, 500);
}
}

async function handleCreateSocialLink(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const body = await request.json();  
const platform = sanitize(body.platform);  
const url = sanitize(body.url);  

if (!platform || !url) {  
  return errorResponse('Platform and URL are required');  
}  
if (!CONFIG.SOCIAL_PLATFORMS.includes(platform.toLowerCase())) {  
  return errorResponse('Unsupported platform');  
}  
if (!isValidURL(url)) {  
  return errorResponse('Invalid URL');  
}  

const id = generateUUID();  
const now = new Date().toISOString();  

await env.DB.prepare(`  
  INSERT INTO social_links (id, user_id, platform, url, custom_icon, position, is_active, created_at)  
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)  
`).bind(id, user.id, platform.toLowerCase(), url, sanitize(body.custom_icon || ''), body.position || 0, 1, now).run();  

return successResponse({ id, platform, url, message: 'Social link added' }, 201);

} catch (e) {
return errorResponse('Create social link error: ' + e.message, 500);
}
}

async function handleUpdateSocialLink(id, request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const body = await request.json();  
const updates = [];  
const values = [];  

if (body.platform !== undefined) { updates.push('platform = ?'); values.push(sanitize(body.platform)); }  
if (body.url !== undefined) { updates.push('url = ?'); values.push(sanitize(body.url)); }  
if (body.custom_icon !== undefined) { updates.push('custom_icon = ?'); values.push(sanitize(body.custom_icon)); }  
if (body.position !== undefined) { updates.push('position = ?'); values.push(body.position); }  
if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active ? 1 : 0); }  

if (updates.length === 0) return errorResponse('No fields to update');  

values.push(id);  
values.push(user.id);  

await env.DB.prepare(`  
  UPDATE social_links SET ${updates.join(', ')} WHERE id = ? AND user_id = ?  
`).bind(...values).run();  

return successResponse({ message: 'Social link updated' });

} catch (e) {
return errorResponse('Update error: ' + e.message, 500);
}
}

async function handleDeleteSocialLink(id, request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

await env.DB.prepare('DELETE FROM social_links WHERE id = ? AND user_id = ?').bind(id, user.id).run();  
return successResponse({ message: 'Social link deleted' });

} catch (e) {
return errorResponse('Delete error: ' + e.message, 500);
}
}

// ═══════════════════════════════════════════════════════════════
// THEME HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleGetThemes(env) {
try {
const themes = await env.DB.prepare(  SELECT id, name, thumbnail_url, background_type, background_value,   button_style, button_color, button_text_color, accent_color, secondary_color,   font_family, is_premium, category   FROM themes ORDER BY category, name  ).all();

return successResponse({ themes: themes.results || [] });

} catch (e) {
return errorResponse('Themes error: ' + e.message, 500);
}
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIBER HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleGetSubscribers(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const subscribers = await env.DB.prepare(`  
  SELECT id, email, name, is_active, subscribed_at  
  FROM subscribers WHERE user_id = ?  
  ORDER BY subscribed_at DESC  
`).bind(user.id).all();  

return successResponse({ subscribers: subscribers.results || [] });

} catch (e) {
return errorResponse('Subscribers error: ' + e.message, 500);
}
}

async function handleAddSubscriber(request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

const body = await request.json();  
const email = sanitize(body.email);  
const name = sanitize(body.name || '');  

if (!email || !isValidEmail(email)) {  
  return errorResponse('Valid email required');  
}  

const id = generateUUID();  
const now = new Date().toISOString();  

await env.DB.prepare(`  
  INSERT OR IGNORE INTO subscribers (id, user_id, email, name, is_active, subscribed_at)  
  VALUES (?, ?, ?, ?, ?, ?)  
`).bind(id, user.id, email, name, 1, now).run();  

return successResponse({ id, email, message: 'Subscriber added' }, 201);

} catch (e) {
return errorResponse('Add subscriber error: ' + e.message, 500);
}
}

async function handleDeleteSubscriber(id, request, env) {
try {
const user = await getAuthUser(request, env);
if (!user) return errorResponse('Unauthorized', 401);

await env.DB.prepare('DELETE FROM subscribers WHERE id = ? AND user_id = ?').bind(id, user.id).run();  
return successResponse({ message: 'Subscriber removed' });

} catch (e) {
return errorResponse('Delete error: ' + e.message, 500);
}
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES (NO AUTH)
// ═══════════════════════════════════════════════════════════════

async function handlePublicClick(request, env) {
try {
const body = await request.json();
const linkId = body.link_id;
const userId = body.user_id;

if (linkId) {  
  await env.DB.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?').bind(linkId).run();  
}  
if (userId) {  
  await env.DB.prepare('UPDATE users SET total_clicks = total_clicks + 1 WHERE id = ?').bind(userId).run();  
}  

await trackEvent(env, {  
  user_id: userId,  
  link_id: linkId,  
  event_type: 'click',  
  request,  
  extra: {  
    utm_source: body.utm_source,  
    utm_medium: body.utm_medium,  
    utm_campaign: body.utm_campaign  
  }  
});  

return successResponse({ tracked: true });

} catch (e) {
return errorResponse('Click tracking error: ' + e.message, 500);
}
}

async function handlePublicSubscribe(request, env) {
try {
const body = await request.json();
const userId = body.user_id;
const email = sanitize(body.email);
const name = sanitize(body.name || '');

if (!userId || !email || !isValidEmail(email)) {  
  return errorResponse('User ID and valid email required');  
}  

const id = generateUUID();  
const now = new Date().toISOString();  

await env.DB.prepare(`  
  INSERT OR IGNORE INTO subscribers (id, user_id, email, name, is_active, subscribed_at)  
  VALUES (?, ?, ?, ?, ?, ?)  
`).bind(id, userId, email, name, 1, now).run();  

return successResponse({ message: 'Subscribed successfully!' });

} catch (e) {
return errorResponse('Subscribe error: ' + e.message, 500);
}
}

async function handleGenerateQR(username, env) {
try {
username = sanitizeUsername(username);
if (!username) return errorResponse('Username required', 400);

const profileUrl = `${CONFIG.APP_URL}/@${username}`;  
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}&color=ff0080&bgcolor=0a0a0a`;  

const response = await fetch(qrUrl);  
if (!response.ok) throw new Error('QR generation failed');  

const qrImage = await response.arrayBuffer();  

return new Response(qrImage, {  
  headers: {  
    'Content-Type': 'image/png',  
    'Cache-Control': 'public, max-age=86400',  
    'Access-Control-Allow-Origin': '*'  
  }  
});

} catch (e) {
return errorResponse('QR generation failed: ' + e.message, 500);
}
}

async function handleSitemap(env) {
try {
const users = await env.DB.prepare(
'SELECT username, updated_at FROM users WHERE is_active = 1'
).all();

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">  
  <url>  
    <loc>${CONFIG.APP_URL}/</loc>  
    <priority>1.0</priority>  
    <changefreq>daily</changefreq>  
  </url>  
  <url>  
    <loc>${CONFIG.APP_URL}/login</loc>  
    <priority>0.5</priority>  
  </url>  
  <url>  
    <loc>${CONFIG.APP_URL}/signup</loc>  
    <priority>0.5</priority>  
  </url>`;  for (const user of (users.results || [])) {  
  sitemap += `

  <url>  
    <loc>${CONFIG.APP_URL}/@${user.username}</loc>  
    <lastmod>${user.updated_at || new Date().toISOString()}</lastmod>  
    <priority>0.8</priority>  
    <changefreq>weekly</changefreq>  
  </url>`;  
    }  sitemap += '\n</urlset>';  

return new Response(sitemap, {  
  headers: {  
    'Content-Type': 'application/xml',  
    'Cache-Control': 'public, max-age=3600'  
  }  
});

} catch (e) {
return errorResponse('Sitemap error: ' + e.message, 500);
}
}

//
// END OF WORKER
// ═══════════════════════════════════════════════════════════════ok...
