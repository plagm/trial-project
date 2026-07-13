# InvoiceLoop
> Recurring invoices with dunning and payment tracking for freelancers.

![Hero screenshot](docs/screenshots/hero.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) **Live demo → https://your-app.com**

## Features
- Create, manage, and send professional invoices to clients.
- Track client details and organize billing information.
- Dynamic invoice line items with auto-calculated totals.
- Dashboard with outstanding balances and recent payments.
- Secure authentication with HTTP-only cookies and Argon2 hashing.
- Export invoices to PDF.

## Tech Stack
React · Node.js · Express · MongoDB (Mongoose) · Tailwind CSS · shadcn/ui

## Quick Start
```bash
git clone https://github.com/you/invoiceloop && cd invoiceloop

# 1. Setup Backend
cd backend
cp .env.example .env # fill in your MONGO_URI and JWT_SECRET
npm install
npm run dev # http://localhost:5000

# 2. Setup Frontend (in a new terminal)
cd ../frontend
cp .env.example .env # fill in VITE_API_URL=http://localhost:5000/api
npm install
npm run dev # http://localhost:5173
```

## Environment Variables
### Backend
| Variable | Description |
| --- | --- |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret key for signing JWTs |
| PORT | Port for the backend server (default 5000) |
| NODE_ENV | Environment mode (development/production) |

### Frontend
| Variable | Description |
| --- | --- |
| VITE_API_URL | The base URL for the backend API |

## Architecture
See our [Architecture Documentation](docs/architecture.md) for details on the data model and security.

## License
MIT — see LICENSE.

### Demo credentials
Read-only demo login: `demo@demo.com` / `demo1234`
