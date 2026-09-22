# Support Ticket Management System

A full-stack, modern Support Ticket Management System built as part of a technical assessment.

## Overview
This application provides a simple support portal where:
- **Customers** can register, raise support tickets, view their own tickets, and reply to agent comments.
- **Support Agents** can view all tickets across the system, assign tickets to themselves, update ticket statuses, and respond to customers.

## Technologies Used
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Axios, React Router, Context API
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JSON Web Tokens (JWT), bcryptjs
- **Database**: MySQL

## Repository Structure
```
/
├── frontend/      # React application
├── backend/       # Node.js Express API
└── README.md
```

## Running Locally

### Prerequisites
- Node.js (v18+)
- MySQL (running locally or via Docker)

### 1. Database Setup
Ensure you have a MySQL database running.
1. Navigate to `/backend`
2. Create a `.env` file based on `.env.example`
3. Set your `DATABASE_URL` (e.g., `mysql://user:password@localhost:3306/support_ticket_system`)
4. Set your `JWT_SECRET` (e.g., `my_super_secret_key`)

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
The backend server will start on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`

## Testing
To run the automated tests for the backend API:
```bash
cd backend
npm test
```

*(Note: API test coverage includes authentication flow, authorization rules, and ticket CRUD operations).*
