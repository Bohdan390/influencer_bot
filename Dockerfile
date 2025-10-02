FROM node:18-alpine AS builder
WORKDIR /app
COPY . .

# Set environment variable for build process
ENV VITE_API_BASE_URL=https://influencer-bot-hzuxy.ondigitalocean.app/

RUN npm install
RUN cd frontend && npm install && npm run build

FROM node:18-alpine AS final

# --- START ---
# Install certificates for HTTPS requests (Cheerio + Axios)
RUN apk add --no-cache ca-certificates
# --- END ---

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json .

EXPOSE 8080
CMD ["npm", "start"]
