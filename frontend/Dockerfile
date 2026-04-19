FROM nginx:alpine

# Xóa trang mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy toàn bộ file tĩnh từ thư mục public vào Nginx
COPY ./public /usr/share/nginx/html

# Mở cổng 80
EXPOSE 80
FROM nginx:alpine

# Xóa trang mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy toàn bộ file tĩnh từ thư mục public vào Nginx
COPY ./public /usr/share/nginx/html

# Mở cổng 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

CMD ["nginx", "-g", "daemon off;"]
