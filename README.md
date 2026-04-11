# Chá de Casa Nova

Lista de presentes online para chá de casa nova, com pagamentos via Mercado Pago (PIX e cartão), armazenamento de imagens no Cloudflare R2 e painel administrativo completo.

## Funcionalidades

**Vitrine pública**
- Lista de presentes com busca, paginação e ordenação
- Checkout com PIX ou cartão de crédito via Mercado Pago Checkout Pro
- Foto e história do casal configuráveis
- Música de fundo via YouTube (sem chave de API)
- Links de redes sociais no rodapé

**Painel administrativo** (`/admin`)
- Gerenciamento de itens (criar, editar, ativar/desativar)
- Dashboard com resumo de pagamentos
- Visualização de mensagens dos presenteadores
- Configurações completas via interface (sem editar `.env`)
  - Credenciais Cloudflare R2
  - Credenciais Mercado Pago
  - Personalização do site (nomes, data, história, foto, música)
  - Links de redes sociais

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend/Backend | Next.js 16 (App Router) |
| Banco de dados | PostgreSQL + Prisma ORM |
| Pagamentos | Mercado Pago Checkout Pro |
| Armazenamento de imagens | Cloudflare R2 (S3-compatible) |
| Autenticação | JWT via `jose` (httpOnly cookie) |
| Estilização | Tailwind CSS |
| Infraestrutura | Docker + Docker Compose |

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- Conta no [Mercado Pago](https://www.mercadopago.com.br/developers) (para pagamentos)
- Bucket no [Cloudflare R2](https://developers.cloudflare.com/r2/) (para imagens)

## Rodando localmente

**1. Clone o repositório**

```bash
git clone https://github.com/seu-usuario/cha-de-casa-nova.git
cd cha-de-casa-nova
```

**2. Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o `.env` — as únicas obrigatórias para subir são `DATABASE_URL` e `JWT_SECRET`. As demais podem ser configuradas depois pelo painel admin.

```env
# Banco de dados (gerado automaticamente pelo Docker Compose)
POSTGRES_DB=cha_casa_nova
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Segredo JWT — troque por uma string aleatória longa
JWT_SECRET=troque-por-algo-secreto

# URL pública da aplicação (usado pelo Mercado Pago para callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**3. Suba os containers**

```bash
docker compose up --build
```

O entrypoint cuida automaticamente de:
- Instalar dependências
- Gerar o Prisma Client
- Aguardar o banco ficar pronto
- Rodar as migrations (`prisma db push`)
- Criar o admin padrão (`admin` / `admin123`)

**4. Acesse**

| URL | Descrição |
|-----|-----------|
| http://localhost:3000 | Vitrine pública |
| http://localhost:3000/admin | Painel administrativo |

Login padrão: `admin` / `admin123` — **troque a senha após o primeiro acesso**.

## Produção

**1. Crie o arquivo de variáveis**

```bash
cp .env.example .env.prod
```

Preencha todas as variáveis, incluindo as credenciais do R2 e Mercado Pago, e um `JWT_SECRET` forte.

**2. Suba em produção**

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

O banco de dados não expõe porta externamente. Para usar um banco externo (ex: Supabase, Neon), basta apontar `DATABASE_URL` diretamente e remover o serviço `db` do compose.

**Reverse proxy (opcional)**

O `docker-compose.prod.yml` inclui um bloco comentado com Nginx. Para usar SSL com Let's Encrypt, descomente o serviço `nginx` e configure o `nginx.conf` apontando para `app:3000`.

## Configuração pelo painel admin

Todas as integrações podem ser configuradas em `/admin/settings` sem editar arquivos:

**Cloudflare R2** — armazenamento de imagens
1. Crie um bucket no painel da Cloudflare
2. Gere um API Token com permissão `Object Read & Write`
3. Preencha Account ID, Bucket Name, Access Key ID e Secret Access Key

> O bucket **não** precisa de acesso público. Imagens são servidas via URLs pré-assinadas (expiram em 1h).

**Mercado Pago** — pagamentos
1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Copie o Access Token e a Public Key de produção
3. Configure a URL de webhook: `https://seu-dominio.com/api/webhook/mercadopago`

> Em ambiente local (localhost), `auto_return` e `notification_url` são omitidos automaticamente.

## Estrutura do projeto

```
src/
├── app/
│   ├── admin/          # Painel administrativo (protegido por JWT)
│   │   ├── items/      # CRUD de itens
│   │   ├── payments/   # Listagem de pagamentos
│   │   ├── messages/   # Mensagens dos presenteadores
│   │   └── settings/   # Configurações gerais
│   ├── api/            # API Routes
│   │   ├── config/     # Leitura/escrita de SiteConfig
│   │   ├── image/      # Proxy de imagens R2 (presigned URL)
│   │   ├── items/      # CRUD de itens
│   │   ├── payments/   # Criação de preferências MP
│   │   ├── upload/     # Upload de imagens para R2
│   │   └── webhook/    # Webhook do Mercado Pago
│   ├── obrigado/       # Página de retorno pós-pagamento
│   └── page.tsx        # Vitrine pública
├── components/
│   ├── admin/          # Componentes do painel
│   ├── MusicPlayer.tsx # Player de YouTube (sem API key)
│   └── ...
├── lib/
│   ├── auth.ts         # JWT e sessão
│   ├── mercadopago.ts  # Integração Mercado Pago
│   ├── prisma.ts       # Cliente Prisma
│   └── r2.ts           # Cliente Cloudflare R2
prisma/
├── schema.prisma       # Modelos: Admin, Item, Payment, SiteConfig
└── seed.ts             # Admin padrão
```

## Banco de dados

Modelos principais:

- **Admin** — usuários do painel (formato `nome.sobrenome`)
- **Item** — presentes da lista (preços separados para PIX e cartão)
- **Payment** — registro de cada tentativa de pagamento com status
- **SiteConfig** — chave/valor para todas as configurações do site

## Licença

MIT — veja [LICENSE](LICENSE).
