FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/client/browser /tmp/browser
RUN rm -rf /usr/share/nginx/html/* && cp -r /tmp/browser/* /usr/share/nginx/html/ && date > /usr/share/nginx/html/date.txt
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]