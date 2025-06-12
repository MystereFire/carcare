FROM node:20-alpine AS build
WORKDIR /app
COPY . .

# Récupère VITE_API_URL depuis docker-compose args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm install
RUN npm run build --mode production

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
