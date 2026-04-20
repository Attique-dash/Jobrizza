/**
 * Helper to get the correct Flask auth token for server-side API route proxies.
 * Flask expects: "Bearer token_<user_id>"
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getFlaskAuthHeader(): Promise<{ Authorization: string } | null> {
  const session = await getServerSession(authOptions);
  const flaskToken = (session as any)?.flaskToken;
  if (!flaskToken) return null;
  return { Authorization: `Bearer ${flaskToken}` };
}
