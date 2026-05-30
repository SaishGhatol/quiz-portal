# Quiz Portal

An enterprise-ready quiz platform for tuition centres, schools, and training organisations. Built with the MERN stack — create quizzes, manage student batches, assign tests with deadlines, track performance, and issue certificates.

---

## What it does

### For Students
- Browse and take quizzes with a timed interface
- See your score, correct/wrong answers, and explanation for each question
- Earn a downloadable certificate when you pass
- Track your progress with a score trend chart and category breakdown
- Join your organisation via a 6-character invite code
- See quizzes assigned to you by your teacher (with due dates and attempt limits)

### For Organisation Admins (Tuition / School / Corporate)
- Create your organisation and get a shareable invite code
- Create **batches** (classes) and enrol students
- Build quizzes with a question editor or bulk-import via JSON
- **Assign quizzes** to specific batches with start date, due date, and max attempts
- Post **announcements** to all students or a specific batch
- Monitor performance in the **analytics dashboard** — per-batch avg scores, recent activity

### For Platform Admins
- Manage all quizzes, questions, and users across the platform
- View platform-wide stats: total users, attempts, quizzes
- Promote/demote user roles

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Vite |
| Styling | Tailwind CSS 4 (light/dark mode) |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose 8 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Real-time | Socket.IO |
| Security | Helmet, express-rate-limit, express-mongo-sanitize |

---

## Getting Started

### Prerequisites
- Node.js v18+ (tested on v25)
- MongoDB — local or [MongoDB Atlas](https://www.mongodb.com/atlas)
- npm

### 1 — Clone
```bash
git clone https://github.com/SaishGhatol/quiz-portal.git
cd quiz-portal
```

### 2 — Server setup
```bash
cd server
npm install

# Create your environment file
cp .env.example .env
```

Edit `server/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
PORT=3002
JWT_SECRET=a-long-random-secret-string
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev        # starts on http://localhost:3002
```

### 3 — Client setup
```bash
cd ../client
npm install

cp .env.example .env
```

`client/.env` (default values work if server is on 3002):
```
VITE_API_URL=http://localhost:3002/api
```

```bash
npm run dev        # starts on http://localhost:5173
```

---

## Usage Guide

### Student flow
```
Register → Dashboard → Browse quizzes or check My Classes
→ Take quiz → Results + certificate (if passed)
→ Progress page (score trend, categories)
```

### Organisation Admin flow
```
Register → /org/setup (create org) → copy invite code
→ Share code with students (they go to /org/join)
→ /org/batches → create batches (e.g. "Class 10 Physics")
→ /admin/quizzes → create quiz → add questions
→ /org/assignments → assign quiz to batch with due date
→ /org/analytics → monitor scores and completion rates
```

### Making someone a Platform Admin
In your database, set a user's `role` field to `"admin"`.  
Or call `PUT /api/users/:id/role` with `{ "role": "admin" }` using a platform admin token.

---

## Project Structure

```
quiz-portal/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/       # Quiz/user management pages
│   │   │   ├── auth/        # Login, Register, Route guards
│   │   │   ├── dashboard/   # Student dashboard
│   │   │   ├── layout/      # Navbar, Footer
│   │   │   ├── org/         # Organisation management pages
│   │   │   ├── profile/     # Profile, Attempts, Progress
│   │   │   ├── quiz/        # Quiz list, detail, take, results
│   │   │   └── student/     # My Classes (assigned quizzes)
│   │   ├── contexts/        # AuthContext, ThemeContext, OrgContext
│   │   └── utils/api.js     # Axios instance
│   └── .env.example
│
└── server/                  # Express backend
    ├── controllers/         # Business logic
    ├── models/              # Mongoose schemas
    ├── routes/              # Express routers
    ├── middleware/          # Auth, error handling
    └── .env.example
```

---

## API Overview

| Prefix | Description |
|--------|-------------|
| `POST /api/auth/register` | Register a new user |
| `POST /api/auth/login` | Login, returns JWT |
| `GET  /api/auth/me` | Get current user (includes orgId, batchIds) |
| `GET  /api/quizzes` | List all quizzes (public, filterable) |
| `POST /api/quizzes/:id/submit` | Submit quiz answers |
| `GET  /api/quizzes/leaderboard` | Top scores across platform |
| `POST /api/org/setup` | Create an organisation |
| `POST /api/org/join` | Join org via invite code |
| `GET  /api/org/me` | Get my org + stats |
| `POST /api/org/batches` | Create a batch |
| `POST /api/org/assignments` | Assign quiz to batch |
| `GET  /api/org/my-assignments` | My assigned quizzes (student) |
| `GET  /api/org/analytics` | Org performance analytics |
| `POST /api/admin/quizzes/create` | Create quiz (admin/org_admin) |
| `POST /api/admin/quizzes/:id/duplicate` | Duplicate quiz |

---

## Environment Variables

### server/.env
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | Server port (default 3002) |
| `JWT_SECRET` | Secret for signing tokens |
| `CLIENT_URL` | Allowed CORS origin |

### client/.env
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## Pricing Tiers (built-in)

| Plan | Students | Batches | Quizzes |
|------|----------|---------|---------|
| Free | 25 | 3 | 10 |
| Basic | 150 | 10 | Unlimited |
| Pro | 500 | Unlimited | Unlimited |
| Enterprise | Unlimited | Unlimited | Unlimited |

---

## License

ISC License — see [License](License) file.

## Contact

Saish Ghatol · [saishghatol100@gmail.com](mailto:saishghatol100@gmail.com)
