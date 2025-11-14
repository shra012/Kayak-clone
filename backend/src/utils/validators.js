export const SSN_REGEX = /^\d{3}-\d{2}-\d{4}$/;

export const isValidSsn = (value = '') => SSN_REGEX.test(value);
