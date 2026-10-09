# FreshCart

FreshCart is a Next.js 16 e-commerce application using Auth.js v5 for
authentication and the RouteMisr e-commerce API for products and account
operations.

## Requirements

- Node.js compatible with Next.js 16
- npm
- A reachable RouteMisr API for live product, account, cart, and order features

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file from the template:

```powershell
Copy-Item .env.example .env.local
```

Generate an Auth.js secret locally with Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copy the generated value into `AUTH_SECRET` in `.env.local`. Keep `.env.local`
private and do not commit it.

`AUTH_TRUST_HOST` is only needed when the deployment environment is not
automatically trusted by Auth.js. For a self-hosted deployment, set it to
`true` only when requests arrive through a correctly configured, trusted host
or reverse proxy. Do not trust arbitrary forwarded host headers.

## Run

Start the development server:

```bash
npm run dev
```

Open <http://localhost:3000>.

Create and run the production build:

```bash
npm run build
npm run start
```

Run lint and TypeScript checks:

```bash
npm run lint
npx tsc --noEmit
```
