package plugin

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetPermissionsUsesPermissionsSearch(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/access-control/users/permissions/search" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if r.URL.Query().Get("actionPrefix") != "grafana-oncall-app" {
			t.Fatalf("unexpected actionPrefix: %s", r.URL.Query().Get("actionPrefix"))
		}
		if r.Header.Get("Authorization") != "Bearer token" {
			t.Fatalf("unexpected authorization header")
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"42":{"grafana-oncall-app.schedules:read":null,"grafana-oncall-app.schedules:write":null}}`))
	}))
	defer server.Close()

	app := &App{httpClient: server.Client(), OnCallDebugStats: &OnCallDebugStats{}}
	settings := &OnCallPluginSettings{
		GrafanaURL:   server.URL,
		GrafanaToken: "token",
		PluginID:     "grafana-oncall-app",
	}

	permissions, err := app.GetPermissions(settings, &OnCallUser{ID: 42, Login: "user"})
	if err != nil {
		t.Fatalf("GetPermissions returned an error: %v", err)
	}
	if len(permissions) != 2 {
		t.Fatalf("expected 2 permissions, got %d", len(permissions))
	}
}
