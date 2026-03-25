import { getDispatch } from "@/store/storeRef";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    saveAccessToken
} from "./tokenStorage";

// Simple inline logger gated behind __DEV__
const log = {
    info: (msg: string) => { if (__DEV__) console.log('[INFO]', msg); },
    warn: (msg: string) => { if (__DEV__) console.warn('[WARN]', msg); },
    error: (msg: string, err: any) => { if (__DEV__) console.error('[ERROR]', msg, err); },
};

const api = axios.create({
    baseURL: __DEV__
        ? process.env.EXPO_PUBLIC_API_URL_DEV || 'http://10.0.2.2:8000/api'
        : process.env.EXPO_PUBLIC_API_URL || 'http://195.35.6.222/api',
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
}> = [];

const MAX_RETRY_ATTEMPTS = 3;
let refreshAttempts = 0;

const AUTH_EXCLUDED_ROUTES = [
    "/auth/login",
    "/auth/refresh",
    "/auth/logout",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/google",
    "/auth/verify-email",
    "/auth/reset-password",
    "/auth/phone",
];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(promise => {
        if (error) promise.reject(error);
        else promise.resolve(token!);
    });
    failedQueue = [];
};

api.interceptors.request.use(
    async (config) => {
        try {
            const token = await getAccessToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            log.error('Token retrieval error', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as AxiosRequestConfig & { _retry?: boolean };

        const isExcludedRoute = AUTH_EXCLUDED_ROUTES.some(path =>
            original.url?.includes(path)
        );

        if (
            error.response?.status === 401 &&
            !original._retry &&
            !isExcludedRoute
        ) {
            if (refreshAttempts >= MAX_RETRY_ATTEMPTS) {
                await clearTokens();
                refreshAttempts = 0;

                try {
                    const dispatch = getDispatch();
                    dispatch({ type: 'auth/forceLogout' });
                } catch (e) {
                    // Store not ready - OK
                }

                return Promise.reject(new Error("Session expired"));
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (original.headers) {
                        original.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(original);
                });
            }

            original._retry = true;
            isRefreshing = true;
            refreshAttempts++;

            try {
                const refreshToken = await getRefreshToken();

                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                const { data } = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    { refresh_token: refreshToken },
                    { timeout: 10000 }
                );

                await saveAccessToken(data.access_token);
                processQueue(null, data.access_token);

                if (original.headers) {
                    original.headers.Authorization = `Bearer ${data.access_token}`;
                }

                refreshAttempts = 0;
                return api(original);
            } catch (refreshError) {
                processQueue(refreshError as Error, null);
                await clearTokens();

                try {
                    const dispatch = getDispatch();
                    dispatch({ type: 'auth/forceLogout' });
                } catch (e) {
                    // Store not ready - OK
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;