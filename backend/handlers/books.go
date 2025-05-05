package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"booktracking/db"
)

type UserBook struct {
	ID          int    `json:"id"`
	Isbn        string `json:"isbn"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Author      string `json:"author"`
	ImageURL    string `json:"image_url"`
	Progress    int    `json:"progress"`
	StartDate   string `json:"start_date"`
	FinishDate  string `json:"finish_date"`
	Rating      int    `json:"rating"`
}

// BooksHandler handles listing and creating books
func BooksHandler(store *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// For OPTIONS requests, we've already handled this in the authMiddleware
		if r.Method == http.MethodOptions {
			return
		}

		ctx := context.Background()
		userID := GetUserID(r.Context())
		log.Printf("User ID: %d", userID)
		switch r.Method {
		case http.MethodGet:
			books, err := store.ListBooksByUser(ctx, userID)
			if err != nil {
				log.Printf("Error retrieving books: %v", err)
				WriteJSONError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			log.Printf("Books retrieved: %v", books)
			// convert to a better book format
			var userBooks []UserBook
			for _, book := range books {
				userBooks = append(userBooks, UserBook{
					ID:          int(book.ID),
					Isbn:        book.Isbn,
					Title:       book.Title,
					Description: book.Description,
					Author:      book.Author,
					ImageURL:    book.ImageUrl,
					Progress:    int(book.Progress.Int64),
					StartDate:   book.StartDate.Time.String(),
					FinishDate:  book.FinishDate.Time.String(),
					Rating:      int(book.Rating.Int64),
				})
			}

			WriteJSON(w, http.StatusOK, JSONResponse{
				Message: "Books retrieved successfully",
				Data:    userBooks,
			})
		case http.MethodPost:
			var req struct {
				Isbn        string `json:"isbn"`
				Title       string `json:"title"`
				Description string `json:"description"`
				Author      string `json:"author"`
				ImageURL    string `json:"image_url"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				WriteJSONError(w, err.Error(), http.StatusBadRequest)
				return
			}
			bookID, err := store.CreateBook(ctx, db.CreateBookParams{
				Isbn:        req.Isbn,
				Title:       req.Title,
				Description: req.Description,
				Author:      req.Author,
				ImageUrl:    req.ImageURL,
			})
			if err != nil {
				WriteJSONError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			err = store.CreateUserBook(ctx, db.CreateUserBookParams{
				UserID: userID,
				BookID: bookID,
			})
			if err != nil {
				WriteJSONError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			WriteJSON(w, http.StatusCreated, JSONResponse{
				Message: "Book created successfully",
				Data: map[string]interface{}{
					"id":          bookID,
					"isbn":        req.Isbn,
					"title":       req.Title,
					"description": req.Description,
					"author":      req.Author,
					"image_url":   req.ImageURL,
				},
			})
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}
}

// BookHandler handles getting, updating and deleting a specific book
func BookHandler(store *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// For OPTIONS requests, we've already handled this in the authMiddleware
		if r.Method == http.MethodOptions {
			return
		}

		ctx := context.Background()
		userID := GetUserID(r.Context())

		idStr := r.URL.Path[len("/books/"):]
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			http.Error(w, "invalid book id", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodGet:
			book, err := store.GetUserBook(ctx, db.GetUserBookParams{
				UserID: userID,
				BookID: id,
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(book)
		case http.MethodPut:
			var req struct {
				Isbn        string `json:"isbn"`
				Title       string `json:"title"`
				Description string `json:"description"`
				Author      string `json:"author"`
				ImageURL    string `json:"image_url"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			err := store.UpdateBook(ctx, db.UpdateBookParams{
				ID:          id,
				Isbn:        req.Isbn,
				Title:       req.Title,
				Description: req.Description,
				Author:      req.Author,
				ImageUrl:    req.ImageURL,
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			book, err := store.GetBook(ctx, id)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(book)
		case http.MethodDelete:
			err := store.DeleteBook(ctx, id)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusNoContent)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}
}
