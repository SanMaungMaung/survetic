// Simple authentication helper for Vercel deployment
export function extractAuthToken(req: any): string | null {
  // Try multiple ways to get the auth token for Vercel compatibility
  
  // Method 1: Standard Authorization header
  const authHeader = req.headers.authorization || req.headers['Authorization'];
  const authHeaderStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  
  if (authHeaderStr && typeof authHeaderStr === 'string' && authHeaderStr.startsWith('Bearer ')) {
    return authHeaderStr.split(' ')[1];
  }
  
  // Method 2: Query parameter (fallback for Vercel)
  const tokenFromQuery = req.query?.token;
  if (tokenFromQuery && typeof tokenFromQuery === 'string') {
    return tokenFromQuery;
  }
  
  // Method 3: Cookie (for session-based auth)
  const tokenFromCookie = req.cookies?.authToken;
  if (tokenFromCookie && typeof tokenFromCookie === 'string') {
    return tokenFromCookie;
  }
  
  return null;
}

export function setAuthCookie(res: any, token: string) {
  res.setHeader('Set-Cookie', `authToken=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`);
}