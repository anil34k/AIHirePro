const BASE_URL = 'http://localhost:8000/api/';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = { data };
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  
  // Headers construction
  const headers = { ...options.headers };
  
  // Inject access token if available and not overridden
  const token = localStorage.getItem('access_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Set Content-Type unless it is multipart/form-data or similar
  if (headers['Content-Type'] && headers['Content-Type'].includes('multipart/form-data')) {
    delete headers['Content-Type'];
  } else if (options.body && !(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && typeof fetchOptions.body !== 'string') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (netErr) {
    throw new ApiError(netErr.message || 'Network error', 0, null);
  }

  // Handle auto-refresh on 401
  if (response.status === 401 && !options._retry) {
    options._retry = true;
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        const refreshResponse = await fetch(`${BASE_URL}auth/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh }),
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('access_token', refreshData.access);
          
          // Retry the original request with new access token
          if (headers['Authorization']) {
            headers['Authorization'] = `Bearer ${refreshData.access}`;
          }
          return await request(path, options);
        }
      } catch (refreshErr) {
        console.error("Token refresh failed:", refreshErr);
      }
    }
    // Logout and redirect if refresh fails or no refresh token is present
    localStorage.clear();
    window.dispatchEvent(new Event('auth-logout'));
    throw new ApiError('Unauthorized', 401, null);
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch (parseErr) {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.detail || data?.error || response.statusText || 'API request failed',
      response.status,
      data
    );
  }

  return data;
}

const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default api;
