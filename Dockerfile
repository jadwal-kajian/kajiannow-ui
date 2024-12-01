# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Add environment variable for the API key
ENV REACT_APP_MAP_API_KEY=AIzaSyDNqZZ2_C4JV42XokmXkPFME6eZRUjcZuU

# Copy the rest of the application code
COPY . .

# Ensure the environment variable is available during the build
RUN npm run build

# Use an official Nginx image to serve the built application
FROM nginx:alpine

# Copy the built application from the previous stage
COPY --from=0 /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]