package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"booktracking/db"
	"booktracking/handlers"

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

	mux := http.NewServeMux()

	// Auth routes
	mux.HandleFunc("/register", handlers.RegisterHandler(store))
	mux.HandleFunc("/login", handlers.LoginHandler(store))
	mux.HandleFunc("/logout", handlers.LogoutHandler())
	mux.HandleFunc("/me", handlers.AuthMiddleware(handlers.MeHandler(store)))

	// Protected routes
	mux.HandleFunc("/books", handlers.AuthMiddleware(handlers.BooksHandler(store)))
	mux.HandleFunc("/books/", handlers.AuthMiddleware(handlers.BookHandler(store)))

	fmt.Println("Server running at http://localhost:8080")
	handler := handlers.WithCORS(mux)
	log.Fatal(http.ListenAndServe(":8080", handler))
}