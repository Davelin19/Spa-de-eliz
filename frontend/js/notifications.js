// Sistema de notificaciones para la aplicación

// Función especial para mostrar mensaje de bienvenida con estilo mejorado
function showWelcomeMessage(userName, userType = 'Cliente') {
    // Crear contenedor especial para mensaje de bienvenida si no existe
    if (!document.getElementById('welcome-container')) {
        const container = document.createElement('div');
        container.id = 'welcome-container';
        container.className = 'welcome-container position-fixed';
        container.style.cssText = `
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const welcomeContainer = document.getElementById('welcome-container');
    const welcomeId = 'welcome-' + Date.now();
    
    // Crear el mensaje de bienvenida con animación
    const welcomeHtml = `
        <div id="${welcomeId}" class="welcome-message">
            <div class="welcome-card">
                <div class="welcome-icon">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="welcome-content">
                    <h3 class="welcome-title">¡Bienvenido/a!</h3>
                    <p class="welcome-subtitle">${userName}</p>
                    <div class="welcome-badge">${userType}</div>
                </div>
                <div class="welcome-animation">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar estilos CSS si no existen
    if (!document.getElementById('welcome-styles')) {
        const styles = document.createElement('style');
        styles.id = 'welcome-styles';
        styles.textContent = `
            .welcome-message {
                animation: welcomeSlideIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                pointer-events: auto;
            }
            
            .welcome-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                color: white;
                position: relative;
                overflow: hidden;
                min-width: 300px;
                backdrop-filter: blur(10px);
            }
            
            .welcome-icon {
                font-size: 3rem;
                margin-bottom: 15px;
                animation: welcomeIconBounce 1s ease-in-out 0.3s;
            }
            
            .welcome-title {
                font-size: 1.8rem;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .welcome-subtitle {
                font-size: 1.2rem;
                margin-bottom: 15px;
                opacity: 0.9;
            }
            
            .welcome-badge {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 8px 16px;
                border-radius: 25px;
                font-size: 0.9rem;
                font-weight: 600;
                border: 1px solid rgba(255,255,255,0.3);
            }
            
            .welcome-animation .particle {
                position: absolute;
                width: 6px;
                height: 6px;
                background: rgba(255,255,255,0.6);
                border-radius: 50%;
                animation: welcomeParticle 2s infinite;
            }
            
            .welcome-animation .particle:nth-child(1) {
                top: 20%;
                left: 20%;
                animation-delay: 0s;
            }
            
            .welcome-animation .particle:nth-child(2) {
                top: 60%;
                right: 20%;
                animation-delay: 0.7s;
            }
            
            .welcome-animation .particle:nth-child(3) {
                bottom: 20%;
                left: 50%;
                animation-delay: 1.4s;
            }
            
            @keyframes welcomeSlideIn {
                0% {
                    opacity: 0;
                    transform: scale(0.3) translateY(-100px);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.05) translateY(0);
                }
                100% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            @keyframes welcomeIconBounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                60% {
                    transform: translateY(-5px);
                }
            }
            
            @keyframes welcomeParticle {
                0%, 100% {
                    opacity: 0;
                    transform: translateY(0) scale(0);
                }
                50% {
                    opacity: 1;
                    transform: translateY(-20px) scale(1);
                }
            }
            
            @keyframes welcomeFadeOut {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.8);
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    welcomeContainer.innerHTML = welcomeHtml;
    
    // Auto-ocultar después de 4 segundos con animación
    setTimeout(() => {
        const welcomeElement = document.getElementById(welcomeId);
        if (welcomeElement) {
            welcomeElement.style.animation = 'welcomeFadeOut 0.5s ease-in-out forwards';
            setTimeout(() => {
                welcomeElement.remove();
            }, 500);
        }
    }, 4000);
    
    return welcomeId;
}

// Función para mostrar notificaciones toast
function showToast(type, title, message, duration = 5000) {
    // Crear contenedor de toasts si no existe
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const toastContainer = document.getElementById('toast-container');
    const toastId = 'toast-' + Date.now();
    
    // Determinar colores según el tipo
    let bgClass, iconClass, textClass;
    switch(type) {
        case 'success':
            bgClass = 'bg-success';
            iconClass = 'fas fa-check-circle';
            textClass = 'text-white';
            break;
        case 'error':
        case 'danger':
            bgClass = 'bg-danger';
            iconClass = 'fas fa-exclamation-triangle';
            textClass = 'text-white';
            break;
        case 'warning':
            bgClass = 'bg-warning';
            iconClass = 'fas fa-exclamation-circle';
            textClass = 'text-dark';
            break;
        case 'info':
            bgClass = 'bg-info';
            iconClass = 'fas fa-info-circle';
            textClass = 'text-white';
            break;
        default:
            bgClass = 'bg-primary';
            iconClass = 'fas fa-bell';
            textClass = 'text-white';
    }
    
    // Crear el toast
    const toastHtml = `
        <div id="${toastId}" class="toast ${bgClass} ${textClass}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} ${textClass} border-0">
                <i class="${iconClass} me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Inicializar y mostrar el toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: duration
    });
    
    toast.show();
    
    // Remover el toast del DOM después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
    
    return toast;
}

// Función para mostrar notificación de éxito
function showSuccess(message, title = 'Éxito') {
    return showToast('success', title, message);
}

// Función para mostrar notificación de error
function showError(message, title = 'Error') {
    return showToast('error', title, message);
}

// Función para mostrar notificación de advertencia
function showWarning(message, title = 'Advertencia') {
    return showToast('warning', title, message);
}

// Función para mostrar notificación de información
function showInfo(message, title = 'Información') {
    return showToast('info', title, message);
}

// Función para mostrar confirmación con SweetAlert2 (si está disponible)
function showConfirm(title, text, confirmButtonText = 'Sí', cancelButtonText = 'No') {
    if (typeof Swal !== 'undefined') {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmButtonText,
            cancelButtonText: cancelButtonText,
            reverseButtons: true
        });
    } else {
        // Fallback a confirm nativo
        return new Promise((resolve) => {
            const result = confirm(title + '\n\n' + text);
            resolve({ isConfirmed: result });
        });
    }
}

// Función para mostrar loading con SweetAlert2 (si está disponible)
function showLoading(title = 'Cargando...', text = 'Por favor espere') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: title,
            text: text,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }
}

// Función para cerrar loading
function hideLoading() {
    if (typeof Swal !== 'undefined') {
        Swal.close();
    }
}

// Función de compatibilidad para mostrar alertas (reemplaza alert nativo)
function showAlert(message, title = 'Aviso', type = 'info') {
    // Mapear tipos comunes
    const typeMap = {
        'success': 'success',
        'error': 'error', 
        'warning': 'warning',
        'info': 'info',
        'danger': 'error'
    };
    
    const finalType = typeMap[type] || 'info';
    return showNotification(message, finalType, title);
}

// Asignar funciones al objeto window para uso global
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.showConfirm = showConfirm;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showAlert = showAlert;
window.showWelcomeMessage = showWelcomeMessage;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de notificaciones inicializado');
});