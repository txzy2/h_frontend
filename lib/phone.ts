// lib/phone.ts
//
// Российский телефон: единый формат хранения и маска для UI.
// В форме и в API храним 11 цифр: 7XXXXXXXXXX.

export const PHONE_DIGITS_LENGTH = 11;
export const PHONE_PLACEHOLDER = '+7 (999) 123-45-67';

/** Оставляет только цифры. */
export function phoneDigits(value: string): string {
    return (value ?? '').replace(/\D/g, '');
}

/**
 * Приводит номер к каноническому виду 7XXXXXXXXXX (11 цифр).
 * Поддерживает ввод с 8, с +7 и просто 10 цифр без кода страны.
 */
export function normalizePhone(value: string): string {
    let digits = phoneDigits(value);

    if (!digits) return '';
    if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
    if (!digits.startsWith('7')) digits = `7${digits}`;

    return digits.slice(0, PHONE_DIGITS_LENGTH);
}

/** Форматирует номер для отображения: +7 (999) 123-45-67. */
export function formatPhone(value: string): string {
    const digits = normalizePhone(value);

    if (!digits) return '';

    const rest = digits.slice(1);
    let result = '+7';

    if (rest.length > 0) result += ` (${rest.slice(0, 3)}`;
    if (rest.length >= 3) result += ')';
    if (rest.length > 3) result += ` ${rest.slice(3, 6)}`;
    if (rest.length > 6) result += `-${rest.slice(6, 8)}`;
    if (rest.length > 8) result += `-${rest.slice(8, 10)}`;

    return result;
}

/** Полный номер: 11 цифр, начиная с 7. */
export function isValidPhone(value: string): boolean {
    const digits = normalizePhone(value);

    return digits.length === PHONE_DIGITS_LENGTH && digits.startsWith('7');
}

export function isEmptyPhone(value: string): boolean {
    return phoneDigits(value).length === 0;
}
