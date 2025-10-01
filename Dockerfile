FROM node:18-alpine AS builder
WORKDIR /app
COPY . .

# Set environment variable for build process
ENV VITE_API_BASE_URL=https://dermao-influencer-connect-xxxxx.ondigitalocean.app

RUN npm install
RUN cd frontend && npm install && npm run build

FROM node:18-alpine AS final

# --- START ---
# Install Chromium and certificates for Puppeteer
RUN apk add --no-cache chromium ca-certificates
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# --- END ---

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json .

EXPOSE 8080
CMD ["npm", "start"]
