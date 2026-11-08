/** Unique point d'entrée HTTP côté navigateur. Aucun fetch dans les JSX/hooks. */
export async function request(path, { body, signal, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'La requête a échoué.');
    error.status = response.status;
    throw error;
  }
  return data;
}
