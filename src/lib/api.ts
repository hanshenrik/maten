/** JSON response helpers for the API routes. */

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const apiError = (message: string, status: number): Response =>
  json({ error: message }, status);
