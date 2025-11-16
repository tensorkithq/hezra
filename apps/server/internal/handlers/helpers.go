package handlers

import (
	"encoding/json"
	"net/http"

	"paystack.mpc.proxy/internal/dto"
)

// WriteJSONSuccess writes a successful JSON response
func WriteJSONSuccess(w http.ResponseWriter, data interface{}) {
	response := dto.Response{
		Status:  true,
		Message: "Success",
		Data:    data,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// WriteJSONError writes an error JSON response
func WriteJSONError(w http.ResponseWriter, err error, statusCode int) {
	errResponse := dto.ErrorResponse{
		Status:  false,
		Message: "Error",
		Error:   err.Error(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(errResponse)
}

// WriteJSONBadRequest writes a bad request error response
func WriteJSONBadRequest(w http.ResponseWriter, message string) {
	errResponse := dto.ErrorResponse{
		Status:  false,
		Message: "Bad Request",
		Error:   message,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(errResponse)
}

// respondWithJSON writes a JSON response with a custom status code
func respondWithJSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}
