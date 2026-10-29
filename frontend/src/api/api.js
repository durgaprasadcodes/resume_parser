import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // Always send & receive HTTP-only cookies
});

// ============================================================
// REFRESH STATE
// ============================================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });

    failedQueue = [];
};

// ============================================================
// RESPONSE INTERCEPTOR (Silent Refresh on 401)
// ============================================================

api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        // If no response or no config attached, reject immediately
        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        // Only handle HTTP 401 Unauthorized
        if (error.response.status !== 401) {
            return Promise.reject(error);
        }

        // Never attempt to refresh on auth setup/lifecycle endpoints
        const requestUrl = originalRequest.url || "";
        const isAuthLifecycleRequest =
            requestUrl.includes("/auth/refresh") ||
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/logout");

        if (isAuthLifecycleRequest) {
            return Promise.reject(error);
        }

        // Prevent infinite loops if retried request still returns 401
        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // If another request is currently refreshing the token, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => {
                // Browser automatically sends the refreshed HTTP-only cookie
                return api(originalRequest);
            });
        }

        isRefreshing = true;

        try {
            console.log("🔄 Access token expired. Attempting silent refresh...");

            const refreshBaseUrl = import.meta.env.VITE_API_URL || "";
            await axios.post(
                `${refreshBaseUrl}/auth/refresh`,
                {},
                {
                    withCredentials: true, // HTTP-only refresh_token cookie sent automatically
                }
            );

            console.log("✅ Token successfully refreshed via HTTP-only cookie");

            // Resolve all queued requests
            processQueue(null);

            // Retry the original request
            return api(originalRequest);

        } catch (refreshError) {
            console.error("❌ Silent token refresh failed:", refreshError);

            // Reject all queued requests
            processQueue(refreshError);

            // Clean up stored user metadata and notify AuthContext to clear state
            localStorage.removeItem("user");
            window.dispatchEvent(new Event("auth:unauthorized"));

            return Promise.reject(refreshError);

        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
