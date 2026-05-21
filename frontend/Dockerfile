# Stage 1: Build da aplicação React
FROM node:24-alpine AS build

WORKDIR /app

# Copia arquivos de configuração e instala as dependências
COPY package*.json ./
RUN npm install

# Copia todo o código fonte e compila o bundle de produção
COPY . .
RUN npm run build

# Stage 2: Servidor Nginx de Alta Performance para servir os arquivos estáticos
FROM nginx:stable-alpine

# Copia os arquivos de build do estágio 1 para o diretório padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80 (padrão HTTP)
EXPOSE 80

# Inicia o Nginx em primeiro plano (foreground)
CMD ["nginx", "-g", "daemon off;"]
