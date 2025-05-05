package handlers

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"booktracking/auth"

	_ "github.com/mattn/go-sqlite3"
)

// Context key for user ID
type contextKey string

const UserIDKey contextKey = "userID"

// GetUserID retrieves the user ID from context
func GetUserID(ctx context.Context) int64 {
	userID := ctx.Value(UserIDKey)
	log.Printf("User ID from context: %v", userID)
	value, err := strconv.ParseInt(userID.(string), 10, 64)
	if err != nil {
		// Handle error
		log.Printf("Error parsing user ID: %v", err)
		return 0
	}
	return value
}

// AuthMiddleware protects routes requiring authentication
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Skip authentication for OPTIONS requests
		if r.Method == http.MethodOptions {
			next(w, r)
			return
		}

		userID, err := auth.GetSessionIDFromRequest(r)
		if err != nil {
			WriteJSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		log.Printf("User ID from session: %d", userID)
		// Add user ID to context
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}
