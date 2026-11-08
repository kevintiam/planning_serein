/** Racine App Router ; les styles sont locaux, sans police distante obligatoire. */
import './globals.css';
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
