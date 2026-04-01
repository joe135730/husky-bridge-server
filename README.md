# Husky Bridge Backend

Husky Bridge Frontend: https://github.com/joe135730/husky-bridge

A robust backend service built with Express.js and TypeScript, providing RESTful APIs for the Husky Bridge application.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: Session Based Auth
- **Session Management**: Express Session
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Code Quality**: ESLint, TypeScript ESLint

## 📦 Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn package manager
- MongoDB (local or cloud instance)
- Environment variables setup

## 🛠️ Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd husky-bridge/backend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
```

## 🏃‍♂️ Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The server will be available at `http://localhost:3000` (or the port specified in your .env file).

## 🏗️ Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm start
# or
yarn start
```

## 🔍 Code Quality

Run linting:

```bash
npm run lint
# or
yarn lint
```

Run tests:

```bash
npm test
# or
yarn test
```

## 🎯 Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── tests/              # Test files
├── .env.example        # Example environment variables
├── package.json        # Project dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## 🔐 Security Features

- Session-based authentication
- Session management with express-session
- CORS configuration
- Rate limiting
- Input validation
- Secure password hashing
- Environment variable protection

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 📚 API Documentation

API documentation is available at `/api-docs` when the server is running.
