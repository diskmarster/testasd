package api

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"testing"
)

func setupSuite(t *testing.T) func(t *testing.T) {
	data, err := os.ReadFile("./.env")
	if err != nil {
		t.Fatalf("Error reading environment file %v", err)
	}

	lines := strings.Split(string(data), "\n")
	for i, line := range lines {
		if len(strings.TrimSpace(line)) == 0 {
			continue
		}
		components := strings.SplitN(line, "=", 2)
		if len(components) < 2 {
			t.Fatalf("Invalid env line at #%d", i+1)
		}

		key := components[0]
		value := components[1]

		os.Setenv(key, value)
	}

	return func(t *testing.T) {
	}
}

func setupTest(_ *testing.T) func(t *testing.T) {

	return func(t *testing.T) {
	}
}

func TestEndpoints(t *testing.T) {
	teardownSuite := setupSuite(t)
	defer teardownSuite(t)

	tests := []struct {
		name string
		f    func(*testing.T)
	}{
		{"GET /api/v1/settings", testCustomerSettingEndpoint},
		{"GET /api/v1/products", testProductEndpoint},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			teardown := setupTest(t)
			defer teardown(t)

			test.f(t)
		})
	}
}

func testCustomerSettingEndpoint(t *testing.T) {
	var jsonBody SuccessResponse[struct {
		Id           int  `json:"id"`
		CustomerId   int  `json:"customerID"`
		UseReference bool `json:"useReference"`
		UsePlacement bool `json:"usePlacement"`
		UseBatch     bool `json:"useBatch"`
	}]
	err := get("/api/v1/settings", &jsonBody, func(r *http.Request) *http.Request { return r })
	if err == nil {
		t.Fatalf("Expected error from unauthorized get, but got nil. Returned body: %v", jsonBody)
	}

	authData, err := authenticate(os.Getenv("email"), os.Getenv("password"))
	if err != nil {
		t.Fatalf("Error authenticating: %v", err)
	}

	var succesBody SuccessResponse[struct {
		Id           int  `json:"id"`
		CustomerId   int  `json:"customerID"`
		UseReference bool `json:"useReference"`
		UsePlacement bool `json:"usePlacement"`
		UseBatch     bool `json:"useBatch"`
	}]
	err = get("/api/v1/settings", &succesBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("bearer %s", authData.Jwt))
		return r
	})
	if err != nil {
		t.Fatalf("Error getting customer settings: %v", err)
	}

	t.Logf("Returned customer settings %v\n", succesBody.Data)
}

func testProductEndpoint(t *testing.T) {
	authData, err := authenticate(os.Getenv("email"), os.Getenv("password"))
	if err != nil {
		t.Fatalf("Error authenticating: %v", err)
	}

	var successBody SuccessResponse[[]struct {
		ProductID int `json:"id"`
	}]
	err = get("/api/v1/products", &successBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("bearer %s", authData.Jwt))
		return r
	})
	if err != nil {
		t.Fatalf("Error getting products: %v", err)
	}

	productCountMap := make(map[int]int)

	for _, product := range successBody.Data {
		count := productCountMap[product.ProductID]
		productCountMap[product.ProductID] = count + 1
	}

	duplicateProductsCount := 0
	for key, value := range productCountMap {
		if value > 1 {
			duplicateProductsCount += 1
			t.Logf("Product with id %d, had %d duplicate entries in data\n", key, value)
			if !t.Failed() {
				t.Fail()
			}
		}
	}

	t.Logf("%d products had more than had duplicate data\n", duplicateProductsCount)
	t.Logf("%d unique productIDs were in response.\n", len(productCountMap))
}
