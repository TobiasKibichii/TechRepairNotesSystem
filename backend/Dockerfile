# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app/techrepairnotes

ENV NODE_ENV production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/app/techrepairnotes/.npm \
    npm set cache /app/techrepairnotes/.npm && \
    npm ci --only=production

USER node

# Copy rest of the code
COPY --chown=node:node . .

# Expose backend port
EXPOSE 3500

# Start server
CMD ["node", "server.js"]