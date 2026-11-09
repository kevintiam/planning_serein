# Structure du projet Planning Serein

Vue d'ensemble des dossiers et fichiers, du chemin suivi par une action,
et de l'endroit où travailler selon ce que l'on veut modifier.

## 1. L'arborescence

```
planning_serein/
├── .env                        ← tes vrais secrets (URL Neon) — jamais commité
├── .env.example                ← modèle des variables d'environnement
├── .gitignore
├── package.json                ← dépendances et commandes npm
├── next.config.mjs             ← config Next.js (en-têtes de sécurité)
├── prisma.config.ts            ← config de la CLI Prisma (lit .env)
├── prettier.config.mjs         ← règles de formatage
├── README.md
│
├── prisma/                     ── BASE DE DONNÉES
│   ├── schema.prisma           ← les tables : Team, User, Session, Declaration,
│   │                              Absence, Task, Schedule, RateLimit
│   └── migrations/
│       └── 20261108000000_init/migration.sql   ← le SQL qui crée les tables
│
├── src/
│   ├── app/                    ── PAGES ET ROUTES (Next.js App Router)
│   │   ├── layout.jsx          ← squelette HTML commun à toutes les pages
│   │   ├── globals.css         ← importe tous les styles de styles/
│   │   ├── page.jsx            ← /             accueil public
│   │   ├── connexion/page.jsx  ← /connexion
│   │   ├── inscription/page.jsx← /inscription
│   │   ├── espace/page.jsx     ← /espace       redirige vers /admin ou /participant
│   │   ├── admin/page.jsx      ← /admin        espace administrateur (protégé)
│   │   ├── participant/page.jsx← /participant  espace participant (protégé)
│   │   ├── error.jsx           ← page d'erreur
│   │   ├── not-found.jsx       ← page 404
│   │   │
│   │   ├── styles/             ── LE DESIGN
│   │   │   ├── tokens.css      ← couleurs, polices, variables (:root)
│   │   │   ├── controls.css    ← boutons, champs, messages, badges
│   │   │   ├── auth.css        ← accueil / connexion / inscription
│   │   │   ├── sidebar.css     ← barre latérale verte
│   │   │   ├── layout.css      ← en-tête, titres, indicateurs, panneau
│   │   │   ├── calendar.css    ← grilles du calendrier, cases, tâches
│   │   │   ├── panels.css      ← tableau d'équipe, fenêtres (dialogues)
│   │   │   └── responsive.css  ← adaptations mobile / tablette
│   │   │
│   │   └── api/                ── ROUTES API (côté serveur)
│   │       ├── auth/register/  ← POST  inscription
│   │       ├── auth/login/     ← POST  connexion
│   │       ├── auth/logout/    ← POST  déconnexion
│   │       ├── auth/me/        ← GET   utilisateur connecté
│   │       ├── planning/       ← GET   données d'un mois
│   │       ├── declarations/   ← PUT   enregistrer ses absences
│   │       ├── available/      ← GET   personnes libres sur un créneau (admin)
│   │       ├── tasks/          ← POST / DELETE  attribuer / retirer une tâche (admin)
│   │       ├── publish/        ← POST  publier le mois (admin)
│   │       └── invitation/     ← POST  nouveau code d'invitation (admin)
│   │
│   ├── components/             ── L'INTERFACE (affichage uniquement)
│   │   ├── Workspace.jsx       ← l'espace connecté : assemble tout le reste
│   │   ├── Sidebar.jsx         ← barre latérale (logo, onglets, profil)
│   │   ├── MonthBar.jsx        ← titre du mois + flèches ‹ ›
│   │   ├── PlanningCalendar.jsx    ← calendrier des tâches (admin et participant)
│   │   ├── AvailabilityCalendar.jsx← calendrier « je coche mes absences »
│   │   ├── TaskDialog.jsx      ← fenêtre « Attribuer une tâche »
│   │   ├── NobodyAvailable.jsx ← message « personne n'est disponible »
│   │   ├── ConfirmDialog.jsx   ← petite fenêtre de confirmation
│   │   ├── TeamTable.jsx       ← tableau « Mon équipe »
│   │   ├── AuthForm.jsx        ← formulaire connexion / inscription
│   │   ├── PlanningPreview.jsx ← colonne décorative de l'accueil
│   │   └── Feedback.jsx        ← messages d'erreur / de succès
│   │
│   ├── hooks/                  ── L'ÉTAT ET LES ACTIONS (logique côté navigateur)
│   │   ├── useWorkspace.js     ← assemble les autres hooks pour Workspace
│   │   ├── usePlanning.js      ← mois affiché, chargement, publier, retirer…
│   │   ├── useDeclaration.js   ← sélection des jours d'absence
│   │   ├── useTaskForm.js      ← formulaire de tâche + personnes libres
│   │   └── useAuthForm.js      ← envoi connexion / inscription
│   │
│   ├── api/                    ── APPELS RÉSEAU (navigateur → serveur)
│   │   ├── client.js           ← le SEUL fichier qui fait fetch()
│   │   ├── auth.js             ← authApi.login(), register()…
│   │   └── planning.js         ← planningApi.overview(), createTask()…
│   │
│   ├── server/                 ── LOGIQUE SERVEUR (jamais envoyée au navigateur)
│   │   ├── planning-service.js ← règles métier : disponibilités, tâches, publication
│   │   ├── planning-queries.js ← filtres Prisma partagés (qui est disponible ?)
│   │   ├── auth-service.js     ← inscription, connexion, sessions
│   │   ├── crypto.js           ← bcrypt, jetons aléatoires, empreintes
│   │   ├── http.js             ← enveloppe des routes : CSRF, cookies, erreurs
│   │   ├── page-access.js      ← protège les pages (/admin, /participant)
│   │   ├── rate-limit.js       ← limite les tentatives de connexion
│   │   ├── database.js         ← client Prisma (connexion à Neon)
│   │   └── errors.js           ← classe d'erreur affichable
│   │
│   └── domain/                 ── OUTILS PURS (utilisables partout)
│       ├── calendar.js         ← jours du mois, mois suivant, dispos par jour…
│       ├── validation.js       ← schémas Zod (formats acceptés)
│       └── format.js           ← initiales des avatars
│
├── scripts/                    ── COMMANDES OPÉRATEUR ET VÉRIFICATIONS
│   ├── create-admin.mjs        ← npm run admin:create
│   ├── reset-password.mjs      ← npm run password:reset
│   ├── environment.mjs         ← charge .env pour les scripts
│   ├── check-structure.mjs     ← npm run check (300 lignes, commentaires, couches)
│   ├── smoke-http.mjs          ← npm run test:http
│   └── test-prisma-migrations.mjs ← npm run test:migrations
│
├── tests/
│   ├── calendar.test.mjs       ← tests du calendrier, validation, mots de passe
│   └── integration.test.mjs    ← scénario complet sur une base PostgreSQL jetable
│
└── docs/                       ← API.md, ARCHITECTURE.md, INSTALLATION.md, STRUCTURE.md…
```

