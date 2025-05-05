-- name: CreateBook :one
INSERT INTO books (isbn, title, description, author, image_url) 
VALUES (?, ?, ?, ?, ?)
RETURNING id;


-- name: GetBook :one
SELECT id, isbn, title, description, author, image_url FROM books WHERE id = ?;

-- name: ListBooks :many
SELECT id, isbn, title, description, author, image_url FROM books ORDER BY id;

-- name: ListBooksByUser :many
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
ORDER BY b.id;

-- name: UpdateBook :exec
UPDATE books SET isbn = ?, title = ?, description = ?, author = ?, image_url = ? WHERE id = ?;

-- name: DeleteBook :exec
DELETE FROM books WHERE id = ?;

-- name: CreateUserBook :exec
INSERT INTO user_books (user_id, book_id) VALUES (?, ?);

-- name: GetUserBook :one
SELECT * FROM user_books WHERE user_id = ? AND book_id = ?;

-- name: UpdateUserBook :exec
UPDATE user_books SET finish_date = ?, rating = ? WHERE user_id = ? AND book_id = ?;

-- name: ListUserBooks :many
SELECT * FROM user_books WHERE user_id = ?;
