package handlers

import (
	log "booktrackr/logging"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"booktrackr/db"

	gBooks "google.golang.org/api/books/v1"

	"booktrackr/pkg/books"
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
	Review      string `json:"review"`
}

type BookHandler interface {
	ListBooksByUser(ctx context.Context, userID int64) ([]db.Book, error)
	CreateBook(ctx context.Context, params db.CreateBookParams) (int64, error)
	CreateUserBook() http.HandlerFunc
	GetUserBook(ctx context.Context, params db.GetUserBookParams) (db.UserBook, error)
	UpdateBook(ctx context.Context, params db.UpdateBookParams) error
	DeleteBook(ctx context.Context, id int64) error
	GetBook(ctx context.Context, id int64) (db.Book, error)
	ListExternalBooks() http.HandlerFunc
	ListUserBooks() http.HandlerFunc
	GetBookByUserID() http.HandlerFunc
	UpdateUserBook() http.HandlerFunc
}

type bookHandler struct {
	store *db.Queries
	svc   books.BookService
}

// UpdateUserBook implements BookHandler.
func (b *bookHandler) UpdateUserBook() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// extract userID from context
		userID := GetUserID(r.Context())
		ctx := r.Context()
		var req struct {
			ID         string `json:"id"`
			StartDate  string `json:"start_date"`
			Progress   int    `json:"progress"`
			FinishDate string `json:"finish_date"`
			Rating     int    `json:"rating"`
			Review     string `json:"review"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteJSONError(w, err.Error(), http.StatusBadRequest)
			return
		}
		bookID, err := strconv.ParseInt(req.ID, 10, 64)
		if err != nil {
			WriteJSONError(w, "Invalid book ID", http.StatusBadRequest)
			return
		}

		var finishDate sql.NullTime
		var progress sql.NullInt64
		var rating sql.NullInt64
		var review sql.NullString
		if req.Progress != 0 {
			// Check if the progress is between 0 and 100
			if req.Progress < 0 || req.Progress > 100 {
				WriteJSONError(w, "Progress must be between 0 and 100", http.StatusBadRequest)
				return
			}
			// convert to sql.NullInt64
			progress = sql.NullInt64{Int64: int64(req.Progress), Valid: true}
		} else {
			progress = sql.NullInt64{Int64: 0, Valid: false}
		}

		if req.Rating != 0 {
			// Check if the rating is between 1 and 5
			if req.Rating < 1 || req.Rating > 5 {
				WriteJSONError(w, "Rating must be between 1 and 5", http.StatusBadRequest)
				return
			}
			// convert to sql.NullInt64
			rating = sql.NullInt64{Int64: int64(req.Rating), Valid: true}
		} else {
			rating = sql.NullInt64{Int64: 0, Valid: false}
		}

		if req.Review != "" {
			review = sql.NullString{String: req.Review, Valid: true}
		} else {
			review = sql.NullString{String: "", Valid: false}
		}

		if req.FinishDate != "" {
			// convert string to time.Time
			parseDate, err := time.Parse(time.RFC3339, req.FinishDate)
			if err != nil {
				log.Error("Error parsing finish date: %v", err)
			}
			finishDate = sql.NullTime{Time: parseDate, Valid: true}
		}

		err = b.store.UpdateUserBook(ctx, db.UpdateUserBookParams{
			UserID:     userID,
			BookID:     bookID,
			Progress:   progress,
			FinishDate: finishDate,
			Rating:     rating,
			Review:     review,
		})
		if err != nil {
			WriteJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		WriteJSON(w, http.StatusOK, JSONResponse{
			Message: "Book updated successfully",
			Data:    nil,
		})
		log.Info("Book updated successfully")
	}
}

// ListBookByUserID implements BookHandler.
func (b *bookHandler) GetBookByUserID() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// extract userID from context
		userID := GetUserID(r.Context())
		ctx := r.Context()
		// Remove trailing slash if any
		path := strings.TrimSuffix(r.URL.Path, "/")

		// Split the path
		parts := strings.Split(path, "/")
		// first is the leading slash
		// for eg /user/books/1234
		// Check if we have enough parts and the correct path
		if len(parts) != 4 || parts[2] != "books" {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}

		bookIDStr := parts[3]

		if bookIDStr == "" {
			WriteJSONError(w, "Book ID is required", http.StatusBadRequest)
			return
		}
		bookID, err := strconv.ParseInt(bookIDStr, 10, 64)
		if err != nil {
			log.Error("Error parsing book ID: %v", err)
			WriteJSONError(w, "Invalid Book ID", http.StatusBadRequest)
			return
		}
		book, err := b.store.GetUserBook(ctx, db.GetUserBookParams{
			UserID: userID,
			BookID: bookID,
		})
		if err != nil {
			WriteJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		log.Info("Book retrieved: %+v", book)
		WriteJSON(w, http.StatusOK, JSONResponse{
			Message: "Book retrieved successfully",
			Data: UserBook{
				ID:          int(book.BookID),
				Isbn:        book.Isbn,
				Title:       book.Title,
				Description: book.Description,
				Author:      book.Author,
				ImageURL:    book.ImageUrl,
				Progress:    int(book.Progress.Int64),
				StartDate:   book.StartDate.Time.String(),
				FinishDate:  book.FinishDate.Time.String(),
				Rating:      int(book.Rating.Int64),
				Review:      book.Review.String,
			},
		})
	}
}

// ListExternalBooks implements BookHandler.
func (b *bookHandler) ListExternalBooks() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("query")
		if query == "" {
			WriteJSONError(w, "Query parameter is required", http.StatusBadRequest)
			return
		}
		// Call the Google Books API to get books
		volumes, err := b.svc.GetBooks(query)
		if err != nil {
			WriteJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		var books []gBooks.Volume
		for _, volume := range volumes.Items {
			books = append(books, *volume)
		}
		if len(books) == 0 {
			WriteJSONError(w, "No books found", http.StatusNotFound)
			return
		}
		WriteJSON(w, http.StatusOK, JSONResponse{
			Message: "Books retrieved successfully",
			Data:    books,
		})
	}
}

// ListUserBooks implements BookHandler.
func (b *bookHandler) ListUserBooks() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// extract userID from context
		userID := GetUserID(r.Context())
		ctx := r.Context()
		books, err := b.store.ListBooksByUser(ctx, userID)
		if err != nil {
			WriteJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}
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
		if len(userBooks) == 0 {
			WriteJSON(w, http.StatusOK, JSONResponse{
				Message: "No books found",
				Data:    []any{},
			})
			return
		}
		WriteJSON(w, http.StatusOK, JSONResponse{
			Message: "Books retrieved successfully",
			Data:    userBooks,
		})
	}
}

// CreateBook implements BookHandler.
func (b *bookHandler) CreateBook(ctx context.Context, params db.CreateBookParams) (int64, error) {
	panic("unimplemented")
}

// CreateUserBook implements BookHandler.
func (b *bookHandler) CreateUserBook() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// extract userID from context
		userID := GetUserID(r.Context())
		ctx := r.Context()
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
		bookID, err := b.store.CreateBook(ctx, db.CreateBookParams{
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
		err = b.store.CreateUserBook(ctx, db.CreateUserBookParams{
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
	}
}

// DeleteBook implements BookHandler.
func (b *bookHandler) DeleteBook(ctx context.Context, id int64) error {
	panic("unimplemented")
}

// GetBook implements BookHandler.
func (b *bookHandler) GetBook(ctx context.Context, id int64) (db.Book, error) {
	panic("unimplemented")
}

// GetUserBook implements BookHandler.
func (b *bookHandler) GetUserBook(ctx context.Context, params db.GetUserBookParams) (db.UserBook, error) {
	panic("unimplemented")
}

// ListBooksByUser implements BookHandler.
func (b *bookHandler) ListBooksByUser(ctx context.Context, userID int64) ([]db.Book, error) {
	panic("unimplemented")
}

// UpdateBook implements BookHandler.
func (b *bookHandler) UpdateBook(ctx context.Context, params db.UpdateBookParams) error {
	panic("unimplemented")
}

func NewBookHandler(store *db.Queries) BookHandler {
	svc, err := books.NewGoogleBooksService()
	if err != nil {
		log.Fatal("Failed to create Google Books service: %v", err)
	}
	return &bookHandler{
		store: store,
		svc:   svc,
	}
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
		log.Info("User ID: %d", userID)
		switch r.Method {
		case http.MethodGet:
			books, err := store.ListBooksByUser(ctx, userID)
			if err != nil {
				log.Info("Error retrieving books: %v", err)
				WriteJSONError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			log.Info("Books retrieved: %v", books)
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
func BookHandlerz(store *db.Queries) http.HandlerFunc {
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
