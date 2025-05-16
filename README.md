# Quiz Portal

A full-stack interactive quiz application built with React and Node.js that allows users to take quizzes, track their progress, and administrators to manage quizzes, questions, and users.

## Features

### User Features
- User authentication (register, login)
- Browse available quizzes
- Take quizzes and receive instant feedback
- View quiz results and performance statistics
- Track quiz attempt history
- User profile management

### Admin Features
- Comprehensive admin dashboard
- Create, edit and delete quizzes
- Manage quiz questions and answers
- User management
- View quiz statistics and analytics
- Real-time monitoring of quiz attempts

### Technical Features
- JWT authentication
- RESTful API architecture
- Responsive design with Tailwind CSS
- MongoDB database integration

## Tech Stack

### Frontend
- React 19
- React Router v7
- TailwindCSS
- React-Chartjs-2 (for statistics visualization)
- React-Toastify (for notifications)
- Axios (for API requests)

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- Express Validator
- Various security middleware (Helmet, XSS-Clean, etc.)

## Installation and Setup

### Prerequisites
- Node.js (v16 or later recommended)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Backend Setup
1. Clone the repository
```bash
git clone <repository-url>
cd quiz-portal
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quiz-portal
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

4. Start the server
```bash
npm run dev
```

### Frontend Setup
1. Open a new terminal and navigate to the client directory
```bash
cd client
npm install
```

2. Create a `.env` file in the client directory with:
```
VITE_API_URL=http://localhost:5000/api
```

3. Start the client
```bash
npm run dev
```

4. Access the application at `http://localhost:5173`

## Deployment

### Backend Deployment
1. Set up a MongoDB Atlas cluster
2. Deploy to a service like Render 
3. Set the appropriate environment variables

### Frontend Deployment
1. Build the React app for production
```bash
cd client
npm run build
```
2. Deploy the built files to a static hosting service on Vercel

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the ISC License.

## Contact
For any inquiries, please contact [saishghatol100@gmail.com].
