/**
 * Error Handler Utility
 * Centralized error handling for the application
 */

import { logger } from "./logger";

// Custom error types
export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, true);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = "Authentication failed") {
        super(message, 401, true);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = "Insufficient permissions") {
        super(message, 403, true);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, 404, true);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Resource conflict") {
        super(message, 409, true);
    }
}

/**
 * Handle errors and return appropriate response
 * @param error - Error object
 * @returns Error response object
 */
export function handleError(error: unknown): {
    message: string;
    statusCode: number;
    stack?: string;
} {
    // Handle AppError instances
    if (error instanceof AppError) {
        logger.error(`AppError: ${error.message}`, {
            statusCode: error.statusCode,
            isOperational: error.isOperational,
        });

        return {
            message: error.message,
            statusCode: error.statusCode,
            ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
        };
    }

    // Handle standard Error instances
    if (error instanceof Error) {
        logger.error(`Error: ${error.message}`, error);

        return {
            message: error.message || "An unexpected error occurred",
            statusCode: 500,
            ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
        };
    }

    // Handle unknown errors
    logger.error("Unknown error occurred", error);

    return {
        message: "An unexpected error occurred",
        statusCode: 500,
    };
}

/**
 * Async error wrapper for API routes
 * @param fn - Async function to wrap
 * @returns Wrapped function with error handling
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
    fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            return await fn(...args);
        } catch (error) {
            throw error;
        }
    };
}

/**
 * Safe async execution with error handling
 * @param fn - Async function to execute
 * @param fallbackValue - Value to return on error
 * @returns Result or fallback value
 */
export async function safeAsync<T>(
    fn: () => Promise<T>,
    fallbackValue: T
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        logger.error("Safe async execution failed", error);
        return fallbackValue;
    }
}

/**
 * Retry async function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Initial delay in ms
 * @returns Result of the function
 */
export async function retryAsync<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error | unknown;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            logger.warn(`Retry attempt ${i + 1}/${maxRetries} failed`, error);

            if (i < maxRetries - 1) {
                const backoffDelay = delay * Math.pow(2, i);
                await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            }
        }
    }

    throw lastError;
}

/**
 * Format error for client response
 * @param error - Error object
 * @returns Formatted error object
 */
export function formatErrorResponse(error: unknown): {
    error: string;
    message: string;
    statusCode: number;
} {
    const handled = handleError(error);

    return {
        error: error instanceof AppError ? error.name : "Error",
        message: handled.message,
        statusCode: handled.statusCode,
    };
}
