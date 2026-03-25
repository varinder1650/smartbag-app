import { Alert } from "react-native";
import { logger } from "./logger";

export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode?: number,
        public userMessage?: string,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'AppError';

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}

const handleApiError = (error: any): AppError => {
    // Already an AppError
    if (error instanceof AppError) {
        return error;
    }

    // Axios error with response
    if (error.response) {
        const statusCode = error.response.status;
        const data = error.response.data;
        const message = data?.detail || data?.message || error.message;

        switch (statusCode) {
            case 400:
                return new AppError(
                    message,
                    'BAD_REQUEST',
                    400,
                    'Please check your input and try again',
                    data
                );

            case 401:
                return new AppError(
                    'Unauthorized',
                    'UNAUTHORIZED',
                    401,
                    'Please log in to continue'
                );

            case 403:
                return new AppError(
                    'Forbidden',
                    'FORBIDDEN',
                    403,
                    'You don\'t have permission to perform this action'
                );

            case 404:
                return new AppError(
                    message || 'Resource not found',
                    'NOT_FOUND',
                    404,
                    'The requested item was not found'
                );

            case 409:
                return new AppError(
                    message || 'Conflict',
                    'CONFLICT',
                    409,
                    'This action conflicts with existing data'
                );

            case 422:
                return new AppError(
                    message || 'Validation error',
                    'VALIDATION_ERROR',
                    422,
                    'Please check your input',
                    data
                );

            case 429:
                return new AppError(
                    'Too many requests',
                    'RATE_LIMIT',
                    429,
                    'Please slow down and try again later'
                );

            case 500:
            case 502:
            case 503:
            case 504:
                return new AppError(
                    'Server error',
                    'SERVER_ERROR',
                    statusCode,
                    'Something went wrong on our end. Please try again later'
                );

            default:
                return new AppError(
                    message || 'Unknown error',
                    'UNKNOWN',
                    statusCode,
                    'An unexpected error occurred'
                );
        }
    }

    // Axios error without response (network error)
    if (error.request) {
        return new AppError(
            'Network error',
            'NETWORK_ERROR',
            undefined,
            'Please check your internet connection and try again'
        );
    }

    // Other errors
    return new AppError(
        error.message || 'Unknown error',
        'UNKNOWN',
        undefined,
        'An unexpected error occurred'
    );
};

export const showError = (error: any, title: string = 'Error') => {
    const appError = handleApiError(error);

    Alert.alert(
        title,
        appError.userMessage || appError.message,
        [{ text: 'OK' }]
    );

    // Log to error tracking service
    logger.error(
        `[${appError.code}] ${appError.message}`,
        error,
        {
            statusCode: appError.statusCode,
            details: appError.details,
        }
    );
};

