# InvoiceLoop Architecture

## Data Model
InvoiceLoop is built on MongoDB using Mongoose. Here is the core schema:

- **User**: The freelancer/agency owner.
  - `_id`, `email`, `passwordHash`, `name`, `businessName`, `createdAt`, `updatedAt`
- **Client**: Customers of the freelancer.
  - `_id`, `userId` (ref: User), `name`, `email`, `address`, `createdAt`, `updatedAt`
- **Invoice**: A bill sent to a client.
  - `_id`, `userId` (ref: User), `clientId` (ref: Client), `status` (Draft, Sent, Paid, Overdue)
  - `issueDate`, `dueDate`, `currency`, `notes`
  - `lineItems`: Array of `{ description, quantity, rate, amount }`
  - `subtotal`, `taxRate`, `taxAmount`, `totalAmount`, `amountPaid`
  - `createdAt`, `updatedAt`
- **Payment**: Records of payments made against invoices.
  - `_id`, `invoiceId` (ref: Invoice), `amount`, `date`, `method`, `createdAt`, `updatedAt`

## Authentication & Authorization
Authentication is handled via JWT (JSON Web Tokens). 
- Upon successful login, the server issues an HTTP-only, secure cookie containing the JWT.
- The JWT payload contains the `userId`.
- Every protected API route uses middleware to verify the JWT from the cookie.
- Row-level authorization is enforced: the middleware ensures the `userId` in the JWT matches the `userId` of the requested resource (e.g., you can only read/update your own Clients and Invoices).
- Passwords are encrypted at rest using Argon2id hashing.

## Application Architecture
- **Frontend**: A React SPA (Single Page Application) created with Vite. Uses Tailwind CSS for styling and shadcn/ui for accessible components. Communicates with the backend via REST API.
- **Backend**: A Node.js server using Express. Serves the REST API endpoints.
- **Database**: MongoDB hosted on MongoDB Atlas.
