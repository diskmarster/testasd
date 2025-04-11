package api

import (
	"encoding/json"
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
		{"GET /api/v1/settings", testV1CustomerSettingEndpoint},
		{"GET /api/v2/settings", testV2CustomerSettingEndpoint},
		{"GET /api/v1/products", testV1ProductEndpoint},
		{"POST /api/v1/auth/sign-in", testV1SignInEndpoint},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			teardown := setupTest(t)
			defer teardown(t)

			test.f(t)
		})
	}
}

type V1CustomerSetting struct {
	Id           int  `json:"id"`
	CustomerId   int  `json:"customerID"`
	UseReference bool `json:"useReference"`
	UsePlacement bool `json:"usePlacement"`
	UseBatch     bool `json:"useBatch"`
}

func testV1CustomerSettingEndpoint(t *testing.T) {
	var jsonBody SuccessResponse[V1CustomerSetting]
	err := get("/api/v1/settings", &jsonBody, func(r *http.Request) *http.Request { return r })
	if err == nil {
		t.Fatalf("Expected error from unauthorized get, but got nil. Returned body: %v", jsonBody)
	}

	authData, err := authenticate(os.Getenv("email"), os.Getenv("password"))
	if err != nil {
		t.Fatalf("Error authenticating: %v", err)
	}

	var succesBody SuccessResponse[V1CustomerSetting]
	err = get("/api/v1/settings", &succesBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("bearer %s", authData.Jwt))
		return r
	})
	if err != nil {
		t.Fatalf("Error getting customer settings: %v", err)
	}

	t.Logf("Returned customer settings %v\n", succesBody.Data)
}

type V2CustomerSetting struct {
	Id           int `json:"id"`
	CustomerId   int `json:"customerID"`
	UseReference struct {
		Tilgang    bool `json:"tilgang"`
		Afgang     bool `json:"afgang"`
		Regulering bool `json:"regulering"`
		Flyt       bool `json:"flyt"`
	} `json:"useReference"`
	UsePlacement bool `json:"usePlacement"`
	UseBatch     bool `json:"useBatch"`
}

func testV2CustomerSettingEndpoint(t *testing.T) {
	var jsonBody SuccessResponse[V2CustomerSetting]
	err := get("/api/v2/settings", &jsonBody, func(r *http.Request) *http.Request { return r })
	if err == nil {
		t.Fatalf("Expected error from unauthorized get, but got nil. Returned body: %v", jsonBody)
	}

	authData, err := authenticate(os.Getenv("email"), os.Getenv("password"))
	if err != nil {
		t.Fatalf("Error authenticating: %v", err)
	}

	var succesBody SuccessResponse[V2CustomerSetting]
	err = get("/api/v2/settings", &succesBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("bearer %s", authData.Jwt))
		return r
	})
	if err != nil {
		t.Fatalf("Error getting customer settings: %v", err)
	}

	t.Logf("Returned customer settings %v\n", succesBody.Data)
}

func testV1ProductEndpoint(t *testing.T) {
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

	t.Logf("%d products had duplicate data\n", duplicateProductsCount)
	t.Logf("%d unique productIDs were in response.\n", len(productCountMap))
}

type SignInData struct {
	Jwt  string `json:"jwt"`
	User struct {
		Id int `json:"id"`
	} `json:"user"`
	Customer struct {
		Settings V1CustomerSetting `json:"settings"`
	} `json:"customer"`
}

func testV1SignInEndpoint(t *testing.T) {
	body := make(map[string]string, 2)
	body["email"] = os.Getenv("email")
	body["password"] = os.Getenv("password")

	jsonBytes, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("Error marshaling body: %v", err)
	}

	var jsonBody SuccessResponse[SignInData]

	if err := post("/api/v1/auth/sign-in?method=pw", jsonBytes, &jsonBody, func(r *http.Request) *http.Request {
		r.Header.Set("Content-Type", "application/json")

		return r
	}); err != nil {
		t.Fatalf("Error posting to sign-in endpoint: %v", err)
	}

	t.Logf("Returned SignInData: %v\n", jsonBody.Data)
}
