const API_URL = 'http://localhost:5000/api';

// Función para hacer peticiones a la API
export async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en fetchAPI:', error);
        throw error;
    }
} 