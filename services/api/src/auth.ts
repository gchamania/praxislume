import { createClient } from '@supabase/supabase-js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiConfig } from './config.js';
import { sendError } from './envelope.js';

export type AuthContext = {
  userId: string;
  token: string;
};

export type AuthTokenVerifier = (token: string) => Promise<{ userId: string } | null>;

type AuthenticateRequestOptions = {
  allowTestTokens?: boolean;
  verifyToken?: AuthTokenVerifier;
};

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export function authenticateRequest(options: AuthenticateRequestOptions = {}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return sendError(reply, request, 401, 'unauthorized', 'Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      return sendError(reply, request, 401, 'unauthorized', 'Missing bearer token');
    }

    if (options.allowTestTokens && token.startsWith('test-user-')) {
      request.auth = { userId: token, token };
      return undefined;
    }

    const verified = await options.verifyToken?.(token);
    if (!verified) {
      return sendError(reply, request, 401, 'unauthorized', 'Invalid bearer token');
    }

    request.auth = { userId: verified.userId, token };
    return undefined;
  };
}

export function createSupabaseTokenVerifier(config: Pick<ApiConfig, 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'>): AuthTokenVerifier {
  const client = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return async (token: string) => {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user?.id) {
      return null;
    }

    return { userId: data.user.id };
  };
}
