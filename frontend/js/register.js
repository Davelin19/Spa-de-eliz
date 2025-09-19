// Configuración de la API
const API_URL = 'http://localhost:8080';

// Función para mostrar errores en los campos
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + 'Error');
    
    field.classList.add('is-invalid');
    errorDiv.textContent = message;
}

// Función para limpiar errores
function clearFieldErrors() {
    const fields = ['nombre', 'email', 'telefono', 'direccion', 'contrasena', 'confirmPassword'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId + 'Error');
        
        if (field) field.classList.remove('is-invalid');
        if (errorDiv) errorDiv.textContent = '';
    });
}

// Función para validar el formulario
function validateForm(formData) {
    let isValid = true;
    
    // Validar nombre
    if (!formData.nombre || formData.nombre.trim().length < 2) {
        showFieldError('nombre', 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
        showFieldError('email', 'Ingresa un email válido');
        isValid = false;
    }
    
    // Validar teléfono
    if (!formData.telefono || formData.telefono.trim().length < 7) {
        showFieldError('telefono', 'Ingresa un teléfono válido');
        isValid = false;
    }
    
    // Validar dirección
    if (!formData.direccion || formData.direccion.trim().length < 5) {
        showFieldError('direccion', 'La dirección debe tener al menos 5 caracteres');
        isValid = false;
    }
    
    // Validar contraseña
    if (!formData.contrasena) {
        showFieldError('contrasena', 'La contraseña es requerida');
        isValid = false;
    }
    
    // Validar confirmación de contraseña
    if (formData.contrasena !== formData.confirmPassword) {
        showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        isValid = false;
    }
    
    return isValid;
}

// Función para enviar el registro al servidor
async function submitRegistration(formData) {
    try {
        console.log('Enviando datos de registro:', formData);
        
        const response = await fetch(`${API_URL}/api/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre: formData.nombre,
                email: formData.email,
                telefono: formData.telefono,
                direccion: formData.direccion,
                contrasena: formData.contrasena
            })
        });
        
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
        
        if (response.ok) {
            // Registro exitoso
            showSuccess('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
            
            // Limpiar el formulario
            document.getElementById('registerForm').reset();
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } else {
            // Error del servidor
            if (result.error) {
                if (result.error.includes('email')) {
                    showFieldError('email', 'Este email ya está registrado');
                } else {
                    showError('Error al crear la cuenta: ' + result.error);
                }
            } else {
                showError('Error al crear la cuenta. Inténtalo de nuevo.');
            }
        }
        
    } catch (error) {
        console.error('Error en la solicitud:', error);
        showError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }
}

// Event listener para el formulario
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de registro cargada');
    
    const form = document.getElementById('registerForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            console.log('Formulario enviado');
            
            // Limpiar errores previos
            clearFieldErrors();
            
            // Obtener datos del formulario
            const formData = {
                nombre: document.getElementById('nombre').value.trim(),
                email: document.getElementById('email').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                direccion: document.getElementById('direccion').value.trim(),
                contrasena: document.getElementById('contrasena').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };
            
            console.log('Datos del formulario:', formData);
            
            // Validar formulario
            if (validateForm(formData)) {
                console.log('Formulario válido, enviando...');
                await submitRegistration(formData);
            } else {
                console.log('Formulario inválido');
                showError('Por favor, corrige los errores en el formulario');
            }
        });
    }
});
