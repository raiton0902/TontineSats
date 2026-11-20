FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN mkdir -p /data
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=file:/data/tontinesats.db

EXPOSE 3001
VOLUME ["/data"]

CMD ["npm", "run", "start"]
