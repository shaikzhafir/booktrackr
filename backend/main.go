package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"booktrackr/db"
	"booktrackr/handlers"

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
	mux.HandleFunc("GET /books", handlers.AuthMiddleware(bh.ListExternalBooks()))

	// Protected routes
	mux.HandleFunc("/books", handlers.AuthMiddleware(handlers.BooksHandler(store)))
	mux.HandleFunc("POST /user/books", handlers.AuthMiddleware(bh.CreateUserBook()))
	mux.HandleFunc("GET /user/books", handlers.AuthMiddleware(bh.ListUserBooks()))
	mux.HandleFunc("GET /user/books/{id}", handlers.AuthMiddleware(bh.GetBookByUserID()))
	mux.HandleFunc("PUT /user/books/{id}", handlers.AuthMiddleware(bh.UpdateUserBook()))

	fmt.Println("Server running at http://localhost:8080")
	handler := handlers.WithCORS(mux)
	log.Fatal(http.ListenAndServe(":8080", handler))
}
