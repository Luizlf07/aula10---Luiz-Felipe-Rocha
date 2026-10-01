# Usa a imagem oficial do Node.js
FROM node:18-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta que a aplicação vai usar
EXPOSE 8080

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
