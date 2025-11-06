FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/nginx.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create log directory
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log && \
    touch /var/log/nginx/error.log

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
