const requiredEnvVars = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
] as const;

const optionalEnvVars = {
    CLOUDINARY_CLOUD_NAME: '',
    CLOUDINARY_UPLOAD_PRESET: '',
    SENTRY_DSN: '',
} as const;

export const validateEnv = () => {
    const missing: string[] = [];

    if (!process.env.EXPO_PUBLIC_API_URL) {
        missing.push('EXPO_PUBLIC_API_URL');
    }
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        missing.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            `Please check your .env file`
        );
    }
};

const validateGoogleConfig = () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        if (__DEV__) console.warn('Google Web Client ID not configured');
        return false;
    }
    return true;
};

export const ENV = {
    API_URL: (__DEV__ && process.env.EXPO_PUBLIC_API_URL_DEV)
        ? process.env.EXPO_PUBLIC_API_URL_DEV
        : process.env.EXPO_PUBLIC_API_URL!,
    IS_DEV: __DEV__,
    IS_PRODUCTION: process.env.NODE_ENV === 'production',

    GOOGLE: {
        WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        IS_CONFIGURED: validateGoogleConfig(),
    },

    CLOUDINARY: {
        CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
        UPLOAD_PRESET: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
    },

    SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
} as const;

// Validate on import
if (ENV.IS_PRODUCTION) {
    validateEnv();
}