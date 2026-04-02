# Stage 2: Serve with Nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy the built React app from the previous stage
COPY dist/ .

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80