#!/bin/bash
# ─── Script de deploy de produção ─────────────────────────────────────
# Uso: ./deploy.sh [--build]
#
# Pré-requisito: .env.prod existindo com todas as variáveis.

set -euo pipefail

ENV_FILE=".env.prod"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌  Arquivo $ENV_FILE não encontrado."
  echo "    Copie .env.prod.example para .env.prod e preencha os valores."
  exit 1
fi

if [[ "${1:-}" == "--build" ]]; then
  echo "🔨 Buildando imagem de produção..."
  $COMPOSE build --no-cache app
fi

echo "🚀 Subindo containers em produção..."
$COMPOSE up -d

echo "⏳ Aguardando o banco ficar pronto..."
$COMPOSE exec db sh -c 'until pg_isready -U $POSTGRES_USER; do sleep 1; done'

echo "✅ Tudo pronto!"
echo "   App rodando em: $(grep NEXT_PUBLIC_APP_URL $ENV_FILE | cut -d= -f2)"
echo ""
echo "Logs: docker compose -f docker-compose.prod.yml logs -f app"
