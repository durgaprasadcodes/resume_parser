import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const notifyUnauthorized = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:unauthorized"));
};

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

api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("access_token");

    if (accessToken) {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
        config.headers.delete("Authorization");
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response || !originalRequest || error.response.status !== 401) {
            return Promise.reject(error);
        }

        const requestUrl = originalRequest.url || "";
        const isAuthLifecycleRequest =
            requestUrl.includes("/auth/refresh") ||
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/verify-otp") ||
            requestUrl.includes("/auth/logout");

        if (isAuthLifecycleRequest) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            notifyUnauthorized();
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => api(originalRequest));
        }

        isRefreshing = true;

        try {
            const response = await api.post("/auth/refresh", {});
            const accessToken = response.data?.access_token;

            if (typeof accessToken !== "string" || !accessToken) {
                throw new Error("The refresh endpoint did not return an access token.");
            }

            localStorage.setItem("access_token", accessToken);
            processQueue(null);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            notifyUnauthorized();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
