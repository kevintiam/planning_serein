/** Mise en page racine (App Router) : langue, titre de l'onglet et styles globaux (polices Google Fonts incluses). */
import './globals.css';
// Titre et description de l'onglet du navigateur et des moteurs de recherche.
export const metadata = {
  title: 'Planning Serein',
  description: 'Les disponibilités de chacun, un planning pour tous.',
};
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
