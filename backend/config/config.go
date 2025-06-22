package config

import "os"

var FRONTEND_HOSTNAME string

func init() {
	// Default to development
	FRONTEND_HOSTNAME = "http://localhost:3000"

	// If in production, use the same hostname as backend
	if os.Getenv("PROD") == "true" {
		FRONTEND_HOSTNAME = "http://localhost:8080"

	}
}
