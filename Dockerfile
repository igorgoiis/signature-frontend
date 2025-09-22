# --- STAGE 1: Base para Instalação de Dependências ---
# Usamos uma imagem Node.js para instalar as dependências.
FROM node:20-alpine AS base

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração de dependências
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Instala as dependências.
# Usamos 'npm ci' para builds consistentes se você tiver package-lock.json
# Ou 'yarn install --frozen-lockfile' se usar yarn.
# Ou 'pnpm install --frozen-lockfile' se usar pnpm.
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  else npm ci; \
  fi

# --- STAGE 2: Build da Aplicação Next.js ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copia as dependências instaladas do estágio 'base'
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Copia o restante do código-fonte da aplicação
COPY . .

# REMOVA A LINHA ABAIXO, JÁ QUE NÃO USA PRISMA:
# RUN npx prisma generate

# Garante que o modo standalone está habilitado no next.config.js
RUN npm run build

# --- STAGE 3: Imagem Final de Produção (Runner) ---
# Usamos uma imagem base leve para o runtime.
# Node.js 20-alpine é uma boa escolha, mas você pode usar 'gcr.io/distroless/nodejs20-debian11'
# ou 'node:20-slim' para uma imagem ainda menor se não precisar de ferramentas de shell.
FROM node:20-alpine AS runner

# Define o diretório de trabalho para a aplicação standalone
WORKDIR /app

# Define o usuário não-root para segurança
# ID 1001 é um ID de usuário comum em imagens Alpine
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copia o diretório standalone gerado pelo estágio 'builder'
# Este diretório contém tudo o que é necessário para executar a aplicação.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copia os arquivos estáticos (public)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copia os assets estáticos gerados pelo build (ex: imagens otimizadas, fontes)
# Estes são necessários para o Next.js servir corretamente.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Exponha a porta em que a aplicação Next.js será executada
# Por padrão, Next.js usa a porta 3000.
EXPOSE 3441

# Define variáveis de ambiente para o Next.js
# NEXT_SHARP_PATH é importante para otimização de imagem em Alpine
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
ENV PORT=3441

# Comando para iniciar a aplicação Next.js em modo de produção
# O arquivo server.js é o ponto de entrada gerado pelo modo standalone.
CMD ["node", "server.js"]
