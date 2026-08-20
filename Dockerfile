# Builder stage
FROM node:22 AS builder
WORKDIR /app

# Vite inlines VITE_* at BUILD time, so these must be build args — passing them
# as container env does nothing, the bundle is already compiled. Without
# VITE_BASE_URL the app requests "undefined/..." and every fetch fails.
ARG VITE_BASE_URL
ARG VITE_VAPID_PUBLIC_KEY
ENV VITE_BASE_URL=$VITE_BASE_URL \
    VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

COPY . .
RUN npm install
# Fail loudly at build time rather than shipping a bundle that can't reach the API.
RUN test -n "$VITE_BASE_URL" || (echo "ERROR: VITE_BASE_URL build-arg is required" && exit 1)
RUN npm run build
RUN ls -la /app

# App stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# SPA routing for both apps: "/" (classic) and "/new/" (redesign preview).
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]