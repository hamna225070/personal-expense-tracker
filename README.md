# Personal Expense Tracker (MERN)

## Requirements
- Node.js and npm
- A MongoDB Atlas database URI

## Setup

### 1. Backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and add your MongoDB Atlas URI:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/expense_tracker
```
Start the backend:
```bash
npm run dev
```

### 2. Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal, usually http://localhost:5173.

## API
- GET `/api/expenses` — list expenses
- POST `/api/expenses` — create expense
- PUT `/api/expenses/:id` — update expense
- DELETE `/api/expenses/:id` — delete expense
- GET `/api/health` — backend status

## GitHub submission
Commit and push both `frontend` and `backend`. Keep `.env` local and use `.env.example` as a template. Only publish dummy credentials if your exam explicitly requires a committed `.env`; never publish a real password or personal/production secret.
