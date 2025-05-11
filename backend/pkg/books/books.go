package books

// this package handles operations with google books API
import (
	"context"
	"os"

	books "google.golang.org/api/books/v1"
	"google.golang.org/api/option"
)

type BookService interface {
	GetBook(id string) (*books.Volume, error)
	GetBooks(query string) (*books.Volumes, error)
}

type bookService struct {
	srv *books.Service
}

func NewGoogleBooksService() (BookService, error) {
	API_KEY := os.Getenv("GOOGLE_BOOKS_API_KEY")
	if API_KEY == "" {
		return nil, os.ErrNotExist
	}
	srv, err := books.NewService(context.Background(), option.WithAPIKey(API_KEY))
	if err != nil {
		return nil, err
	}
	return &bookService{
		srv: srv,
	}, nil
}

func (s *bookService) GetBook(id string) (*books.Volume, error) {
	volume, err := s.srv.Volumes.Get(id).Do()
	if err != nil {
		return nil, err
	}
	return volume, nil
}

func (s *bookService) GetBooks(query string) (*books.Volumes, error) {
	volumes, err := s.srv.Volumes.List(query).Do()
	if err != nil {
		return nil, err
	}
	return volumes, nil
}
