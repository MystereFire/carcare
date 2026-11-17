# Audit et remise en état de CarCare

Audit réalisé le 17 novembre 2026 sur le dépôt local. L’application conserve ses fonctions de garage, dépenses, carburant et entretien, dans un projet unique : interface dans `src/`, logique serveur dans `server/`, installation et démarrage depuis la racine.

## Problèmes corrigés

- **Isolation des comptes et saisies serveur.** Les opérations sur les véhicules, dépenses, entretiens et fichiers CSV contrôlent le propriétaire. Les identifiants, nombres, dates, booléens et paramètres de pagination sont validés. Les fichiers image sont limités en type et en taille. Les imports CSV sont validés avant leur enregistrement et les champs contenant des séparateurs ou retours à la ligne sont traités.
- **Authentification.** La connexion conserve les erreurs de saisie à l’écran. Une erreur d’ancien mot de passe ne provoque plus une déconnexion. Le retour Google est idempotent avec React StrictMode. Les requêtes vers les routes publiques de connexion ne suppriment pas la session à tort. Une réponse tardive refusant un ancien jeton ne supprime pas une session créée entre-temps.
- **Historique et calculs.** Des imports de `formatNumber` manquants faisaient planter les listes contenant du kilométrage. Les listes complètes servent désormais aux totaux. Les nombres renvoyés sous forme de chaînes sont convertis avant addition. La consommation utilise les segments entre pleins complets et une moyenne pondérée par la distance ; les segments suspects sont exclus des indicateurs concernés. Une mesure absente reste indisponible au lieu de devenir un faux zéro avantageux dans le comparateur.
- **Entretien.** Les échéances sont recalculées depuis les dates et le compteur. Le contrôle technique utilise sa prochaine date renseignée. Sa création n’envoie plus une modification vers un identifiant inexistant. Les anciennes dates enregistrées sur le véhicule restent visibles dans le carnet ; leur modification crée une tâche de contrôle technique préremplie. Les jours restants sont calculés en jours calendaires. Une panne de chargement n’affiche plus « Tout est à jour ».
- **Formulaires et navigation.** Les formulaires véhicules partagent les mêmes validations. Le kilométrage zéro est conservé. Les images ont un aperçu dont l’URL temporaire est libérée. Les soumissions en cours désactivent les envois supplémentaires. Les erreurs sont affichées et les choix de véhicule n’appliquent plus une réponse de comparaison devenue obsolète. Changer de véhicule ferme les dialogues ouverts du tableau de bord.
- **Interface et accessibilité.** Navigation, tableau de bord, connexion et inscription ont été retravaillés. Les champs ont des libellés associés. Les dialogues maintiennent le focus, se ferment avec Échap et rendent le focus à leur déclencheur. Ils sont rendus dans le corps de la page, indépendamment des animations et de la barre latérale. Leur contenu défile dans la hauteur disponible sur mobile.
- **Simplification.** Le comparateur et le tableau de bord utilisent Recharts. Chaque indicateur du comparateur possède sa propre échelle et son unité. Les anciens composants graphiques et composants d’interface sans utilisation ont été retirés après vérification des imports, ce qui permet de supprimer le second moteur de graphiques et ses dépendances.

## Vérification

Les vérifications reproductibles sont disponibles à la racine :

```sh
npm test
npm run build
npm run test:e2e
```

Les tests serveur couvrent les routes et les régressions métier ; les tests de logique vérifient notamment les nombres, dates, calculs pondérés et données manquantes. Les parcours navigateur utilisent une API simulée pour vérifier les écrans, formulaires et erreurs sans dépendre des données personnelles. Une vérification navigateur et une vérification d’intégration serveur répondent à des objectifs complémentaires.

## Limites de vérification

Résultat final après correction des dépendances : **66 tests serveur, 7 tests métier et 31 tests navigateur réussis**. La compilation de production est également passée. Un essai dans Chrome avec le véritable serveur de production, sans réponses API simulées, a vérifié l’inscription, la connexion, la création de véhicule, l’ajout d’une dépense, le tableau de bord, le rechargement d’une page et l’affichage mobile. Les serveurs et bases temporaires de ces essais ont été arrêtés et nettoyés.

La configuration valide les ports, les origines publiques, le proxy et les paramètres Google/SMTP. Le lancement de développement impose son mode et les tests navigateur utilisent un serveur dédié avec SQLite en mémoire. Les anciens projets, caches et captures temporaires ont été supprimés ; la base locale et les photos sont conservées hors du suivi Git.

Les correctifs de dépendances publiés sont appliqués. Une installation de production isolée, sans dépendances de développement ou optionnelles, contient 252 paquets et remonte zéro alerte npm ; SQLite natif, les UUID et transactions Sequelize, le chargement du pilote PostgreSQL et la composition e-mail y ont été vérifiés. L’audit complet reste à 51 alertes élevées liées au seul avis Picomatch sans correctif publié. Les périmètres, versions et limites sont détaillés dans [DEPENDENCIES.md](DEPENDENCIES.md).

- La connexion réelle à Google n’a pas été validée avec un compte et des identifiants OAuth configurés. Le parcours de retour et ses erreurs sont testables localement.
- La base PostgreSQL de production n’a pas été connectée pour cet audit. Les tests automatisés utilisent une base SQLite isolée ; une exécution sur l’instance PostgreSQL cible reste nécessaire avant exploitation de ses données.
- Les essais navigateur simulant l’API ne prouvent pas l’accès aux services externes. Les envois SMTP et les rappels réels nécessitent leur configuration.
- Le contrôle technique conserve la date choisie par l’utilisateur. Aucune périodicité réglementaire universelle n’est déduite automatiquement.
