// import * as SecureStore from "expo-secure-store";

// const ACCESS_TOKEN_KEY = "access_token";
// const REFRESH_TOKEN_KEY = "refresh_token";

// export const saveAccessToken = async (token: string) => {
//     await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
// };

// export const saveRefreshToken = async (token: string) => {
//     await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
// };

// export const getAccessToken = async () =>
//     SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

// export const getRefreshToken = async () =>
//     SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

// export const clearTokens = async () => {
//     await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
//     await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
// };

import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_TIMESTAMP_KEY = "token_timestamp";

// Token expiration time (7 days in milliseconds)
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

interface SecureTokenOptions {
    keychainAccessible?: SecureStore.KeychainAccessibilityConstant;
}

const defaultOptions: SecureTokenOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
};

export const saveAccessToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(
            ACCESS_TOKEN_KEY,
            token,
            defaultOptions
        );
        await SecureStore.setItemAsync(
            TOKEN_TIMESTAMP_KEY,
            Date.now().toString(),
            defaultOptions
        );
    } catch (error) {
        throw new Error('Failed to save access token');
    }
};

export const saveRefreshToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(
            REFRESH_TOKEN_KEY,
            token,
            defaultOptions
        );
    } catch (error) {
        throw new Error('Failed to save refresh token');
    }
};

export const getAccessToken = async (): Promise<string | null> => {
    try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

        if (!token) return null;

        // Check token age
        const timestamp = await SecureStore.getItemAsync(TOKEN_TIMESTAMP_KEY);
        if (timestamp) {
            const age = Date.now() - parseInt(timestamp, 10);
            if (age > TOKEN_MAX_AGE) {
                // Token too old, clear it
                await clearTokens();
                return null;
            }
        }

        return token;
    } catch (error) {
        if (__DEV__) console.error('Error retrieving access token:', error);
        return null;
    }
};

export const getRefreshToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        if (__DEV__) console.error('Error retrieving refresh token:', error);
        return null;
    }
};

export const clearTokens = async (): Promise<void> => {
    try {
        await Promise.all([
            SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
            SecureStore.deleteItemAsync(TOKEN_TIMESTAMP_KEY),
        ]);
    } catch (error) {
        if (__DEV__) console.error('Error clearing tokens:', error);
    }
};

export const isTokenExpired = async (): Promise<boolean> => {
    try {
        const timestamp = await SecureStore.getItemAsync(TOKEN_TIMESTAMP_KEY);
        if (!timestamp) return true;

        const age = Date.now() - parseInt(timestamp, 10);
        return age > TOKEN_MAX_AGE;
    } catch (error) {
        return true;
    }
};