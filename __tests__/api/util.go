package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type ErrorResponse struct {
	Message string `json:"msg"`
}

type SuccessResponse[T any] struct {
	Message string `json:"msg"`
	Data    T      `json:"data"`
}

func get[T any](path string, jsonBody *T, reqSetup func(*http.Request) *http.Request) (int, error) {
	url := fmt.Sprintf("%s%s", os.Getenv("baseUrl"), path)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return -1, fmt.Errorf("Error creating request for %s: %v", url, err)
	}

	req = reqSetup(req)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return -1, fmt.Errorf("Error while getting '%s': %v", url, err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return -1, fmt.Errorf("Error while reading body: %v", err)
	}

	if resp.StatusCode != 200 {
		var errorBody ErrorResponse

		err = json.Unmarshal(body, &errorBody)
		if err != nil {
			return resp.StatusCode, err
		}
		return resp.StatusCode, fmt.Errorf("%s", errorBody.Message)
	}

	return resp.StatusCode, json.Unmarshal(body, jsonBody)
}

func post[T any](path string, body []byte, response *T, reqSetup func(*http.Request) *http.Request) (int, error) {
	url := fmt.Sprintf("%s%s", os.Getenv("baseUrl"), path)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))

	req = reqSetup(req)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return -1, fmt.Errorf("Error posting to '%s': %v", url, err)
	}

	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return -1, fmt.Errorf("Error while reading body: %v", err)
	}

	if resp.StatusCode != 201 {
		var errorBody ErrorResponse

		err = json.Unmarshal(respBody, &errorBody)
		if err != nil {
			return resp.StatusCode, err
		}
		return resp.StatusCode, fmt.Errorf("%s", errorBody.Message)
	}

	return resp.StatusCode, json.Unmarshal(respBody, response)
}

type AuthData struct {
	Jwt string `json:"jwt"`
}

func authenticate(email, pw string) (AuthData, error) {
	body := make(map[string]string, 2)
	body["email"] = email
	body["password"] = pw

	jsonBytes, err := json.Marshal(body)
	if err != nil {
		return AuthData{}, err
	}

	var jsonBody SuccessResponse[AuthData]

	if _, err := post("/api/v1/auth/sign-in?method=pw", jsonBytes, &jsonBody, func(r *http.Request) *http.Request {
		r.Header.Set("Content-Type", "application/json")

		return r
	}); err != nil {
		return AuthData{}, err
	}

	return jsonBody.Data, nil
}
