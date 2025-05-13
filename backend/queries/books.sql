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
WHERE ub.user_id = ? AND ub.book_id = ?;

-- name: UpdateUserBook :exec
UPDATE user_books SET progress = ? ,finish_date = ?, rating = ?, review = ? WHERE user_id = ? AND book_id = ?;

-- name: ListUserBooks :many
SELECT * FROM user_books WHERE user_id = ?;
