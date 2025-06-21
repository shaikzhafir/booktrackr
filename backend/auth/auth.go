package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/oauth2"
	googleOAuth2 "golang.org/x/oauth2/google"
)

const (
	SessionCookieName = "session_id"
	SessionDuration   = 24 * time.Hour
)

func GetOAuthConfig() (*oauth2.Config, error) {
	clientID, ok := os.LookupEnv("GOOGLE_CLIENT_ID")
	if !ok {
		return nil, errors.New("GOOGLE_CLIENT_ID not set")
	}
	clientSecret, ok := os.LookupEnv("GOOGLE_CLIENT_SECRET")
	if !ok {
		return nil, errors.New("GOOGLE_CLIENT_SECRET not set")
	}
	oauth2Config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "http://localhost:8080/google/callback",
		Endpoint:     googleOAuth2.Endpoint,
		Scopes:       []string{"profile", "email"},
	}
	return oauth2Config, nil
}

// HashPassword creates a secure hash of a password
func HashPassword(password string) string {
	// Add a static salt to make it more secure
	salt := "booktrackr_static_salt"
	// Combine password with salt
	saltedPassword := password + salt
	// Hash the salted password
	hash := sha256.Sum256([]byte(saltedPassword))
	// Return as a hex string
	return hex.EncodeToString(hash[:])
}

// VerifyPassword checks if a password matches the hash
func VerifyPassword(password string, hashedPassword string) bool {
	// Hash the password with the same method
	passwordHash := HashPassword(password)
	// Use constant time comparison to prevent timing attacks
	return subtle.ConstantTimeCompare([]byte(passwordHash), []byte(hashedPassword)) == 1
}

// GenerateSessionID creates a random session ID
func GenerateSessionID() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// GetSessionIDFromRequest extracts the session ID from the request
func GetSessionIDFromRequest(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		// Check if it's a Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			return parts[1], nil
		}
	}
	return "", errors.New("session ID not found in request")
}

func GetSessionIDFromCookie(r *http.Request) (string, error) {
	cookie, err := r.Cookie(SessionCookieName)
	if err != nil {
		return "", err
	}
	if cookie.Value == "" {
		return "", errors.New("session ID cookie is empty")
	}
	return cookie.Value, nil
}

// SetSessionCookie adds a session cookie to the response
func SetSessionCookie(w http.ResponseWriter, sessionID string) {
	expires := time.Now().Add(SessionDuration)
	cookie := &http.Cookie{
		Name:     SessionCookieName,
		Value:    sessionID,
		Path:     "/",
		Expires:  expires,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode, // Allow cross-site requests for development
		Secure:   false,                // Set to true in production with HTTPS
	}
	http.SetCookie(w, cookie)
}

// ClearSessionCookie removes the session cookie
func ClearSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode, // Allow cross-site requests for development
		Secure:   false,                // Set to true in production with HTTPS
	}
	http.SetCookie(w, cookie)
}
