/** Petites aides d'affichage, sans dépendance au navigateur. */
/** Initiales pour les avatars : « Kevin Tiam » → « KT », « Kevin » → « KE ». */
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}
