# ---- Build frontend ----
FROM node:22-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Runtime ----
FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3002
WORKDIR /app
COPY backend/package*.json backend/
RUN npm ci --omit=dev --prefix backend
COPY backend/ backend/
COPY tmf_packages/ tmf_packages/
# Read-only reference catalog (CCB/PPM tables) used by catalogReference and mapperRules
COPY reference_data/2_reference_db/ reference_data/2_reference_db/
COPY --from=frontend /app/frontend/dist frontend/dist
COPY deploy/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3002
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "backend/server.js"]
