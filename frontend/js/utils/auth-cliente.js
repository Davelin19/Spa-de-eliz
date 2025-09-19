// Función para verificar si el cliente está autenticado
function checkClientAuth() {
    const clienteData = sessionStorage.getItem('clienteData');
    if (!clienteData) {
        window.location.replace('login.html');
        return false;
    }
    return true;
}

// Función para cerrar sesión del cliente
function logoutCliente() {
    sessionStorage.removeItem('clienteData');
    window.location.replace('index.html');
}

// Función para obtener los datos del cliente actual
function getCurrentCliente() {
    const clienteData = sessionStorage.getItem('clienteData');
    return clienteData ? JSON.parse(clienteData) : null;
}

// Función para verificar si el cliente está autenticado al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    // No verificar en las páginas de login o index
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('index.html')) {
        checkClientAuth();
    }
});

// Función para inicializar el botón de logout del cliente
function initClientLogoutButton() {
    const logoutBtn = document.getElementById('logoutClienteBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Usar la nueva función de confirmación
            if (typeof window.showConfirmation === 'function') {
                window.showConfirmation(
                    '¿Está seguro que desea cerrar sesión?',
                    'Confirmar cierre de sesión',
                    function() {
                        // Confirmar - proceder con logout
                        logoutCliente();
                    },
                    function() {
                        // Cancelar - no hacer nada
                        console.log('Logout cancelado');
                    }
                );
            } else {
                // Fallback al método anterior
                showWarning('¿Está seguro que desea cerrar sesión?', 'Confirmar cierre de sesión');
                setTimeout(() => logoutCliente(), 2000);
            }
        });
    }
}

// Make functions globally available
window.checkClientAuth = checkClientAuth;
window.logoutCliente = logoutCliente;
window.getCurrentCliente = getCurrentCliente;
window.initClientLogoutButton = initClientLogoutButton;