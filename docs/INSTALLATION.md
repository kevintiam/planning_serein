# Installation détaillée

## 1. Créer la base Neon

1. Connectez-vous à votre compte Neon et créez un projet PostgreSQL.
2. Choisissez une région proche du serveur qui hébergera Next.js.
3. Dans « Connect », choisissez votre base et votre rôle PostgreSQL.
4. Activez le pooling : copiez cette URL dans `DATABASE_URL`.
5. Désactivez le pooling : copiez l'URL directe dans `DATABASE_URL_UNPOOLED`.
6. Gardez les paramètres SSL fournis par Neon. Ne désactivez pas TLS.

Ne mettez jamais ces valeurs dans une variable `NEXT_PUBLIC_*`, un fichier JSX,
un message public ou le dépôt Git. `.env.local` est ignoré par Git.
L'URL peut contenir un mot de passe encodé : utilisez celle copiée depuis Neon.

## 2. Installer et initialiser

Pour une base existante du premier ZIP, suivez d’abord `REPRISE_BASE_EXISTANTE.md`.
`npm ci` génère Prisma Client ; `db:migrate` lance Prisma migrate deploy.

```bash
npm ci
npm run db:migrate
npm run admin:create
npm run dev
```

Le script `admin:create` utilise une saisie masquée du mot de passe. Il affiche
le code d'invitation une seule fois. Vous pouvez en générer un autre dans
« Mon équipe ». Un courriel existant provoque une erreur, sans élévation de rôle.

## 3. Vérifier le parcours

1. Connectez-vous avec l'administrateur.
2. Dans une fenêtre privée, créez Alice avec le code d'équipe.
3. Sélectionnez tous les lundis comme indisponibles et validez le mois.
4. Créez Bob, ne cochez aucune date et validez le mois.
5. Dans le compte admin, ouvrez un lundi : Bob apparaît, Alice est masquée.
6. Ouvrez un mardi : les deux personnes apparaissent.
7. Attribuez une tâche à Bob de 19h à 21h.
8. Un autre créneau chevauchant cet horaire ne doit plus proposer Bob.
9. Publiez le mois : Bob voit sa tâche dans son espace.
10. Modifiez une disponibilité : le planning retourne en brouillon.

## 4. Mettre en production

Le projet se déploie sur un hébergeur Next.js Node compatible PostgreSQL
(par exemple Vercel, ou un serveur Node derrière un reverse proxy HTTPS).

- Définissez `DATABASE_URL`, `DATABASE_URL_UNPOOLED` et `APP_URL` dans les secrets
  de l'hébergeur. `APP_URL` est l'origine publique exacte, sans slash final.
- Appliquez `npm run db:migrate` avec la connexion de production, une seule fois
  par migration, avant de servir la nouvelle version.
- Exécutez `npm run build`, puis `npm start` si l'hébergeur ne le fait pas.
- Utilisez HTTPS : les cookies de production sont Secure.
- Sur Vercel, gardez le runtime Node.js. Aucun runtime Edge n'est utilisé.
- Ne publiez jamais `.env.local`, les logs sensibles ou les fichiers de test locaux.

Ne lancez pas un export statique : l'authentification et les API nécessitent Node.
Le build ne doit pas appliquer automatiquement les migrations.

## 5. Maintenance

- `npm run password:reset` réinitialise un compte avec accès opérateur à la base.
- Les migrations ne détruisent pas les tables existantes.
- Configurez sauvegardes et récupération selon votre offre Neon.
- Une maintenance périodique peut supprimer les sessions expirées et les vieux
  compteurs de tentatives. Les lignes expirées sont ignorées fonctionnellement.
- Pour empêcher de nouvelles inscriptions, remplacez le code d'invitation et
  ne distribuez pas le nouveau code.

## Dépannage

| Symptôme | Vérification |
|---|---|
| DATABASE_URL manque | Nom du fichier `.env.local`, puis redémarrage du serveur |
| Connexion PostgreSQL refusée | URL, SSL, projet Neon actif et réseau de l'hébergeur |
| Relation « users » inexistante | Exécuter `npm run db:migrate` sur la même base |
| Origine refusée | APP_URL doit correspondre exactement au protocole, hôte et port |
| Impossible de rester connecté en production | HTTPS obligatoire pour le cookie Secure |
| Aucun participant proposé | Mois validé, pas d'absence et pas de chevauchement |
| Mauvais mot de passe | Script `password:reset`, puis nouvelle connexion |
| Inscription refusée | Code valide et courriel non déjà utilisé |

## Limites de vérification de la livraison

Les tests exécutés couvrent les services via Prisma Client sur PostgreSQL embarqué PGlite ainsi
que le calendrier et les mots de passe. Ils ne simulent pas des connexions
concurrentes à une vraie instance Neon. Testez la connexion de votre projet,
l'hébergement HTTPS et le parcours complet dans votre navigateur après installation.
