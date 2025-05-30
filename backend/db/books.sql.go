// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.26.0
// source: books.sql

package db

import (
	"context"
	"database/sql"
)

const createBook = `-- name: CreateBook :one
INSERT INTO books (isbn, title, description, author, image_url) 
VALUES (?, ?, ?, ?, ?)
RETURNING id
`

type CreateBookParams struct {
	Isbn        string `json:"isbn"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Author      string `json:"author"`
	ImageUrl    string `json:"image_url"`
}

func (q *Queries) CreateBook(ctx context.Context, arg CreateBookParams) (int64, error) {
	row := q.db.QueryRowContext(ctx, createBook,
		arg.Isbn,
		arg.Title,
		arg.Description,
		arg.Author,
		arg.ImageUrl,
	)
	var id int64
	err := row.Scan(&id)
	return id, err
}

const createUserBook = `-- name: CreateUserBook :exec
INSERT INTO user_books (user_id, book_id) VALUES (?, ?)
`

type CreateUserBookParams struct {
	UserID int64 `json:"user_id"`
	BookID int64 `json:"book_id"`
}

func (q *Queries) CreateUserBook(ctx context.Context, arg CreateUserBookParams) error {
	_, err := q.db.ExecContext(ctx, createUserBook, arg.UserID, arg.BookID)
	return err
}

const deleteBook = `-- name: DeleteBook :exec
DELETE FROM books WHERE id = ?
`

func (q *Queries) DeleteBook(ctx context.Context, id int64) error {
	_, err := q.db.ExecContext(ctx, deleteBook, id)
	return err
}

const getBook = `-- name: GetBook :one
SELECT id, isbn, title, description, author, image_url FROM books WHERE id = ?
`

func (q *Queries) GetBook(ctx context.Context, id int64) (Book, error) {
	row := q.db.QueryRowContext(ctx, getBook, id)
	var i Book
	err := row.Scan(
		&i.ID,
		&i.Isbn,
		&i.Title,
		&i.Description,
		&i.Author,
		&i.ImageUrl,
	)
	return i, err
}

const getUserBook = `-- name: GetUserBook :one
SELECT 
    ub.user_id,
    ub.book_id,
    ub.start_date,
    ub.progress,
    ub.finish_date,
    ub.rating,
    ub.review,
    b.isbn,
    b.title,
    b.description,
    b.author,
    b.image_url
FROM user_books ub
JOIN books b ON ub.book_id = b.id
WHERE ub.user_id = ? AND ub.book_id = ?
`

type GetUserBookParams struct {
	UserID int64 `json:"user_id"`
	BookID int64 `json:"book_id"`
}

type GetUserBookRow struct {
	UserID      int64          `json:"user_id"`
	BookID      int64          `json:"book_id"`
	StartDate   sql.NullTime   `json:"start_date"`
	Progress    sql.NullInt64  `json:"progress"`
	FinishDate  sql.NullTime   `json:"finish_date"`
	Rating      sql.NullInt64  `json:"rating"`
	Review      sql.NullString `json:"review"`
	Isbn        string         `json:"isbn"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Author      string         `json:"author"`
	ImageUrl    string         `json:"image_url"`
}

func (q *Queries) GetUserBook(ctx context.Context, arg GetUserBookParams) (GetUserBookRow, error) {
	row := q.db.QueryRowContext(ctx, getUserBook, arg.UserID, arg.BookID)
	var i GetUserBookRow
	err := row.Scan(
		&i.UserID,
		&i.BookID,
		&i.StartDate,
		&i.Progress,
		&i.FinishDate,
		&i.Rating,
		&i.Review,
		&i.Isbn,
		&i.Title,
		&i.Description,
		&i.Author,
		&i.ImageUrl,
	)
	return i, err
}

const listBooks = `-- name: ListBooks :many
SELECT id, isbn, title, description, author, image_url FROM books ORDER BY id
`

