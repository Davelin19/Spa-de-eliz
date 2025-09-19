$(document).ready(function() {
    // Manejar el envío del formulario de registro
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        // Limpiar alertas previas
        $('#alert-container').empty();
        
        // Obtener datos del formulario
        const formData = {
            nombre: $('#nombre').val().trim(),
            email: $('#email').val().trim(),
            telefono: $('#telefono').val().trim(),
            direccion: $('#direccion').val().trim(),
            contrasena: $('#contrasena').val(),
            confirmar_contrasena: $('#confirmar_contrasena').val()
        };
        
        // Validaciones del lado del cliente
        if (!validateForm(formData)) {
            return;
        }
        
        // Deshabilitar el botón de envío
        const submitBtn = $('.btn-register');
        const originalText = submitBtn.html();
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Creando cuenta...');
        
        // Enviar datos al servidor
        $.ajax({
            url: 'http://localhost:5000/api/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                nombre: formData.nombre,
                email: formData.email,
                telefono: formData.telefono,
                direccion: formData.direccion,
                contrasena: formData.contrasena
            }),
            success: function(response) {
                if (response.success) {
                    if (response.step === 'verification') {
                        // Mostrar paso de verificación
                        showVerificationStep(response.email, response.message);
                    } else {
                        // Registro completado (no debería llegar aquí con el nuevo flujo)
                        showAlert('success', response.message || 'Registro exitoso. Redirigiendo...');
                        setTimeout(() => {
                            window.location.href = 'panel.html';
                        }, 2000);
                    }
                } else {
                    showAlert('error', response.error || 'Error en el registro');
                }
            },
            error: function(xhr) {
                let errorMessage = 'Error en el servidor';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                }
                showAlert('error', errorMessage);
            },
            complete: function() {
                // Rehabilitar el botón
                submitBtn.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Manejar validaciones en tiempo real
    $('#nombre').on('input', function() {
        const nombre = $(this).val().trim();
        if (nombre.length > 0 && nombre.length < 2) {
            showFieldError('nombre', 'El nombre debe tener al menos 2 caracteres');
        } else {
            clearFieldError('nombre');
        }
    });
    
    $('#email').on('input', function() {
        const email = $(this).val().trim();
        if (email.length > 0 && !isValidEmail(email)) {
            showFieldError('email', 'Formato de email inválido');
        } else {
            clearFieldError('email');
        }
    });
    
    $('#telefono').on('input', function() {
        const telefono = $(this).val().trim();
        if (telefono.length > 0 && telefono.length < 8) {
            showFieldError('telefono', 'El teléfono debe tener al menos 8 dígitos');
        } else {
            clearFieldError('telefono');
        }
    });
    
    $('#direccion').on('input', function() {
        const direccion = $(this).val().trim();
        if (direccion.length > 0 && direccion.length < 5) {
            showFieldError('direccion', 'La dirección debe tener al menos 5 caracteres');
        } else {
            clearFieldError('direccion');
        }
    });
    
    $('#contrasena').on('input', function() {
        const contrasena = $(this).val();
        if (contrasena.length > 0 && contrasena.length < 6) {
            showFieldError('contrasena', 'La contraseña debe tener al menos 6 caracteres');
        } else {
            clearFieldError('contrasena');
        }
        
        // Validar confirmación si ya tiene valor
        const confirmar = $('#confirmar_contrasena').val();
        if (confirmar.length > 0 && contrasena !== confirmar) {
            showFieldError('confirmar_contrasena', 'Las contraseñas no coinciden');
        } else if (confirmar.length > 0) {
            clearFieldError('confirmar_contrasena');
        }
    });
    
    $('#confirmar_contrasena').on('input', function() {
        const confirmar = $(this).val();
        const contrasena = $('#contrasena').val();
        if (confirmar.length > 0 && contrasena !== confirmar) {
            showFieldError('confirmar_contrasena', 'Las contraseñas no coinciden');
        } else {
            clearFieldError('confirmar_contrasena');
        }
    });
});

