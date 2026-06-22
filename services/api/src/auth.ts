import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendError } from './envelope.js';

export type AuthContext = {
  userId: string;
  token: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export function authenticateRequest(allowTestTokens = false) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return sendError(reply, request, 401, 'unauthorized', 'Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      return sendError(reply, request, 401, 'unauthorized', 'Missing bearer token');
    }

    if (allowTestTokens && token.startsWith('test-user-')) {
      request.auth = { userId: token, token };
      return undefined;
    }

    request.auth = { userId: 'supabase-user-pending-verification', token };
    return undefined;
  };
}