func (q *Queries) ListBooks(ctx context.Context) ([]Book, error) {
	rows, err := q.db.QueryContext(ctx, listBooks)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Book
	for rows.Next() {
		var i Book
		if err := rows.Scan(
			&i.ID,
			&i.Isbn,
			&i.Title,
			&i.Description,
			&i.Author,
			&i.ImageUrl,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listBooksByUser = `-- name: ListBooksByUser :many
SELECT 
    b.id,
    b.isbn,
    b.title,
    b.description,
    b.author,
    b.image_url,
    ub.progress,
    ub.start_date,
    ub.finish_date,
    ub.rating
FROM books b
JOIN user_books ub ON b.id = ub.book_id
WHERE ub.user_id = ?
ORDER BY b.id
`

type ListBooksByUserRow struct {
	ID          int64         `json:"id"`
	Isbn        string        `json:"isbn"`
	Title       string        `json:"title"`
	Description string        `json:"description"`
	Author      string        `json:"author"`
	ImageUrl    string        `json:"image_url"`
	Progress    sql.NullInt64 `json:"progress"`
	StartDate   sql.NullTime  `json:"start_date"`
	FinishDate  sql.NullTime  `json:"finish_date"`
	Rating      sql.NullInt64 `json:"rating"`
}

func (q *Queries) ListBooksByUser(ctx context.Context, userID int64) ([]ListBooksByUserRow, error) {
	rows, err := q.db.QueryContext(ctx, listBooksByUser, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListBooksByUserRow
	for rows.Next() {
		var i ListBooksByUserRow
		if err := rows.Scan(
			&i.ID,
			&i.Isbn,
			&i.Title,
			&i.Description,
			&i.Author,
			&i.ImageUrl,
			&i.Progress,
			&i.StartDate,
			&i.FinishDate,
			&i.Rating,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listUserBooks = `-- name: ListUserBooks :many
SELECT user_id, book_id, start_date, progress, finish_date, rating, review FROM user_books WHERE user_id = ?
`

func (q *Queries) ListUserBooks(ctx context.Context, userID int64) ([]UserBook, error) {
	rows, err := q.db.QueryContext(ctx, listUserBooks, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []UserBook
	for rows.Next() {
		var i UserBook
		if err := rows.Scan(
			&i.UserID,
			&i.BookID,
			&i.StartDate,
			&i.Progress,
			&i.FinishDate,
			&i.Rating,
			&i.Review,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateBook = `-- name: UpdateBook :exec
UPDATE books SET isbn = ?, title = ?, description = ?, author = ?, image_url = ? WHERE id = ?
`

type UpdateBookParams struct {
	Isbn        string `json:"isbn"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Author      string `json:"author"`
	ImageUrl    string `json:"image_url"`
	ID          int64  `json:"id"`
}

func (q *Queries) UpdateBook(ctx context.Context, arg UpdateBookParams) error {
	_, err := q.db.ExecContext(ctx, updateBook,
		arg.Isbn,
		arg.Title,
		arg.Description,
		arg.Author,
		arg.ImageUrl,
		arg.ID,
	)
	return err
}

const updateUserBook = `-- name: UpdateUserBook :exec
UPDATE user_books SET progress = ? ,finish_date = ?, rating = ?, review = ? WHERE user_id = ? AND book_id = ?
`

type UpdateUserBookParams struct {
	Progress   sql.NullInt64  `json:"progress"`
	FinishDate sql.NullTime   `json:"finish_date"`
	Rating     sql.NullInt64  `json:"rating"`
	Review     sql.NullString `json:"review"`
	UserID     int64          `json:"user_id"`
	BookID     int64          `json:"book_id"`
}

func (q *Queries) UpdateUserBook(ctx context.Context, arg UpdateUserBookParams) error {
	_, err := q.db.ExecContext(ctx, updateUserBook,
		arg.Progress,
		arg.FinishDate,
		arg.Rating,
		arg.Review,
		arg.UserID,
		arg.BookID,
	)
	return err
}
