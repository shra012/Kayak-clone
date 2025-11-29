/**
 * Error handling utilities
 */

/**
 * Extract user-friendly error message from error object
 */
export const getErrorMessage = (error) => {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Check for user-friendly message from API
  if (error.userMessage) {
    return error.userMessage;
  }

  // Check for API response message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for error message
  if (error.message) {
    // Filter out technical error messages
    if (error.message.includes('Network Error')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message;
  }

  // Default message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
  if (!error.response) {
    return true; // Network error
  }

  const status = error.response.status;
  return status >= 500 || status === 429; // Server error or rate limit
};

/**
 * Get retry delay based on attempt number
 */
export const getRetryDelay = (attemptNumber, baseDelay = 1000) => {
  return baseDelay * Math.pow(2, attemptNumber - 1); // Exponential backoff
};

/**
 * Format error for display
 */
export const formatError = (error) => {
  const message = getErrorMessage(error);
  const status = error.response?.status;
  const code = error.response?.data?.code;

  return {
    message,
    status,
    code,
    isRetryable: isRetryableError(error),
  };
};

