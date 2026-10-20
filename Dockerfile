# Dev server for local runs (the workspace docker compose). It proxies the API prefixes to
# VITE_API_PROXY_TARGET (the IQ backend container), as `npm run dev` does locally.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
