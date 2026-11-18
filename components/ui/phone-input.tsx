'use client';

import {Input} from '@/components/ui/input';
import {formatPhone, normalizePhone, PHONE_PLACEHOLDER} from '@/lib/phone';
import * as React from 'react';

export interface PhoneInputProps
    extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
    /** Канонический номер: 7XXXXXXXXXX или пустая строка. */
    value: string;
    /** Возвращает канонический номер (только цифры, 11 символов). */
    onChange: (value: string) => void;
}

/**
 * Телефонный инпут с маской +7 (999) 123-45-67.
 * Ввод ограничен цифрами; в форму попадает 7XXXXXXXXXX.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({value, onChange, ...props}, forwardedRef) => {
        const inputRef = React.useRef<HTMLInputElement>(null);

        React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

        const digits = normalizePhone(value);
        const display = formatPhone(digits);

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const input = event.target;
            const raw = input.value;
            const caret = input.selectionStart ?? raw.length;
            const rawDigits = raw.replace(/\D/g, '');
            // Если номер введён без кода страны, normalizePhone добавит 7 в начало.
            const prefixedSeven =
                rawDigits.length > 0 &&
                !rawDigits.startsWith('7') &&
                !rawDigits.startsWith('8');
            let nextDigits = normalizePhone(rawDigits);

            // Если пользователь удалил только разделитель (скобку, пробел, дефис),
            // удаляем ближайшую цифру перед курсором.
            if (rawDigits === digits && raw.length < display.length) {
                const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
                const index = Math.max(0, digitsBeforeCaret - 1);

                nextDigits = normalizePhone(digits.slice(0, index) + digits.slice(index + 1));
            }

            onChange(nextDigits);

            const nextDisplay = formatPhone(nextDigits);
            let digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
            if (prefixedSeven) digitsBeforeCaret += 1;

            requestAnimationFrame(() => {
                const element = inputRef.current;
                if (!element) return;

                let position = 0;
                let seen = 0;

                while (position < nextDisplay.length && seen < digitsBeforeCaret) {
                    if (/\d/.test(nextDisplay[position])) seen += 1;
                    position += 1;
                }

                element.setSelectionRange(position, position);
            });
        };

        return (
            <Input
                {...props}
                ref={inputRef}
                type='tel'
                inputMode='tel'
                autoComplete={props.autoComplete ?? 'tel'}
                placeholder={props.placeholder ?? PHONE_PLACEHOLDER}
                maxLength={18}
                value={display}
                onChange={handleChange}
            />
        );
    }
);

PhoneInput.displayName = 'PhoneInput';
