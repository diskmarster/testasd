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
		{"GET /api/v1/cron/mails", testV1CronMailsEndpoint},
		{"POST /api/v1/cron/mails/stock-movements", testV1CronMailsMovementsEndpoint},
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
	code, err := get("/api/v1/settings", &jsonBody, func(r *http.Request) *http.Request { return r })
	if err == nil {
		t.Fatalf("Expected error from unauthorized get, but got nil. Returned body: %v", jsonBody)
	}
	if code != http.StatusUnauthorized {
		t.Fatalf("Expected status code %d, but got %d", http.StatusUnauthorized, code)
	}

	authData, err := authenticate(os.Getenv("email"), os.Getenv("password"))
	if err != nil {
		t.Fatalf("Error authenticating: %v", err)
	}

	var succesBody SuccessResponse[V1CustomerSetting]
	code, err = get("/api/v1/settings", &succesBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("bearer %s", authData.Jwt))
		return r
	})
	if code != http.StatusOK {
		t.Errorf("Expected status code %d, but got %d", http.StatusOK, code)
	}
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
	code, err := get("/api/v2/settings", &jsonBody, func(r *http.Request) *http.Request { return r })
	if code != http.StatusUnauthorized {
		t.Errorf("Expected status code %d, but got %d", http.StatusUnauthorized, code)
	}
	if err == nil {
		t.Fatalf("Expected error from unauthorized get, but got nil. Returned body: %v", jsonBody)
	}

	authData, err := authenticate(os.Getenv("email"), os.Getenv("password"))
	if err != nil {
		t.Fatalf("Error authenticating: %v", err)
	}

	var succesBody SuccessResponse[V2CustomerSetting]
	code, err = get("/api/v2/settings", &succesBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("bearer %s", authData.Jwt))
		return r
	})
	if code != http.StatusOK {
		t.Errorf("Expected status code %d, but got %d", http.StatusOK, code)
	}
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
	code, err := get("/api/v1/products", &successBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("bearer %s", authData.Jwt))
		return r
	})
	if code != http.StatusOK {
		t.Errorf("Expected status code %d, but got %d", http.StatusOK, code)
	}
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

	code, err := post("/api/v1/auth/sign-in?method=pw", jsonBytes, &jsonBody, func(r *http.Request) *http.Request {
		r.Header.Set("Content-Type", "application/json")

		return r
	})
	if code != http.StatusCreated {
		t.Errorf("Expected status code %d, but got %d", http.StatusCreated, code)
	}
	if err != nil {
		t.Fatalf("Error posting to sign-in endpoint: %v", err)
	}

	t.Logf("Returned SignInData: %v\n", jsonBody.Data)
}

type CronMail struct {
	Id int `json:"id"`
	Email *string `json:"email"`
	UserID *int `json:"userID"`
	UserEmail *string `json:"userEmail"`
	CustomerID int `json:"customerID"`
	LocationID string `json:"locationID"`
	LocationName string `json:"locationName"`
	Inserted string `json:"inserted"`
	Updated string `json:"updated"`
	SendStockMail bool `json:"sendStockMail"`
	SendReorderMail bool `json:"sendReorderMail"`
	SendMovementsMail bool `json:"sendMovementsMail"`
}

type CronMailData struct {
	Mails []CronMail `json:"mails"`
}

