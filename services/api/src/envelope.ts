import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { apiErrorCodeSchema } from '@praxislume/contracts';

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export function requestIdFrom(request: FastifyRequest): string {
  return String(request.id);
}

export function sendOk(reply: FastifyReply, request: FastifyRequest, data: unknown, statusCode = 200) {
  return reply.code(statusCode).send({
    ok: true,
    data,
    requestId: requestIdFrom(request)
  });
}

export function sendError(
  reply: FastifyReply,
  request: FastifyRequest,
  statusCode: number,
  code: ApiErrorCode,
  message: string
) {
  return reply.code(statusCode).send({
    ok: false,
    error: {
      code,
      message
    },
    requestId: requestIdFrom(request)
  });
}
