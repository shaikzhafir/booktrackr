# Book Tracker

This project is a simple book tracking application. It consists of a backend API built with Go and a frontend interface built with React.

## Backend

The backend is located in the `backend` directory. It is a Go application that provides an API for managing books and user authentication.

### Structure

*   `auth`: Contains authentication-related code.
*   `db`: Contains database connection logic.
*   `handlers`: Contains the HTTP handler functions for the API endpoints.
*   `main.go`: The main entry point of the application.
*   `queries`: Contains SQL queries used by the application.
*   `schema.sql`: Defines the database schema.
*   `sqlc.yaml`: Configuration file for sqlc.

### Running the Backend

1.  Navigate to the `backend` directory: `cd backend`
2.  Run the application: `go run main.go`

## Frontend

The frontend is located in the `frontend` directory. It is a React application that provides a user interface for interacting with the backend API.

### Structure

*   `public`: Contains static assets.
*   `src`: Contains the React components and application logic.
*   `index.html`: The main HTML file.
*   `package.json`: Contains the project dependencies and scripts.
*   `vite.config.js`: Configuration file for Vite.

### Running the Frontend

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`