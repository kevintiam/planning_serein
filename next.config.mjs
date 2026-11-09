/** Configuration Node.js standard : fonctionne sur Vercel ou un serveur Node. */
const config = {
  // Ne pas annoncer « X-Powered-By: Next.js » (moins d'informations pour un attaquant).
  poweredByHeader: false,
  // En-têtes de sécurité ajoutés à toutes les pages et routes.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Le navigateur ne devine pas le type d'un fichier.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Interdit d'afficher l'app dans une iframe (protection contre le clickjacking).
          { key: 'X-Frame-Options', value: 'DENY' },
          // N'envoie que le domaine (pas l'adresse complète) aux autres sites.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Désactive caméra, micro et géolocalisation, inutiles ici.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
