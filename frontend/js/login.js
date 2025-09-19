// Verificar si ya está autenticado
const adminData = sessionStorage.getItem('adminData');
if (adminData) {
    window.location.replace('index.html');
}

$(document).ready(function () {
    console.log('Página de login cargada');

    // URL base del servidor
    const API_URL = 'http://localhost:5000';

    // Variables para control de intentos fallidos
    let failedAttempts = parseInt(localStorage.getItem('failedAttempts') || '0');
    let lockoutTime = parseInt(localStorage.getItem('lockoutTime') || '0');
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

    // Verificar si ya hay un cliente logueado
    const clienteData = sessionStorage.getItem('clienteData');
    if (clienteData) {
        window.location.replace('usuario.html');
    }

    // Verificar conexión con el servidor
    $.ajax({
        url: `${API_URL}/api/status`,
        method: 'GET',
        timeout: 5000,
        success: function (response) {
            console.log('Conexión con el servidor establecida:', response);
        },
        error: function (xhr, status, error) {
            console.error('Error al conectar con el servidor:', {
                status: xhr.status,
                statusText: xhr.statusText,
                error: error
            });
            showError('No se pudo conectar con el servidor. Por favor, asegúrese de que el servidor esté corriendo.');
        }
    });

    // Función para validar el email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Función para validar la contraseña
    function isValidPassword(password) {
        return password.length > 0; // Solo verificar que no esté vacía
    }

    // Función para mostrar errores de validación
    function showValidationError(field, message) {
        $(`#${field}`).addClass('is-invalid');
        $(`#${field}Error`).text(message).show();
    }

    // Función para limpiar errores de validación
    function clearValidationErrors() {
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').hide();
    }

    // Validar campos al escribir
    $('#email').on('input', function () {
        if (isValidEmail($(this).val())) {
            $(this).removeClass('is-invalid').addClass('is-valid');
            $('#emailError').hide();
        } else {
            $(this).removeClass('is-valid').addClass('is-invalid');
            $('#emailError').text('Por favor, ingrese un email válido').show();
        }
    });

    $('#password').on('input', function () {
        if (isValidPassword($(this).val())) {
            $(this).removeClass('is-invalid').addClass('is-valid');
            $('#passwordError').hide();
        } else {
            $(this).removeClass('is-valid').addClass('is-invalid');
            $('#passwordError').text('La contraseña es requerida').show();
        }
    });

    // Función para verificar si la cuenta está bloqueada
    function isAccountLocked() {
        const now = Date.now();
        if (lockoutTime > 0 && now < lockoutTime) {
            const remainingTime = Math.ceil((lockoutTime - now) / 60000);
            return remainingTime;
        }
        return false;
    }

    // Función para manejar intentos fallidos
    function handleFailedAttempt() {
        failedAttempts++;
        localStorage.setItem('failedAttempts', failedAttempts.toString());
        
        if (failedAttempts >= MAX_ATTEMPTS) {
            lockoutTime = Date.now() + LOCKOUT_DURATION;
            localStorage.setItem('lockoutTime', lockoutTime.toString());
            showError(`Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos.`);
        } else {
            const remaining = MAX_ATTEMPTS - failedAttempts;
            showError(`Credenciales inválidas. Le quedan ${remaining} intentos antes del bloqueo.`);
        }
    }

    // Función para resetear intentos fallidos
    function resetFailedAttempts() {
        failedAttempts = 0;
        lockoutTime = 0;
        localStorage.removeItem('failedAttempts');
        localStorage.removeItem('lockoutTime');
    }

    $('#loginForm').submit(function (e) {
        e.preventDefault();
        console.log('Formulario enviado');
        clearValidationErrors();

        // Verificar si la cuenta está bloqueada
        const remainingLockTime = isAccountLocked();
        if (remainingLockTime) {
            showError(`Cuenta bloqueada. Intente nuevamente en ${remainingLockTime} minutos.`);
            return;
        }

        var email = $('#email').val();
        var password = $('#password').val();
        var isValid = true;

        // Validar email
        if (!email) {
            showValidationError('email', 'El email es requerido');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showValidationError('email', 'Por favor, ingrese un email válido');
            isValid = false;
        }

        // Validar contraseña
        if (!password) {
            showValidationError('password', 'La contraseña es requerida');
            isValid = false;
        }

        if (!isValid) {
            console.log('Validación fallida');
            showError('Por favor, corrija los errores en el formulario');
            return;
        }

        console.log('Enviando solicitud de login...');
        // Mostrar indicador de carga
        $('button[type="submit"]').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...');

        $.ajax({
            url: `${API_URL}/api/login`,
            method: 'POST',
            data: JSON.stringify({
                email: email,
                contrasena: password
            }),
            contentType: 'application/json',
            timeout: 10000,
            success: function (response) {
                console.log('Respuesta recibida:', response);
                if (response.success) {
                    // Resetear intentos fallidos en caso de éxito
                    resetFailedAttempts();
                    
                    // Guardar token
                    sessionStorage.setItem('token', response.token);
                    
                    if (response.tipo === 'admin') {
                        // Guardar datos del administrador
                        sessionStorage.setItem('adminData', JSON.stringify(response.admin));
                        showWelcomeMessage(response.admin.nombre || 'Administrador', 'Administrador');
                        setTimeout(() => {
                            window.location.href = response.redirect;
                        }, 2000);
                    } else if (response.tipo === 'cliente') {
                        // Guardar datos del cliente
                        sessionStorage.setItem('clienteData', JSON.stringify(response.cliente));
                        
                        // Guardar también en localStorage para compatibilidad con index.html
                        localStorage.setItem('clienteId', response.cliente.id);
                        localStorage.setItem('clienteNombre', response.cliente.nombre);
                        
                        // Verificar si hay una reserva temporal pendiente
                        const reservaTemporalData = localStorage.getItem('reservaTemporalData');
                        if (reservaTemporalData) {
                            // Procesar la reserva automáticamente
                            procesarReservaTemporal(response.cliente.id, JSON.parse(reservaTemporalData));
                        } else {
                            showWelcomeMessage(response.cliente.nombre || 'Cliente', 'Cliente');
                            setTimeout(() => {
                                window.location.href = response.redirect;
                            }, 2000);
                        }
                    }
                } else {
                    console.log('Login fallido:', response.error);
                    // Manejar respuestas de error del servidor
                    if (response.locked) {
                        const minutes = response.remaining_minutes || 15;
                        showError(`Cuenta bloqueada por ${minutes} minutos debido a múltiples intentos fallidos.`);
                        // Actualizar el estado local de bloqueo
                        const lockoutTime = new Date().getTime() + (minutes * 60 * 1000);
                        localStorage.setItem('lockoutTime', lockoutTime.toString());
                    } else if (response.remaining_attempts !== undefined) {
                        showError(`Credenciales inválidas. Le quedan ${response.remaining_attempts} intentos antes del bloqueo.`);
                        // Actualizar contador local
                        const currentAttempts = parseInt(localStorage.getItem('failedAttempts') || '0');
                        localStorage.setItem('failedAttempts', (currentAttempts + 1).toString());
                    } else {
                        showError(response.error || 'Credenciales inválidas');
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error('Error en la solicitud:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    response: xhr.responseJSON,
                    error: error
                });

                let errorMessage = 'Error al iniciar sesión';

                // Manejar diferentes tipos de errores
                if (xhr.status === 0) {
                    errorMessage = 'No se pudo conectar con el servidor. Por favor, asegúrese de que el servidor esté corriendo en http://localhost:8080';
                } else if (xhr.status === 404) {
                    errorMessage = 'El servicio de autenticación no está disponible. Por favor, contacte al administrador.';
                } else if (xhr.status === 423) {
                    // Cuenta bloqueada
                    try {
                        const response = xhr.responseJSON || JSON.parse(xhr.responseText);
                        const minutes = response.remaining_minutes || 15;
                        errorMessage = `Cuenta bloqueada por ${minutes} minutos debido a múltiples intentos fallidos.`;
                        // Actualizar el estado local de bloqueo
                        const lockoutTime = new Date().getTime() + (minutes * 60 * 1000);
                        localStorage.setItem('lockoutTime', lockoutTime.toString());
                    } catch (e) {
                        errorMessage = 'Cuenta temporalmente bloqueada. Intente más tarde.';
                    }
                } else if (xhr.status === 401) {
                    // Credenciales inválidas
                    try {
                        const response = xhr.responseJSON || JSON.parse(xhr.responseText);
                        if (response.remaining_attempts !== undefined) {
                            errorMessage = `Credenciales inválidas. Le quedan ${response.remaining_attempts} intentos antes del bloqueo.`;
                            // Actualizar contador local
                            const currentAttempts = parseInt(localStorage.getItem('failedAttempts') || '0');
                            localStorage.setItem('failedAttempts', (currentAttempts + 1).toString());
                        } else {
                            errorMessage = response.error || 'Credenciales inválidas';
                        }
                    } catch (e) {
                        handleFailedAttempt();
                        return;
                    }
                } else if (xhr.status === 500) {
                    errorMessage = 'Error interno del servidor. Por favor, intente más tarde.';
                } else if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                }

                showError(errorMessage);
            },
            complete: function () {
                // Restaurar el botón
                $('button[type="submit"]').prop('disabled', false).html('<i class="fas fa-sign-in-alt"></i> Iniciar Sesión');
            }
        });
    });

    // Manejar clic en "¿Olvidaste tu contraseña?"
    $('#forgotPasswordLink').click(function(e) {
        e.preventDefault();
        $('#forgotPasswordModal').modal('show');
    });

    // Variable para almacenar el email de recuperación
    let recoveryEmail = '';

    // Manejar envío del formulario de recuperación de contraseña
    $('#forgotPasswordForm').submit(function(e) {
        e.preventDefault();
        
        const email = $('#forgotEmail').val();
        if (!email || !isValidEmail(email)) {
            $('#forgotPasswordAlert').html('<div class="alert alert-danger">Por favor, ingrese un email válido</div>');
            return;
        }

        // Deshabilitar botón y mostrar loading
        const submitBtn = $('#forgotPasswordForm button[type="submit"]');
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Enviando...');
        
        $.ajax({
            url: `${API_URL}/api/forgot-password`,
            method: 'POST',
            data: JSON.stringify({ email: email }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    recoveryEmail = email;
                    $('#forgotPasswordModal').modal('hide');
                    $('#verifyCodeModal').modal('show');
                    $('#forgotPasswordForm')[0].reset();
                    $('#forgotPasswordAlert').empty();
                } else {
                    $('#forgotPasswordAlert').html(`<div class="alert alert-danger">${response.message || 'Error al enviar el código'}</div>`);
                }
            },
            error: function(xhr) {
                let errorMessage = 'Error al enviar el código de recuperación';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                $('#forgotPasswordAlert').html(`<div class="alert alert-danger">${errorMessage}</div>`);
            },
            complete: function() {
                submitBtn.prop('disabled', false).html('<i class="fas fa-paper-plane me-2"></i>Enviar Código');
            }
        });
    });

    // Manejar envío del formulario de verificación de código
    $('#verifyCodeForm').submit(function(e) {
        e.preventDefault();
        
        const code = $('#verificationCode').val();
        if (!code || code.length !== 6) {
            $('#verifyCodeAlert').html('<div class="alert alert-danger">Por favor, ingrese un código válido de 6 dígitos</div>');
            return;
        }

        // Deshabilitar botón y mostrar loading
        const submitBtn = $('#verifyCodeForm button[type="submit"]');
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Verificando...');
        
        $.ajax({
            url: `${API_URL}/api/verify-recovery-code`,
            method: 'POST',
            data: JSON.stringify({ email: recoveryEmail, code: code }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    $('#verifyCodeModal').modal('hide');
                    $('#newPasswordModal').modal('show');
                    $('#verifyCodeForm')[0].reset();
                    $('#verifyCodeAlert').empty();
                } else {
                    $('#verifyCodeAlert').html(`<div class="alert alert-danger">${response.message || 'Código inválido'}</div>`);
                }
            },
            error: function(xhr) {
                let errorMessage = 'Error al verificar el código';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                $('#verifyCodeAlert').html(`<div class="alert alert-danger">${errorMessage}</div>`);
            },
            complete: function() {
                submitBtn.prop('disabled', false).html('<i class="fas fa-check me-2"></i>Verificar Código');
            }
        });
    });

    // Manejar reenvío de código
    $('#resendCodeBtn').click(function(e) {
        e.preventDefault();
        
        const btn = $(this);
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Reenviando...');
        
        $.ajax({
            url: `${API_URL}/api/forgot-password`,
            method: 'POST',
            data: JSON.stringify({ email: recoveryEmail }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    $('#verifyCodeAlert').html('<div class="alert alert-success">Código reenviado exitosamente</div>');
                } else {
                    $('#verifyCodeAlert').html('<div class="alert alert-danger">Error al reenviar el código</div>');
                }
            },
            error: function() {
                $('#verifyCodeAlert').html('<div class="alert alert-danger">Error al reenviar el código</div>');
            },
            complete: function() {
                btn.prop('disabled', false).html('<i class="fas fa-redo me-1"></i>Reenviar código');
            }
        });
    });

    // Manejar envío del formulario de nueva contraseña
    $('#newPasswordForm').submit(function(e) {
        e.preventDefault();
        
        const newPassword = $('#newPassword').val();
        const confirmPassword = $('#confirmNewPassword').val();
        
        if (!newPassword || newPassword.length < 6) {
            $('#newPasswordAlert').html('<div class="alert alert-danger">La contraseña debe tener al menos 6 caracteres</div>');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            $('#newPasswordAlert').html('<div class="alert alert-danger">Las contraseñas no coinciden</div>');
            return;
        }

        // Deshabilitar botón y mostrar loading
        const submitBtn = $('#newPasswordForm button[type="submit"]');
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Cambiando...');
        
        $.ajax({
            url: `${API_URL}/api/reset-password`,
            method: 'POST',
            data: JSON.stringify({ email: recoveryEmail, newPassword: newPassword }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    $('#newPasswordAlert').html('<div class="alert alert-success">Contraseña cambiada exitosamente</div>');
                    setTimeout(() => {
                        $('#newPasswordModal').modal('hide');
                        $('#newPasswordForm')[0].reset();
                        $('#newPasswordAlert').empty();
                        recoveryEmail = '';
                        showSuccess('Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.');
                    }, 2000);
                } else {
                    $('#newPasswordAlert').html(`<div class="alert alert-danger">${response.message || 'Error al cambiar la contraseña'}</div>`);
                }
            },
            error: function(xhr) {
                let errorMessage = 'Error al cambiar la contraseña';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                $('#newPasswordAlert').html(`<div class="alert alert-danger">${errorMessage}</div>`);
            },
            complete: function() {
                submitBtn.prop('disabled', false).html('<i class="fas fa-save me-2"></i>Cambiar Contraseña');
            }
        });
    });

    // Limpiar modales cuando se cierren
    $('#forgotPasswordModal').on('hidden.bs.modal', function() {
        $('#forgotPasswordForm')[0].reset();
        $('#forgotPasswordAlert').empty();
    });

    $('#verifyCodeModal').on('hidden.bs.modal', function() {
        $('#verifyCodeForm')[0].reset();
        $('#verifyCodeAlert').empty();
    });

    $('#newPasswordModal').on('hidden.bs.modal', function() {
        $('#newPasswordForm')[0].reset();
        $('#newPasswordAlert').empty();
        recoveryEmail = '';
    });

    // Función para procesar reserva temporal después del login
    async function procesarReservaTemporal(clienteId, reservaData) {
        try {
            const clienteNombre = localStorage.getItem('clienteNombre') || 'Cliente';
            showWelcomeMessage(clienteNombre, 'Cliente - Procesando reserva...');
            
            const datosReserva = {
                id_cliente: clienteId,
                ...reservaData
            };
            
            const response = await fetch(`${API_URL}/api/reservar-cita`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosReserva)
            });
            
            if (response.ok) {
                const resultado = await response.json();
                // Limpiar datos temporales
                localStorage.removeItem('reservaTemporalData');
                
                showSuccess('¡Cita reservada exitosamente! Recibirás una confirmación por email.');
                setTimeout(() => {
                    window.location.href = 'usuario.html';
                }, 2000);
            } else {
                const error = await response.json();
                showError(`Error al reservar la cita: ${error.error || 'Error desconocido'}`);
                setTimeout(() => {
                    window.location.href = 'usuario.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Error al procesar reserva temporal:', error);
            showError('Error de conexión al procesar la reserva. Por favor, intente nuevamente desde su panel de usuario.');
            setTimeout(() => {
                window.location.href = 'usuario.html';
            }, 2000);
        }
    }
});