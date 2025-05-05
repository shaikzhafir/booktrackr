-- name: CreateUser :exec
INSERT INTO users (username, password_hash) VALUES (?, ?);

-- name: GetUserByID :one
SELECT id, username, password_hash, created_at FROM users WHERE id = ?;

-- name: GetUserByUsername :one
SELECT id, username, password_hash, created_at FROM users WHERE username = ?;

-- name: CreateSession :exec
INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?);

-- name: GetSessionByID :one
SELECT id, user_id, created_at, expires_at FROM sessions WHERE id = ?;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = ?;

