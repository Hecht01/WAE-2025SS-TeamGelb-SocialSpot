ARG NODE_VERSION=22.12.0

# Build stage
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# env vars as build arg
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

RUN npm install --omit=dev

USER node

CMD ["node", "build/index.js"]

EXPOSE 3000