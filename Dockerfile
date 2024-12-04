# Builder stage
FROM node:22 AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN ls -la /app

# App stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]