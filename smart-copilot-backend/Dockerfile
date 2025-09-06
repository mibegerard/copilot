# Utilise l'image officielle Node.js 18 sur Alpine Linux (léger et rapide)
FROM node:18-alpine

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie les fichiers de dépendances pour installer les packages
COPY package.json yarn.lock ./

# Installe les dépendances avec Yarn
RUN yarn install

# Copie tous les fichiers du projet dans le conteneur
COPY . .

# Expose le port 5000 pour que l'application soit accessible
EXPOSE 5000

# Commande pour démarrer l'application Node.js
CMD ["node", "server.js"]
