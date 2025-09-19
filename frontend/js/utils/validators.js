// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone number validation (basic format)
export const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
};

// Password validation (minimum 8 characters, at least one number and one letter)
export const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
};

// Date validation (YYYY-MM-DD format)
export const isValidDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
};

// Time validation (HH:MM format)
export const isValidTime = (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

// Price validation (positive number with up to 2 decimal places)
export const isValidPrice = (price) => {
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    return priceRegex.test(price) && parseFloat(price) > 0;
};

// Duration validation (positive integer)
export const isValidDuration = (duration) => {
    return Number.isInteger(duration) && duration > 0;
};

// Required field validation
export const isRequired = (value) => {
    return value !== null && value !== undefined && value !== '';
};

// Form validation helper
export function validateForm(data, rules) {
    const errors = [];

    for (const field in rules) {
        const value = data[field];
        const fieldRules = rules[field];

        // Validar campo requerido
        if (fieldRules.required && !value) {
            errors.push(`El campo ${field} es requerido`);
            continue;
        }

        // Si el campo está vacío y no es requerido, continuar con el siguiente
        if (!value) continue;

        // Validar email
        if (fieldRules.email && !isValidEmail(value)) {
            errors.push(`El campo ${field} debe ser un email válido`);
        }

        // Validar longitud mínima
        if (fieldRules.minLength && value.length < fieldRules.minLength) {
            errors.push(`El campo ${field} debe tener al menos ${fieldRules.minLength} caracteres`);
        }

        // Validar número
        if (fieldRules.number && isNaN(value)) {
            errors.push(`El campo ${field} debe ser un número`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
} 