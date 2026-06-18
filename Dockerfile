# Single service: builds the front-end and serves it + the PDF API from one
# Node/Express process. Uses the system Chromium (no puppeteer download).
FROM node:20-slim

# Chromium + the fonts/libraries it needs to render the deck.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      fonts-noto-color-emoji \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tell puppeteer to use the system Chromium and skip its own download.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install deps (incl. dev — needed for the Vite build). NODE_ENV is set to
# production only afterwards so the build still has its dev tooling.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
# Render/most hosts inject PORT; the server already honours process.env.PORT.
EXPOSE 3001
CMD ["node", "server/index.mjs"]