func testV1CronMailsEndpoint(t *testing.T) {
	secret := os.Getenv("cronSecret")
	var reqBody CronMailData
	code, err := get("/api/v1/cron/mails", &reqBody, func(r *http.Request) *http.Request { return r })
	if code != http.StatusUnauthorized {
		t.Errorf("Expected status code %d, but got %d", http.StatusUnauthorized, code)
	}
	if err == nil {
		t.Fatalf("Expected request without auth header to fail, but it didnt!\n")
	}

	code, err = get("/api/v1/cron/mails", &reqBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", "Bearer")

		return r 
	})
	if code != http.StatusUnauthorized {
		t.Errorf("Expected status code %d, but got %d", http.StatusUnauthorized, code)
	}
	if err == nil {
		t.Fatalf("Expected request without auth header to fail, but it didnt!\n")
	}

	code, err = get("/api/v1/cron/mails", &reqBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", secret))

		return r 
	})
	if code != http.StatusOK {
		t.Errorf("Expected status code %d, but got %d", http.StatusOK, code)
	}
	if err != nil {
		t.Fatalf("Getting cron mails failed unexpectedly: %v", err)
	}

	stockMailCount := 0
	movementsMailCount := 0
	for _, mail := range reqBody.Mails {
		if mail.SendStockMail {
			stockMailCount += 1
		}
		if mail.SendMovementsMail {
			movementsMailCount += 1
		}
	}

	t.Logf("Stock mails: %d, Movement mails: %d\n", stockMailCount, movementsMailCount)

	code, err = get("/api/v1/cron/mails?mailtype=sendMovementsMail", &reqBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", secret))

		return r 
	})
	if code != http.StatusOK {
		t.Errorf("Expected status code %d, but got %d", http.StatusOK, code)
	}
	if err != nil {
		t.Fatalf("Getting cron mails failed unexpectedly: %v", err)
	}

	if len(reqBody.Mails) != movementsMailCount {
		t.Errorf("Expected %d movement mails, but got %d\n", movementsMailCount, len(reqBody.Mails))
	}

	code, err = get("/api/v1/cron/mails?mailtype=sendStockMail", &reqBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", secret))

		return r 
	})
	if code != http.StatusOK {
		t.Errorf("Expected status code %d, but got %d", http.StatusOK, code)
	}
	if err != nil {
		t.Fatalf("Getting cron mails failed unexpectedly: %v", err)
	}

	if len(reqBody.Mails) != stockMailCount {
		t.Errorf("Expected %d stock mails, but got %d\n", stockMailCount, len(reqBody.Mails))
	}
}

func testV1CronMailsMovementsEndpoint(t *testing.T) {
	secret := os.Getenv("cronSecret")
	var resBody CronMailData
	// ######## UNAUTHORIZED REQUEST ASSERTIONS ########
	code, err := post("/api/v1/cron/mails/stock-movements", nil, &resBody, func(r *http.Request) *http.Request { return r })
	if code != http.StatusUnauthorized {
		t.Errorf("Expected status code %d, but got %d", http.StatusUnauthorized, code)
	}
	if err == nil {
		t.Fatalf("Expected request without auth header to fail, but it didnt!\n")
	}

	code, err = post("/api/v1/cron/mails/stock-movements", nil, &resBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", "Bearer")

		return r 
	})
	if code != http.StatusUnauthorized {
		t.Errorf("Expected status code %d, but got %d", http.StatusUnauthorized, code)
	}
	if err == nil {
		t.Fatalf("Expected request without auth header to fail, but it didnt!\n")
	}

	// ######## AUTHORIZED REQUEST ASSERTIONS ########
	code, err = get("/api/v1/cron/mails", &resBody, func(r *http.Request) *http.Request {
		r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", secret))

		return r 
	})
	if code != http.StatusOK {
		t.Errorf("Expected status code %d, but got %d", http.StatusOK, code)
	}
	if err != nil {
		t.Fatalf("Getting cron mails failed unexpectedly: %v", err)
	}

	movementMails := make([]CronMail, 0)
	for _, mail := range resBody.Mails {
		if mail.SendMovementsMail {
			movementMails = append(movementMails, mail)
		}
	}

	if len(movementMails) == 0 {
		t.Fatal("No movement mails were returned from cron mail endpoint\n")
	} else {
		mail := movementMails[0]
		reqBody, err := json.Marshal(mail)
		if err != nil {
			t.Fatalf("Could not marshal mail %v: %v", mail, err)
		}
		t.Logf("%d movement mails. Attempting first mail in slice: %s\n", len(movementMails), string(reqBody))

		code, err = post("/api/v1/cron/mails/stock-movements", reqBody, nil, func(r *http.Request) *http.Request {
			r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", secret))

			return r 
		})
		if code != http.StatusNoContent {
			t.Errorf("Expected status code %d, but got %d", http.StatusNoContent, code)
		}
		if err != nil {
			t.Fatalf("Sending mail failed unexpectedly: %v", err)
		}
	}
}
