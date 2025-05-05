# Makefile to manage backend and frontend services

.PHONY: generate install backend frontend start

# Generate Go DB code via sqlc
generate:
	cd backend && sqlc generate

# Install frontend dependencies
install:
	cd frontend && npm install

# Run backend server (requires generated code)
backend: generate
	cd backend && go run main.go

# Run frontend dev server (requires dependencies)
frontend: install
	cd frontend && npm run dev

# Start both backend and frontend
# Backend runs in background; frontend runs in foreground
start: generate install
	echo "Starting backend..."
	cd backend && go run main.go & \
	sleep 1; \
	echo "Starting frontend..."
	cd frontend && npm run dev