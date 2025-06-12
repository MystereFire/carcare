# Utilise une image Node légère
FROM node:20-alpine

# Crée un dossier de travail dans le conteneur
WORKDIR /app

# Copie tous les fichiers du backend dans le conteneur
COPY . .

# Installe les dépendances
RUN npm install

# Expose le port (doit correspondre à ton .env : ex. 3000)
EXPOSE 3000

# Démarre le serveur (à adapter si tu utilises nodemon ou autre)
CMD ["node", "server.js"]
