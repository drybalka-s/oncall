package plugin

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"sync/atomic"
)

type OnCallPermission struct {
	Action string `json:"action"`
}

func (a *App) GetPermissions(settings *OnCallPluginSettings, onCallUser *OnCallUser) ([]OnCallPermission, error) {
	atomic.AddInt32(&a.PermissionsCallCount, 1)
	permissions, err := a.getPermissionsByActionPrefix(settings)
	if err != nil {
		return nil, err
	}

	actions, exists := permissions[strconv.Itoa(onCallUser.ID)]
	if !exists {
		return []OnCallPermission{}, nil
	}

	result := make([]OnCallPermission, 0, len(actions))
	for action := range actions {
		result = append(result, OnCallPermission{Action: action})
	}
	return result, nil
}

func (a *App) GetAllPermissions(settings *OnCallPluginSettings) (map[string]map[string]interface{}, error) {
	atomic.AddInt32(&a.AllPermissionsCallCount, 1)
	return a.getPermissionsByActionPrefix(settings)
}

func (a *App) getPermissionsByActionPrefix(settings *OnCallPluginSettings) (map[string]map[string]interface{}, error) {
	reqURL, err := url.Parse(settings.GrafanaURL)
	if err != nil {
		return nil, fmt.Errorf("error parsing URL: %v", err)
	}

	reqURL.Path += "api/access-control/users/permissions/search"
	q := reqURL.Query()
	q.Set("actionPrefix", settings.PluginID)
	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequest("GET", reqURL.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("error creating creating new request: %v", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", settings.GrafanaToken))

	res, err := a.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	var permissions map[string]map[string]interface{}
	err = json.Unmarshal(body, &permissions)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %v body=%v", err, string(body))
	}

	if res.StatusCode == 200 {
		return permissions, nil
	}
	return nil, fmt.Errorf("no permissions available, http status %s", res.Status)
}