## 2. Le chemin d'une action

Exemple : l'admin attribue une tâche. Chaque couche n'appelle que celle juste en dessous.

```
 NAVIGATEUR                                         SERVEUR
┌──────────────────┐   ┌──────────────┐   ┌──────────────┐        ┌───────────────────┐   ┌────────────┐
│ components/      │ → │ hooks/       │ → │ api/         │ ─HTTP→ │ app/api/tasks/    │ → │ server/    │ → Prisma → Neon
│ TaskDialog.jsx   │   │ useTaskForm  │   │ planning.js  │        │ route.js          │   │ planning-  │
│ (affiche)        │   │ (état)       │   │ client.js    │        │ (vérifie session, │   │ service.js │
│                  │   │              │   │ (fetch)      │        │  valide les       │   │ (règles)   │
└──────────────────┘   └──────────────┘   └──────────────┘        │  données)         │   └────────────┘
                                                                  └───────────────────┘
```

## 3. Où travailler selon ce que tu veux changer

| Je veux changer… | Fichier(s) |
|---|---|
| Les couleurs, les polices | `src/app/styles/tokens.css` |
| L'apparence d'un bouton ou d'un champ | `src/app/styles/controls.css` |
| L'apparence du calendrier | `src/app/styles/calendar.css` + `PlanningCalendar.jsx` / `AvailabilityCalendar.jsx` |
| Un texte affiché dans l'espace connecté | `src/components/Workspace.jsx` (titres, boutons) |
| La page d'accueil | `src/app/page.jsx` + `PlanningPreview.jsx` |
| Le formulaire de connexion ou d'inscription | `src/components/AuthForm.jsx` |
| La fenêtre « Attribuer une tâche » | `TaskDialog.jsx` (affichage) + `useTaskForm.js` (comportement) |
| Une règle métier (qui est disponible ? quand publier ?) | `src/server/planning-service.js` et `planning-queries.js` |
| Les formats acceptés (longueur du mot de passe, dates…) | `src/domain/validation.js` |
| Une nouvelle table ou colonne | `prisma/schema.prisma`, puis `npm run db:dev -- --name nom` |
| Une nouvelle route API | un dossier dans `src/app/api/` + une fonction dans `src/api/` + un service dans `src/server/` |

## 4. Les règles du projet (vérifiées par `npm run check`)

1. **300 lignes maximum** par fichier.
2. **Au moins un commentaire** par fichier.
3. Les **composants `.jsx` n'appellent jamais le réseau** : ils passent par un hook.
4. Les **hooks n'utilisent pas `fetch`** : seul `src/api/client.js` le fait.

## 5. Les commandes du quotidien

| Commande | Quand |
|---|---|
| `npm run dev` | Pour travailler (http://localhost:3000) |
| `npm test` | Après une modification de la logique |
| `npm run check` | Avant de commiter |
| `npm run build` | Pour vérifier que tout compile |
| `npm run format` | Pour réaligner l'indentation |
