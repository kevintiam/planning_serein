/** Unique point d'entrée HTTP côté navigateur. Aucun fetch dans les JSX/hooks. */
/**
 * Envoie une requête à /api<path> en JSON.
 * Renvoie le JSON de la réponse, ou lève une Error dont `message` vient du serveur
 * et `status` est le code HTTP (utile pour détecter un 401).
 * @param body objet converti en JSON (facultatif)
 * @param signal AbortSignal pour annuler la requête
 */
export async function request(path, { body, signal, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    signal,
    // Envoie le cookie de session ; « no-store » évite toute réponse en cache.
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  // Une réponse sans JSON (ex. erreur réseau du serveur) donne un objet vide.
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'La requête a échoué.');
    error.status = response.status;
    throw error;
  }
  return data;
}
