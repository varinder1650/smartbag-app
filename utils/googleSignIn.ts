import { ENV } from '@/config/env';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const logger = {
    info: (msg: string, data?: any) => console.log('[INFO]', msg, data),
    warn: (msg: string, data?: any) => console.warn('[WARN]', msg, data),
    error: (msg: string, err: any) => console.error('[ERROR]', msg, err),
};

export const configureGoogleSignIn = () => {
    try {
        console.log('=== Configuring Google Sign-In ===');
        console.log('WEB_CLIENT_ID:', ENV.GOOGLE.WEB_CLIENT_ID);

        // Safety check
        if (!ENV.GOOGLE.WEB_CLIENT_ID) {
            console.warn('Google Web Client ID not configured - skipping Google Sign-In setup');
            return;
        }

        GoogleSignin.configure({
            webClientId: ENV.GOOGLE.WEB_CLIENT_ID,
            offlineAccess: false,
            // Add scopes to request email and profile
            scopes: ['profile', 'email'],
            // Force code for account picker
            forceCodeForRefreshToken: false,
        });

        logger.info('Google Sign-In configured successfully');
    } catch (error) {
        logger.error('Google Sign-In config failed', error);
        // Don't throw - just log
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
        console.log('=== Starting Google Sign-In ===');

        if (!ENV.GOOGLE.WEB_CLIENT_ID) {
            throw new Error('Google Sign-In not configured. Please add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env');
        }

        // Check Play Services
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        console.log('✅ Play Services available');

        // Sign in - returns SignInResponse
        const signInResult = await GoogleSignin.signIn();
        console.log('=== Google Sign-In Response ===');
        console.log('Type:', signInResult.type);
        console.log('Full response:', JSON.stringify(signInResult, null, 2));

        // Get user info from the signed in account
        const userInfo = await GoogleSignin.getCurrentUser();
        console.log('=== Current User Info ===');
        console.log('User info:', JSON.stringify(userInfo, null, 2));

        if (!userInfo) {
            throw new Error('Failed to get user information');
        }

        // Extract data from User type
        const email = userInfo.user.email;
        const name = userInfo.user.name || userInfo.user.givenName || null;
        const id = userInfo.user.id;
        const photo = userInfo.user.photo || null;

        console.log('Extracted data:', { email, name, id, photo });

        if (!email) {
            console.error('❌ No email in user info');
            console.error('Available user fields:', Object.keys(userInfo.user || {}));
            throw new Error('No email from Google. Please ensure email scope is granted.');
        }

        console.log('✅ Email found:', email);

        return {
            user: {
                id: id || email,
                name: name,
                email: email,
                photo: photo,
            },
        };
    } catch (error: any) {
        console.error('=== Google Sign-In Error ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);

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
            logger.info('Signed out from Google');
        }
    } catch (error) {
        // User not signed in via Google or error - safe to ignore
    }
};

// Helper function to check if Google Sign-In is properly configured
export const checkGoogleSignInConfig = async (): Promise<boolean> => {
    try {
        const isConfigured = await GoogleSignin.hasPlayServices();
        console.log('Google Sign-In configured:', isConfigured);
        return isConfigured;
    } catch (error) {
        console.error('Google Sign-In not properly configured:', error);
        return false;
    }
};