// Función para mostrar el paso de verificación
function showVerificationStep(email, message) {
    // Ocultar el formulario de registro
    $('#registerForm').hide();
    
    // Mostrar mensaje
    showAlert('info', message);
    
    // Crear formulario de verificación
    const verificationHtml = `
        <div id="verificationStep" class="mt-4">
            <div class="text-center mb-4">
                <i class="fas fa-envelope-open-text fa-3x text-primary mb-3"></i>
                <h4>Verificación de Email</h4>
                <p class="text-muted">Hemos enviado un código de verificación a:<br><strong>${email}</strong></p>
            </div>
            
            <form id="verificationForm">
                <div class="mb-3">
                    <label for="verificationCode" class="form-label">Código de Verificación</label>
                    <input type="text" class="form-control text-center" id="verificationCode" 
                           placeholder="Ingresa el código de 6 dígitos" maxlength="6" required>
                    <div class="invalid-feedback"></div>
                </div>
                
                <button type="submit" class="btn btn-primary w-100 btn-verify">
                    <i class="fas fa-check me-2"></i>Verificar Código
                </button>
                
                <div class="text-center mt-3">
                    <button type="button" class="btn btn-link" id="resendCode">
                        ¿No recibiste el código? Reenviar
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Agregar el formulario después del contenedor de alertas
    $('#alert-container').after(verificationHtml);
    
    // Manejar envío del código de verificación
    $('#verificationForm').on('submit', function(e) {
        e.preventDefault();
        
        const code = $('#verificationCode').val().trim();
        if (!code || code.length !== 6) {
            showAlert('error', 'Por favor ingresa un código de 6 dígitos');
            return;
        }
        
        const submitBtn = $('.btn-verify');
        const originalText = submitBtn.html();
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Verificando...');
        
        $.ajax({
            url: 'http://localhost:5000/api/verify-registration',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                email: email,
                code: code
            }),
            success: function(response) {
                if (response.success) {
                    showAlert('success', response.message);
                    setTimeout(() => {
                        window.location.href = response.redirect || 'login.html';
                    }, 2000);
                } else {
                    showAlert('error', response.error || 'Código incorrecto');
                }
            },
            error: function(xhr) {
                let errorMessage = 'Error en el servidor';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                }
                showAlert('error', errorMessage);
            },
            complete: function() {
                submitBtn.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Manejar reenvío de código
    $('#resendCode').on('click', function() {
        // Aquí podrías implementar la funcionalidad de reenvío
        showAlert('info', 'Funcionalidad de reenvío no implementada aún');
    });
}

// Función para validar el formulario
function validateForm(data) {
    let isValid = true;
    
    // Limpiar errores previos
    $('.form-control').removeClass('is-invalid');
    $('.invalid-feedback').remove();
    
    // Validar nombre
    if (!data.nombre || data.nombre.length < 2) {
        showFieldError($('#nombre'), 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    }
    
    // Validar email
    if (!data.email) {
        showFieldError($('#email'), 'El email es requerido');
        isValid = false;
    } else if (!isValidEmail(data.email)) {
        showFieldError($('#email'), 'Formato de email inválido');
        isValid = false;
    }
    
    // Validar teléfono
    if (!data.telefono) {
        showFieldError($('#telefono'), 'El teléfono es requerido');
        isValid = false;
    } else if (data.telefono.length < 8) {
        showFieldError($('#telefono'), 'El teléfono debe tener al menos 8 dígitos');
        isValid = false;
    }
    
    // Validar dirección
    if (!data.direccion || data.direccion.length < 5) {
        showFieldError($('#direccion'), 'La dirección debe tener al menos 5 caracteres');
        isValid = false;
    }
    
    // Validar contraseña
    if (!data.contrasena) {
        showFieldError($('#contrasena'), 'La contraseña es requerida');
        isValid = false;
    }
    
    // Validar confirmación de contraseña
    if (!data.confirmar_contrasena) {
        showFieldError($('#confirmar_contrasena'), 'Confirma tu contraseña');
        isValid = false;
    } else if (data.contrasena !== data.confirmar_contrasena) {
        showFieldError($('#confirmar_contrasena'), 'Las contraseñas no coinciden');
        isValid = false;
    }
    
    return isValid;
}

// Función para validar formato de email
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Función para mostrar alertas
function showAlert(type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="fas ${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    $('#alert-container').html(alertHtml);
    
    // Scroll hacia la alerta
    $('html, body').animate({
        scrollTop: $('#alert-container').offset().top - 100
    }, 500);
}

// Función para mostrar error en campo específico
function showFieldError(field, message) {
    field.addClass('is-invalid');
    
    // Remover mensaje de error previo
    field.siblings('.invalid-feedback').remove();
    
    // Agregar nuevo mensaje de error
    field.after(`<div class="invalid-feedback">${message}</div>`);
}

// Función para limpiar error de campo
function clearFieldError(field) {
    field.removeClass('is-invalid');
    field.siblings('.invalid-feedback').remove();
}

// Función para limpiar todos los errores
function clearAllErrors() {
    $('.form-control').removeClass('is-invalid');
    $('.invalid-feedback').remove();
}