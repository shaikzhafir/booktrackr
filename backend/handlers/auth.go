package handlers

import (
	log "booktrackr/logging"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"booktrackr/auth"
	"booktrackr/db"

	"github.com/dghubble/gologin/v2/google"
)

// RegisterHandler handles user registration
func RegisterHandler(store *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		log.Info("Registering user")
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteJSONError(w, err.Error(), http.StatusBadRequest)
			return
		}

		fmt.Printf("Registering user: %s\n", req.Username)

		// Validate input
		if req.Username == "" || req.Password == "" {
			WriteJSONError(w, "Username and password are required", http.StatusBadRequest)
			return
		}

		// Hash the password
		hashedPassword := auth.HashPassword(req.Password)

		// Create new user
		ctx := context.Background()
		err := store.CreateUser(ctx, db.CreateUserParams{
			Username:     req.Username,
			PasswordHash: hashedPassword,
		})

		if err != nil {
			WriteJSONError(w, "Username already exists", http.StatusConflict)
			return
		}

		// Find user by username
		user, err := store.GetUserByUsername(ctx, req.Username)
		if err != nil {
			WriteJSONError(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}

		// Return success
		WriteJSON(w, http.StatusCreated, JSONResponse{
			Message: "User registered successfully",
			Data: map[string]interface{}{
				"id":       user.ID,
				"username": user.Username,
			},
		})
	}
}

// LoginHandler handles user login
func LoginHandler(store *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteJSONError(w, err.Error(), http.StatusBadRequest)
			return
		}
		ctx := r.Context()
		// Find user by username
		user, err := store.GetUserByUsername(ctx, req.Username)
		if err != nil {
			WriteJSONError(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}

		// Verify password
		if !auth.VerifyPassword(req.Password, user.PasswordHash) {
			WriteJSONError(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}

		// Generate session
		// TODO right now this isnt used at all by FE lol, will add when it matters
		sessionID, err := auth.GenerateSessionID()
		if err != nil {
			WriteJSONError(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		// Store session
		expiresAt := time.Now().Add(auth.SessionDuration)
		err = store.CreateSession(ctx, db.CreateSessionParams{
			ID:        sessionID,
			UserID:    user.ID,
			ExpiresAt: expiresAt,
		})

		if err != nil {
			WriteJSONError(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		// Set cookie
		auth.SetSessionCookie(w, sessionID)

		// Return success
		WriteJSON(w, http.StatusOK, JSONResponse{
			Message: "Login successful",
			Data: map[string]interface{}{
				"id":         user.ID,
				"username":   user.Username,
				"session_id": sessionID,
			},
		})
	}
}

// LogoutHandler handles user logout
func LogoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		// Get session ID
		sessionID, err := auth.GetSessionIDFromRequest(r)
		if err == nil && sessionID != "" {
			// Delete session from database
			ctx := context.Background()

			// Create new DB connection
			conn, err := sql.Open("sqlite3", "books.db")
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			defer conn.Close()
			store := db.New(conn)

			store.DeleteSession(ctx, sessionID)
		}

		// Clear session cookie
		auth.ClearSessionCookie(w)

		// Return success
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Logout successful"})
	}
}

// MeHandler handles getting current user information
func MeHandler(store *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// For OPTIONS requests, we've already handled this in the authMiddleware
		if r.Method == http.MethodOptions {
			return
		}

		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		ctx := context.Background()
		userID := GetUserID(r.Context())
		log.Info("User ID: %d", userID)
		// Get user info from database
		user, err := store.GetUserByID(ctx, userID)
		if err != nil {
			http.Error(w, "Failed to get user info", http.StatusInternalServerError)
			return
		}

		// Return user info without password hash
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":       user.ID,
			"username": user.Username,
		})
	}
}

func IssueSession(store *db.Queries) http.Handler {
	fn := func(w http.ResponseWriter, req *http.Request) {
		ctx := req.Context()
		googleUser, err := google.UserFromContext(ctx)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// check if user already exists
		user, err := store.GetUserByUsername(ctx, googleUser.Id)
		if err != nil && err != sql.ErrNoRows {
			WriteJSONError(w, "Failed to get user", http.StatusInternalServerError)
			return
		}
		if err == sql.ErrNoRows {
			// User does not exist, create a new user
			err = store.CreateUser(ctx, db.CreateUserParams{
				Username:     googleUser.Id,
				PasswordHash: "", // No password for OAuth users
			})
			if err != nil {
				log.Error("Failed to create user: %v", err)
				WriteJSONError(w, "Failed to create user", http.StatusInternalServerError)
				return
			}
			// Fetch the newly created user
			user, err = store.GetUserByUsername(ctx, googleUser.Id)
			if err != nil {
				WriteJSONError(w, "Failed to get user after creation", http.StatusInternalServerError)
				return
			}
		}
		// extract data from googleUser and persist in session db
		sessionID, err := auth.GenerateSessionID()
		if err != nil {
			WriteJSONError(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		// Store session
		expiresAt := time.Now().Add(auth.SessionDuration)
		err = store.CreateSession(ctx, db.CreateSessionParams{
			ID:        sessionID,
			UserID:    user.ID,
			ExpiresAt: expiresAt,
		})

		if err != nil {
			WriteJSONError(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "session_id",
			Value:    sessionID,
			HttpOnly: true,
			Secure:   true, // for HTTPS
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
			MaxAge:   3600 * 24, // 24 hours
		})

		// add session cookie in w
		auth.SetSessionCookie(w, sessionID)
		http.Redirect(w, req, "http://localhost:3000/socialredirect", http.StatusFound)
	}
	return http.HandlerFunc(fn)
}

func VerifySessionHandler(store *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		log.Info("Verifying session")
		ctx := req.Context()
		sessionID, err := auth.GetSessionIDFromCookie(req)
		if err != nil || sessionID == "" {
			log.Error("Failed to get session ID from request: %v", err)
			WriteJSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		session, err := store.GetSessionByID(ctx, sessionID)
		if err != nil {
			WriteJSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if session.ExpiresAt.Before(time.Now()) {
			WriteJSONError(w, "Session expired", http.StatusUnauthorized)
			return
		}
		// get user by session
		user, err := store.GetUserByID(ctx, session.UserID)
		if err != nil {
			WriteJSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		// If everything is valid, return user info
		WriteJSON(w, http.StatusOK, JSONResponse{
			Message: "Session is valid",
			Data: map[string]interface{}{
				"id":         user.ID,
				"username":   user.Username,
				"session_id": sessionID,
			},
		})
	}
}
