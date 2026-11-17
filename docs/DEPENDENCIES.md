# Dépendances et sécurité

Revue du 17 novembre 2026. Les versions effectivement installées sont verrouillées dans `package-lock.json`. Les correctifs publiés sont appliqués sans rétrograder Vite ni réécrire l’interface pour modifier artificiellement le résultat d’un audit.

## Mises à jour directes

| Dépendance | Version de référence | Choix et compatibilité |
| --- | --- | --- |
| Nodemailer | `10.6.0` | Remplace la branche 9. Les appels CommonJS `createTransport` et `sendMail` restent utilisés ; un test compose un message UTF-8 sans connexion SMTP. [Publication officielle](https://github.com/nodemailer/nodemailer/releases/tag/v10.6.0). |
| React Router DOM | `7.18.5` | Remplace la branche 6 et embarque les correctifs de la branche 7.18. Le mode déclaratif `BrowserRouter` reste compatible avec React 18 et le chargement des pages au niveau du module. [Guide officiel de migration](https://reactrouter.com/7.18.5/upgrading/v6), [publication](https://github.com/remix-run/react-router/releases/tag/react-router@7.18.5). |
| Jest | `30.5.2` | Remplace Jest 29 pour actualiser la chaîne de tests et ses dépendances. Les tests serveur CommonJS et leur configuration explicite sont conservés. [Publication officielle](https://github.com/jestjs/jest/releases/tag/v30.5.2). |
| Vite | `8.3.8` | Conserve la branche 8 et ses correctifs récents, notamment celui de l’exécution de code via certains modules virtuels du serveur de développement, corrigée à partir de 8.3.7. [Avis de sécurité officiel](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7), [publications](https://github.com/vitejs/vite/releases). |

Les autres outils restent cohérents avec cette chaîne : `@vitejs/plugin-react` 6, `vite-plugin-pwa` 1.3 et Tailwind CSS 3. Le Service Worker conserve l’exclusion des routes API, des fichiers téléversés et de l’état de santé du serveur.

## Remplacements transitifs ciblés

Les règles `overrides` s’appliquent depuis le manifeste racine. Leur portée est limitée pour éviter de remplacer une ancienne API par une API incompatible dans tout le graphe. [Documentation npm sur les overrides](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides).

| Portée | Version imposée | Motif |
| --- | --- | --- |
| `sequelize` → `uuid` | `11.1.1` | Correctif de sécurité rétroporté sur une version qui conserve CommonJS. UUID 12 supprime ce format ; la branche 11 conserve l’interface `require` attendue par Sequelize 6 sans dépendre d’une interopérabilité ESM récente. Les UUID v1/v4 et les identifiants de transaction sont vérifiés par un test dédié. [Correctif 11.1.1](https://github.com/uuidjs/uuid/releases/tag/v11.1.1), [changement CommonJS en 12](https://github.com/uuidjs/uuid/releases/tag/v12.0.0). |
| `glob@>=9.0.0 <=14.0.1` | `14.0.6` | Actualise les branches utilisant l’API moderne de Glob, notamment dans Workbox et la chaîne Jest. L’API `globSync` utilisée par Workbox est conservée. La règle ne force pas Glob 7 ou 8 vers une API majeure différente. [Publication officielle](https://github.com/isaacs/node-glob/releases/tag/v14.0.6). |
| `test-exclude` → `minimatch` | `11.0.9` | Remplace la branche 10 concernée par des avis de déni de service. `test-exclude` 7 utilise déjà l’export nommé `minimatch`, disponible dans la branche 11 ; aucun remplacement global des anciennes interfaces n’est effectué. [Avis officiel](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249), [publication 11.0.9](https://github.com/isaacs/minimatch/releases/tag/v11.0.9). |

Après modification des overrides, vérifier une installation neuve avec `npm ci`. Une installation incrémentale peut laisser un arbre physique différent de celui attendu ; `npm ls` et les tests complètent la lecture du fichier de verrouillage.

## Alerte amont restante : Picomatch

L’avis officiel [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), actualisé le 17 novembre 2026, concerne les versions jusqu’à `4.0.7` incluse et n’indique **aucune version corrigée publiée**. Il décrit un déni de service lors de l’évaluation de certains motifs extglob répétés contrôlés par un attaquant.

Après installation neuve, l’audit complet remonte **51 alertes élevées**, toutes issues de ce même avis Picomatch et de sa propagation aux paquets qui l’utilisent. Les correctifs publiés ont supprimé les autres avis : il ne reste aucune alerte critique, modérée ou faible. Les propositions de correctif [237](https://github.com/micromatch/picomatch/pull/237) et [246](https://github.com/micromatch/picomatch/pull/246) restent ouvertes à cette date. Elles ne sont pas présentées comme une publication corrigée et aucun numéro de version fictif n’est utilisé.

La présence d’une version signalée et son exploitation dans CarCare sont deux questions distinctes. Les motifs utilisés ici pour Tailwind, Workbox et les outils sont définis dans le dépôt ; aucune route métier n’accepte de motif glob provenant d’un formulaire ou d’un import CSV. Cela limite l’exposition au scénario décrit sans corriger la bibliothèque amont. Une migration cosmétique de Tailwind ou un remplacement forcé de Picomatch 2 par 4 ne résoudrait pas cette alerte.

Le développement est également durci : `npm run dev` écoute sur `127.0.0.1` par défaut, respecte un `HOST` explicitement fourni et interdit à Vite de servir les fichiers serveur, données et caches sensibles. Les règles sensibles par défaut de Vite sont conservées. Ces protections complètent les mises à jour ; elles ne changent pas le statut de l’avis Picomatch.

## Construction et dépendances de production

La construction installe d’abord les outils nécessaires, compile l’interface, puis retire les dépendances de développement et les dépendances optionnelles du runtime :

```sh
npm ci
npm run build
npm prune --omit=dev --omit=optional
```

Le Dockerfile suit cette séquence. Les modules natifs sont installés ou compilés pendant la première étape ; les outils optionnels de compilation tels que `node-gyp` ne sont pas conservés pour leur seul rôle de construction. Le module SQLite et son binding natif déjà installé restent nécessaires à l’exécution. [Documentation npm prune](https://docs.npmjs.com/cli/v12/commands/npm-prune/).

Les commandes d’audit utilisent les mêmes périmètres que les installations correspondantes :

```sh
npm run audit
npm run audit:production
```

La première examine le graphe complet et reste en échec tant que l’avis Picomatch n’est pas corrigé. La seconde exécute `npm audit --omit=dev --omit=optional` pour le périmètre de production décrit ci-dessus : **zéro alerte** lors de cette vérification. Une installation neuve isolée de ces 252 paquets a confirmé l’absence physique de Vite, Jest, Node-gyp, Picomatch et Glob, ainsi que le fonctionnement de SQLite natif, des transactions UUID et de la composition e-mail. Ce résultat ne décrit pas le graphe complet ; les nombres peuvent évoluer avec la base d’avis de sécurité.

## Scripts d’installation autorisés

Le manifeste définit une politique `allowScripts` pour les versions compatibles de npm :

| Identité | Décision |
| --- | --- |
| `sqlite3@6.0.1` | Script autorisé pour installer ou compiler le binding natif requis. |
| `@parcel/watcher@2.6.0` | Script autorisé pour le composant natif de surveillance utilisé par les outils. |
| `@scarf/scarf` | Script explicitement refusé. |

Les autorisations natives sont liées à ces versions précises. Elles ne donnent pas une autorisation générale à tous les scripts du graphe ni aux versions futures de ces paquets. Cette politique doit être interprétée par une version de npm qui prend en charge `allowScripts` ; elle ne remplace pas la vérification des dépendances ou de leurs mises à jour. [Documentation npm allowScripts](https://docs.npmjs.com/cli/v12/configuring-npm/package-json/#allowscripts).
