/**
 * Vercel Serverless Function — Discord OAuth
 * 
 * Handles:
 *   GET /api/discord-login?action=start → redirect to Discord
 *   GET /api/discord-login?action=callback&code=xxx → redirect back to Firebase site
 * 
 * Environment variables (set in Vercel dashboard):
 *   DISCORD_CLIENT_ID
 *   DISCORD_CLIENT_SECRET
 *   FRONTEND_URL (default: http://localhost:5173, production: your Firebase Hosting URL)
 */

const DISCORD_API = 'https://discord.com/api/v10';

export default async function handler(req, res) {
  const { action, code, state } = req.query;

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'Discord OAuth not configured' });
    return;
  }

  // Use the production aliased URL to avoid Vercel preview URL issues
  const callbackUrl = `https://raggooner-discord-oauth.vercel.app/api/discord-login`;

  // Step 1: Redirect to Discord authorization
  if (action === 'start') {
    const discordAuthUrl = `${DISCORD_API}/oauth2/authorize?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl + '?action=callback')}` +
      `&response_type=code` +
      `&scope=identify`;

    res.redirect(302, discordAuthUrl);
    return;
  }

  // Step 2: Handle Discord callback
  if (action === 'callback' && code) {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl + '?action=callback',
        }),
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        res.status(400).json({ error: 'Discord token exchange failed', details: err });
        return;
      }

      const tokenData = await tokenResponse.json();

      // Get Discord user info
      const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userResponse.ok) {
        res.status(400).json({ error: 'Failed to get Discord user info' });
        return;
      }

      const discordUser = await userResponse.json();
      const discordId = discordUser.id;
      const globalName = discordUser.global_name || discordUser.username;
      const avatarHash = discordUser.avatar;
      const photoURL = avatarHash
        ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`
        : null;

      // Generate a UID from the Discord ID
      const uid = `discord_${discordId}`;

      // Redirect to frontend with user info
      const redirectUrl = `${frontendUrl}/auth/callback?` +
        `uid=${encodeURIComponent(uid)}` +
        `&discordId=${encodeURIComponent(discordId)}` +
        `&displayName=${encodeURIComponent(globalName)}` +
        `&photoURL=${encodeURIComponent(photoURL || '')}` +
        `&state=${state || ''}`;

      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('Discord OAuth error:', error);
      res.status(500).json({ error: 'Login failed', message: error.message });
    }
    return;
  }

  res.status(400).json({ error: 'Invalid request. Use ?action=start to begin login.' });
}
