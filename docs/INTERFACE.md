# Interface et validation navigateur

L’interface CarCare rassemble le tableau de bord, les dépenses, le carnet d’entretien, le comparateur et le compte dans une navigation commune. Elle prévoit les états de chargement, d’erreur et de garage vide, ainsi qu’une navigation adaptée au mobile.

## Principes

- Les indicateurs indisponibles restent identifiables lorsque l’API échoue.
- Les dépenses sont calculées sur l’historique complet, et la consommation utilise les intervalles entre pleins complets.
- Les modales se ferment avec Échap, contiennent la navigation au clavier et restaurent le focus.
- Une sauvegarde refusée conserve le formulaire et les données précédentes.
- Les requêtes API de chaque test sont simulées : les tests navigateur n’ont pas besoin de PostgreSQL ni de compte Google.
- L’horloge des scénarios est fixée au 17 novembre 2026 ; les intervalles, dates et totaux mensuels restent reproductibles.

## Tests Playwright

Depuis la racine du projet :

```sh
npm run test:e2e
```

Si Chromium Playwright n’est pas installé mais que Google Chrome est disponible, utiliser son canal :

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm.cmd run test:e2e
```

La configuration démarre une instance dédiée de l’application sur `http://127.0.0.1:5174`, avec SQLite en mémoire, les services Google désactivés et une clé de session de test. Elle ne réutilise pas un serveur de développement déjà lancé et ne charge pas ses données personnelles. Le port peut être choisi avec la variable `PLAYWRIGHT_PORT` s’il est déjà occupé. Le contrôle de démarrage utilise `/health` et deux navigateurs de test au maximum s’exécutent en parallèle.

Chaque scénario possède son contexte navigateur et ses données simulées. Les changements de session restent conservés pendant les rechargements du scénario : une session expirée n’est pas recréée par le simulateur. Les Service Workers sont bloqués pour que le cache PWA ne remplace pas les requêtes simulées. Toute exception JavaScript non interceptée fait échouer le scénario.

Les scénarios couvrent la protection des routes, la connexion et le retour à la destination demandée, le callback OAuth sous StrictMode, le garage vide, le tableau de bord et le menu au clavier sur mobile, le changement de véhicule, le compteur, les dépenses (création, filtrage, modification, suppression), les tâches d’entretien et les erreurs serveur. Ils vérifient aussi la création et la modification de véhicules avec photo multipart, la comparaison en présence de données manquantes, un ancien mot de passe refusé et les anciennes dates de contrôle technique. Une capture et une trace sont conservées dans `test-results/` en cas d’échec.

Ces tests valident les interactions dans un navigateur. Les tests serveur doivent être exécutés séparément pour vérifier les règles métier, les autorisations et la base de données.
