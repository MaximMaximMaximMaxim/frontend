FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=https://api.ustyantsevmd.ru
ARG VITE_ASSISTANT_API_BASE_URL=/assistant-api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ASSISTANT_API_BASE_URL=${VITE_ASSISTANT_API_BASE_URL}

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
