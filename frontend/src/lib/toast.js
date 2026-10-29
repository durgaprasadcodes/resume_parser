import { toast } from 'react-toastify';

/**
 * Centralised toast helpers.
 * Import { showSuccess, showError, showInfo } from '../lib/toast' wherever needed.
 */

const BASE_OPTIONS = {
    position: 'bottom-right',
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export const showSuccess = (message, options = {}) =>
    toast.success(message, { ...BASE_OPTIONS, autoClose: 3000, ...options });

export const showError = (message, options = {}) =>
    toast.error(message, { ...BASE_OPTIONS, autoClose: 4500, ...options });

export const showInfo = (message, options = {}) =>
    toast.info(message, { ...BASE_OPTIONS, ...options });

export const showWarning = (message, options = {}) =>
    toast.warning(message, { ...BASE_OPTIONS, ...options });

/**
 * Extracts a human-readable error string from an Axios error response.
 * Handles FastAPI-style { detail: string | array } payloads.
 */
export const extractErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    const detail = error?.response?.data?.detail;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
        return detail
            .map((d) => d.msg || d.message || JSON.stringify(d))
            .join(', ');
    }

    if (detail?.msg) return detail.msg;

    return error?.response?.data?.message || error?.message || fallback;
};

