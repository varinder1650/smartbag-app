import { ENV } from '@/config/env';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
    try {
        if (__DEV__) {
            console.log('=== Configuring Google Sign-In ===');
        }

        // Safety check
        if (!ENV.GOOGLE.WEB_CLIENT_ID) {
            if (__DEV__) console.warn('Google Web Client ID not configured - skipping Google Sign-In setup');
            return;
        }

        GoogleSignin.configure({
            webClientId: ENV.GOOGLE.WEB_CLIENT_ID,
            offlineAccess: false,
            scopes: ['profile', 'email'],
            forceCodeForRefreshToken: false,
        });

        if (__DEV__) console.log('Google Sign-In configured successfully');
    } catch (error) {
        if (__DEV__) console.error('Google Sign-In config failed', error);
    }
};

export interface GoogleSignInResult {
    user: {
        id: string;
        name: string | null;
        email: string;
        photo: string | null;
    };
}

export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
    try {
        if (__DEV__) console.log('=== Starting Google Sign-In ===');

        if (!ENV.GOOGLE.WEB_CLIENT_ID) {
            throw new Error('Google Sign-In not configured. Please add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env');
        }

        // Check Play Services
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // Sign in - returns SignInResponse
        const signInResult = await GoogleSignin.signIn();

        // Get user info from the signed in account
        const userInfo = await GoogleSignin.getCurrentUser();

        if (!userInfo) {
            throw new Error('Failed to get user information');
        }

        // Extract data from User type
        const email = userInfo.user.email;
        const name = userInfo.user.name || userInfo.user.givenName || null;
        const id = userInfo.user.id;
        const photo = userInfo.user.photo || null;

        if (!email) {
            if (__DEV__) console.error('No email in user info:', Object.keys(userInfo.user || {}));
            throw new Error('No email from Google. Please ensure email scope is granted.');
        }

        return {
            user: {
                id: id || email,
                name: name,
                email: email,
                photo: photo,
            },
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('Google Sign-In Error:', error.code, error.message);
        }

        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            throw new Error('Sign in cancelled');
        } else if (error.code === statusCodes.IN_PROGRESS) {
            throw new Error('Sign in already in progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            throw new Error('Google Play Services not available');
        } else if (error.message?.includes('DEVELOPER_ERROR')) {
            throw new Error('Google Sign-In configuration error. Please check your setup.');
        }

        throw error;
    }
};

export const signOutFromGoogle = async (): Promise<void> => {
    try {
        // Ensure Google Sign-In is configured before attempting sign out
        configureGoogleSignIn();

        const currentUser = await GoogleSignin.getCurrentUser();

        if (currentUser) {
            await GoogleSignin.signOut();
            if (__DEV__) console.log('Signed out from Google');
        }
    } catch (error) {
        // User not signed in via Google or error - safe to ignore
    }
};

// Helper function to check if Google Sign-In is properly configured
export const checkGoogleSignInConfig = async (): Promise<boolean> => {
    try {
        const isConfigured = await GoogleSignin.hasPlayServices();
        if (__DEV__) console.log('Google Sign-In configured:', isConfigured);
        return isConfigured;
    } catch (error) {
        if (__DEV__) console.error('Google Sign-In not properly configured:', error);
        return false;
    }
};
