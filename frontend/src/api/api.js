import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true  // required to send the httpOnly refresh_token cookie
});

/* Request Interceptor: Attach Bearer token from localStorage if available */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/*
 * Response Interceptor:
 * On 401, attempt silent token refresh via /auth/refresh.
 * The refresh_token is sent automatically as an httpOnly cookie.
 * If refresh succeeds, the new access_token is stored in localStorage
 * and the original request is retried.
 * If refresh also fails, clear credentials and reject.
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        /*
         * Only intercept 401s, skip if we already retried
         * or if the request is an auth setup route.
         */
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/register')
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Refresh token is in the httpOnly cookie — no body needed
                const response = await api.post('/auth/refresh');

                const { access_token, user: userData } = response.data;

                if (access_token) {
                    localStorage.setItem('access_token', access_token);
                    api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }

                // Update stored user data if provided
                if (userData) {
                    localStorage.setItem('user', JSON.stringify(userData));
                }

                processQueue(null, access_token);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Clean up invalid session from browser storage
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;