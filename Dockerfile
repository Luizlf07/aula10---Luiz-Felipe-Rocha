# Imagem base minimalista (Alpine) na mesma versão de Node usada no CI
FROM node:20-alpine

# Executa em modo produção
ENV NODE_ENV=production

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# 1) Copia SOMENTE os manifestos de dependência.
#    Enquanto package.json/package-lock.json não mudarem, o Docker reaproveita
#    o cache desta camada e da próxima (npm ci), acelerando os builds.
COPY package*.json ./

# 2) Instalação reprodutível (lockfile) e sem dependências de desenvolvimento
RUN npm ci --omit=dev && npm cache clean --force

# 3) Copia o código-fonte por último (é o que mais muda)
COPY --chown=node:node server.js ./

# Roda com usuário sem privilégios de root
USER node

# Expõe a porta que a aplicação vai usar
EXPOSE 8080

# Docker verifica sozinho se a API está saudável
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
