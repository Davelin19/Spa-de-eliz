// Función para verificar si el usuario está autenticado
function checkAuth() {
    const adminData = sessionStorage.getItem('adminData');
    if (!adminData) {
        window.location.replace('login.html');
        return false;
    }
    return true;
}

// Función para cerrar sesión
function logout() {
    sessionStorage.removeItem('adminData');
    window.location.replace('index.html');
}

// Función para obtener los datos del administrador actual
function getCurrentAdmin() {
    const adminData = sessionStorage.getItem('adminData');
    return adminData ? JSON.parse(adminData) : null;
}

// Función para verificar si el usuario está autenticado al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    // No verificar en la página de login
    if (!window.location.pathname.includes('login.html')) {
        checkAuth();
    }
});

// Función para inicializar el botón de logout
function initLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
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
                        logout();
                    },
                    function() {
                        // Cancelar - no hacer nada
                        console.log('Logout cancelado');
                    }
                );
            } else {
                // Fallback al método anterior
                showWarning('¿Está seguro que desea cerrar sesión?', 'Confirmar cierre de sesión');
                setTimeout(() => logout(), 2000);
            }
        });
    }
}

// Make functions globally available
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentAdmin = getCurrentAdmin;
window.initLogoutButton = initLogoutButton;