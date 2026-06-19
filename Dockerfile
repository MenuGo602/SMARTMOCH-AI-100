# ── Build bosqichi ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite build-vaqtida env'ni ichiga "qotirib" qo'yadi — shu sabab build ARG sifatida beriladi
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Serve bosqichi ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Railway $PORT'ni dinamik beradi — shu sabab statik conf o'rniga template ishlatiladi.
# nginx image'ning rasmiy entrypointi konteyner ishga tushganda
# /etc/nginx/templates/*.template fayllarini envsubst orqali
# /etc/nginx/conf.d/*.conf ga avtomatik konvertatsiya qiladi.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
