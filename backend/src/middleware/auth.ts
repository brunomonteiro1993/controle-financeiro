import type { NextFunction, Request, Response } from 'express';
import { getUserFromToken, supabaseAsUser } from '../lib/supabase.js';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export type AuthedRequest = Request & {
  user: User;
  accessToken: string;
  supabase: SupabaseClient;
};

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação ausente.' });
    return;
  }

  const accessToken = header.slice('Bearer '.length).trim();
  if (!accessToken) {
    res.status(401).json({ error: 'Token de autenticação inválido.' });
    return;
  }

  const user = await getUserFromToken(accessToken);
  if (!user) {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  const authed = req as AuthedRequest;
  authed.user = user;
  authed.accessToken = accessToken;
  authed.supabase = supabaseAsUser(accessToken);
  next();
}
