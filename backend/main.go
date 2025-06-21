package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"booktrackr/auth"
	"booktrackr/db"
	"booktrackr/handlers"

	"github.com/dghubble/gologin/v2"
	"github.com/dghubble/gologin/v2/google"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	conn, err := sql.Open("sqlite3", "books.db")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	// Read schema file and execute it
	schema, err := os.ReadFile("schema.sql")
	if err != nil {
		log.Fatalf("failed to read schema.sql: %v", err)
	}

	if _, err := conn.Exec(string(schema)); err != nil {
		log.Fatalf("failed to create schema: %v", err)
	}

	store := db.New(conn)
	bh := handlers.NewBookHandler(store)

	mux := http.NewServeMux()

	// Auth routes
	mux.HandleFunc("/register", handlers.RegisterHandler(store))
	mux.HandleFunc("/login", handlers.LoginHandler(store))
	mux.HandleFunc("/logout", handlers.LogoutHandler())
	mux.HandleFunc("/me", handlers.AuthMiddleware(handlers.MeHandler(store)))
	mux.HandleFunc("/verifysession", handlers.VerifySessionHandler(store))

	// Google OAuth routes
	googleOAuthConfig, err := auth.GetOAuthConfig()
	if err != nil {
		log.Fatalf("failed to get OAuth config: %v", err)
	}
	stateConfig := gologin.DebugOnlyCookieConfig
	mux.Handle("/google/login", google.StateHandler(stateConfig, google.LoginHandler(googleOAuthConfig, gologin.DefaultFailureHandler)))
	mux.Handle("/google/callback", google.StateHandler(stateConfig, google.CallbackHandler(googleOAuthConfig, handlers.IssueSession(store), gologin.DefaultFailureHandler)))
	// mux.HandleFunc("GET /books", handlers.AuthMiddleware(bh.ListExternalBooks()))

	// Protected routes
	//mux.HandleFunc("/books", handlers.AuthMiddleware(handlers.BooksHandler(store)))
	mux.HandleFunc("POST /user/books", handlers.AuthMiddleware(bh.CreateUserBook()))
	mux.HandleFunc("GET /user/books", handlers.AuthMiddleware(bh.ListUserBooks()))
	mux.HandleFunc("GET /user/books/{id}", handlers.AuthMiddleware(bh.GetBookByUserID()))
	mux.HandleFunc("PUT /user/books/{id}", handlers.AuthMiddleware(bh.UpdateUserBook()))

	fmt.Println("Server running at http://localhost:8080")
	handler := handlers.WithCORS(mux)

	// frontend based
	mux.HandleFunc("/", spaHandler("../frontend/dist"))
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func spaHandler(distPath string) http.HandlerFunc {
	fileServer := http.FileServer(http.Dir(distPath))

	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Set cache headers for assets
		if strings.HasPrefix(path, "/assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000")
		}

		if _, err := os.Stat(filepath.Join(distPath, path)); err == nil {
			fileServer.ServeHTTP(w, r)
			return
		}

		if strings.HasPrefix(path, "/assets/") {
			http.NotFound(w, r)
			return
		}

		http.ServeFile(w, r, filepath.Join(distPath, "index.html"))
	}
}
