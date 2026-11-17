# CarCare

Une seule application pour gérer vos véhicules, vos dépenses et vos entretiens. L’interface React et l’API Express utilisent **la même adresse et le même serveur**. Un seul `package.json`, un seul fichier `.env`, aucune base externe nécessaire pour démarrer.

## Démarrage

Prérequis : **Node.js 22.12 ou supérieur** (Node 24 conseillé).

```sh
npm install
npm run dev
```

Ouvrez **http://localhost:5000**, puis créez votre compte et votre premier véhicule. Sous PowerShell, utilisez `npm.cmd` si l’exécution des scripts `.ps1` est désactivée.

Les données sont enregistrées dans `data/carcare.sqlite`, les photos dans `uploads/`. Ces dossiers sont créés automatiquement. Sans `JWT_SECRET`, une clé de développement temporaire est créée : un redémarrage nécessite alors une nouvelle connexion.

Le serveur de développement écoute sur `127.0.0.1` par défaut. Définissez `HOST` explicitement pour autoriser un accès réseau. Vite ne sert pas les dossiers de données, le code serveur ni les fichiers de configuration sensibles.

## Configuration unique

Copiez `.env.example` vers `.env` pour personnaliser le port ou fixer une clé de session. Aucune configuration n’est obligatoire en développement.

| Variable | Utilité |
| --- | --- |
| `PORT` | Port HTTP, `5000` par défaut |
| `HOST` | Interface d’écoute HTTP : `127.0.0.1` en développement, `0.0.0.0` en production ; Docker conserve `0.0.0.0` |
| `JWT_SECRET` | Clé de signature des sessions ; obligatoire en production |
| `DATABASE_URL` | Facultatif : connexion PostgreSQL à la place de SQLite |
| `SQLITE_PATH` | Facultatif : emplacement du fichier SQLite ; `:memory:` pour une base temporaire sans fichier |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Identifiants à renseigner ensemble pour activer la connexion Google |
| `VITE_GOOGLE_AUTH_ENABLED=true` | Affiche le bouton Google ; nécessite les identifiants serveur et une reconstruction en production |
| `API_URL`, `FRONTEND_URL` | Origines publiques pour OAuth, sans chemin ; localement, l’adresse unique est déduite du port |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | Facultatif : configuration e-mail ; `SMTP_USER` nécessite `SMTP_HOST` et `SMTP_PASS` |
| `TRUST_PROXY` | Nombre de proxies de confiance entre `0` et `5`, `0` par défaut ; `1` derrière un seul reverse proxy HTTPS |

Avec Google, configurez la redirection autorisée vers `http://localhost:5000/api/auth/google/callback` en local, ou l’équivalent sur votre domaine.

## Production

```sh
npm ci
npm run build
npm prune --omit=dev --omit=optional
npm start
```

Définissez `JWT_SECRET` dans `.env` avant `npm start`. Express sert le dossier `dist/`, l’API et les photos sur **http://localhost:5000**. Aucun serveur frontend ou Nginx séparé n’est nécessaire. Conservez `data/` et `uploads/` lors des mises à jour et sauvegardez-les ensemble.

Docker utilise également un seul service :

```sh
docker compose up --build -d
```

La clé `JWT_SECRET` est obligatoire dans `.env`. Les volumes `data/` et `uploads/` conservent les données. Docker et les connexions PostgreSQL/Google réelles n’ont pas été validés dans cet environnement.

Sous Linux, créez ces deux dossiers avant le premier lancement et rendez-les accessibles en écriture à l’utilisateur du conteneur (UID `1000`). Le conteneur s’exécute sans privilèges root et ne modifie pas les permissions de vos données.

## Organisation

```text
src/                 Interface React
  components/        Navigation, formulaires et éléments partagés
  pages/             Tableau de bord, véhicules, dépenses, entretien, compte
  lib/               Dates, formatage, validation et calculs
server/              Serveur unique Express
  routes/            API et contrôle d’accès
  models/            Modèles Sequelize
  services/          Consommation, échéances, CSV et compteur
  __tests__/         Tests serveur
public/              Icônes et illustration automobile
tests/               Tests métier et parcours Playwright
scripts/             Lancement de production
docs/                Interface et bilan de l’audit
data/                Base locale persistante (non versionnée)
uploads/             Photos (non versionnées)
```

Vite est intégré au serveur Express en développement pour le rechargement automatique. En production, seul Express s’exécute. Les modules serveur restent isolés du code livré au navigateur.

## Vérification

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Si Chrome est déjà installé, aucun téléchargement de navigateur n’est nécessaire : sous PowerShell, exécutez `$env:PLAYWRIGHT_CHANNEL='chrome'` puis `npm run test:e2e`. Playwright lance son propre serveur sur `127.0.0.1:5174`, avec SQLite en mémoire, et utilise des réponses API isolées pour vérifier les interactions et les erreurs. `PLAYWRIGHT_PORT` permet de choisir un autre port ; un serveur déjà présent n’est jamais réutilisé. Les tests serveur utilisent également SQLite en mémoire.

Documentation API : **http://localhost:5000/api-docs**. État du serveur et de la base : **http://localhost:5000/health**.

La PWA installe l’interface et met en cache ses fichiers statiques. La consultation et l’écriture de données personnelles nécessitent une connexion au serveur ; les réponses API ne sont pas mises en cache.

## Dépendances et sécurité

```sh
npm run audit
npm run audit:production
```

Le premier audit couvre l’ensemble des dépendances. Le second correspond à l’installation de production ci-dessus et au Dockerfile, qui retirent les outils de développement et de compilation optionnels après le build. Les correctifs appliqués, les tests de compatibilité et l’alerte Picomatch restant sans version corrigée sont détaillés dans [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md).

## Depuis l’ancienne structure

Les deux applications `frontend/` et `backend/` ont été regroupées. Lancez désormais toutes les commandes à la racine. Les anciennes photos du dépôt sont conservées dans `uploads/`. Pour retrouver une base PostgreSQL existante, reportez son `DATABASE_URL` et votre `JWT_SECRET` dans le `.env` racine : aucun transfert automatique de PostgreSQL vers SQLite n’est effectué.
