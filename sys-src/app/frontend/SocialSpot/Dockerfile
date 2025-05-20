ARG NODE_VERSION=22.12.0
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.

COPY package*.json .

RUN npm install

# Run the application as a non-root user.

# Copy the rest of the source files into the image.
COPY .. .

# Expose the port that the application listens on.
EXPOSE 8080

# Run the application.
CMD npm run dev -- --host 0.0.0.0