# CarCare Manager

Application PWA multi-véhicules avec authentification utilisateur.

## Configuration

Copiez les fichiers `.env.example` dans les dossiers `backend` et `frontend` puis
renommez-les en `.env` pour définir vos variables d'environnement.

### Variables nécessaires

#### Backend

```env
MONGO_URI=mongodb://localhost:27017/carcare
JWT_SECRET=your_jwt_secret
# PORT=5000 # optionnel
```

#### Frontend

```env
VITE_API_URL=http://localhost:5000
```

## 🔧 Backend

```bash
cd backend
npm install
node server.js
```

## 💻 Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🐳 Docker Compose

Assurez-vous que les fichiers `.env` existent dans `backend` et `frontend`, puis
lancez l'application avec :

```bash
docker-compose up --build
```

## 🧪 Tests

Pour exécuter les tests du backend :

```bash
cd backend
npm test
```
