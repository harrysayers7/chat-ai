FROM node:18-alpine

WORKDIR /app

# Copy source code first
COPY . .

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Set memory limit for Node.js
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=512"

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Start in development mode
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]