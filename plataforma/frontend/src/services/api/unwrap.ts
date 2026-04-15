export function unwrapResponse<T>(response: unknown): T {
  const envelope = response as { data?: T };
  return envelope.data !== undefined ? envelope.data : (response as T);
}
