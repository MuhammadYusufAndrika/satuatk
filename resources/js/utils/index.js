import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names safely with Tailwind conflict resolution.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format currency in IDR.
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date in locale-aware format.
 */
export function formatDate(dateStr, options = {}) {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...options,
    }).format(new Date(dateStr));
}

/**
 * Format date + time.
 */
export function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateStr));
}

/**
 * Map request status to badge class and label.
 */
export function requestStatusBadge(status) {
    const map = {
        draft:              { cls: 'badge badge-slate',  label: 'Draft' },
        submitted:          { cls: 'badge badge-blue',   label: 'Diajukan' },
        approved:           { cls: 'badge badge-green',  label: 'Disetujui' },
        partially_approved: { cls: 'badge badge-yellow', label: 'Sebagian' },
        rejected:           { cls: 'badge badge-red',    label: 'Ditolak' },
        fulfilled:          { cls: 'badge badge-purple', label: 'Selesai' },
        cancelled:          { cls: 'badge badge-slate',  label: 'Dibatalkan' },
    };
    return map[status] ?? { cls: 'badge badge-slate', label: status };
}

/**
 * Debounce a function.
 */
export function debounce(fn, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}
