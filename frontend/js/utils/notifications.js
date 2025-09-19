// Sistema de notificaciones moderno y profesional
function showNotification(message, type = 'success', title = null) {
    // Crear contenedor si no existe
    let container = document.getElementById('notificationsContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }

    // Crear notificación moderna
    const notification = document.createElement('div');
    notification.className = `modern-notification ${type}`;
    
    // Iconos según el tipo
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-triangle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    // Títulos por defecto
    const defaultTitles = {
        success: '¡Éxito!',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información'
    };

    const finalTitle = title || defaultTitles[type];
    const icon = icons[type] || icons.info;

    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            <div>
                <div class="notification-title">${finalTitle}</div>
                <div class="notification-message">${message}</div>
            </div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
        <div class="notification-progress"></div>
    `;

    container.appendChild(notification);

    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);

    return notification;
}

// Función para mostrar mensajes de error con diseño profesional
function showError(message, title = null) {
    console.error(message);
    
    // Crear contenedor de toasts si no existe
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Crear toast moderno
    const toast = document.createElement('div');
    toast.className = 'modern-toast error';
    
    const finalTitle = title || 'Error';
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div>
                <div class="toast-title">${finalTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Auto cerrar después de 6 segundos para errores
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 6000);

    return toast;
}

// Función para mostrar mensajes de éxito
function showSuccess(message, title = null) {
    return showNotification(message, 'success', title);
}

// Función para mostrar mensajes de advertencia
function showWarning(message, title = null) {
    return showNotification(message, 'warning', title);
}

// Función para mostrar mensajes informativos
function showInfo(message, title = null) {
    return showNotification(message, 'info', title);
}

// Función para mostrar confirmación con callback
function showConfirmation(message, title = 'Confirmación', onConfirm = null, onCancel = null) {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    modal.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <i class="fas fa-question-circle" style="color: #f39c12; font-size: 24px; margin-right: 12px;"></i>
            <h4 style="margin: 0; color: #333; font-weight: 600;">${title}</h4>
        </div>
        <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn-cancel" style="
                padding: 8px 16px;
                border: 1px solid #ddd;
                background: white;
                color: #666;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            ">Cancelar</button>
            <button class="btn-confirm" style="
                padding: 8px 16px;
                border: none;
                background: #dc3545;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            ">Confirmar</button>
        </div>
    `;

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .btn-cancel:hover {
            background: #f8f9fa !important;
            border-color: #adb5bd !important;
        }
        .btn-confirm:hover {
            background: #c82333 !important;
        }
    `;
    document.head.appendChild(style);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    const btnCancel = modal.querySelector('.btn-cancel');
    const btnConfirm = modal.querySelector('.btn-confirm');

    const closeModal = () => {
        overlay.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
            style.remove();
        }, 300);
    };

    btnCancel.addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
    });

    btnConfirm.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });

    // Cerrar con ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            if (onCancel) onCancel();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);

    // Cerrar al hacer click en el overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
            if (onCancel) onCancel();
        }
    });

    return overlay;
}

// Cargar notificaciones reales desde el backend
window.loadNotifications = async function() {
    try {
        const response = await fetch('http://localhost:5000/api/notificaciones');
        if (!response.ok) throw new Error('No se pudieron cargar las notificaciones');
        const notifications = await response.json();
        
        // Transformar las notificaciones del backend al formato esperado por el frontend
        window.notifications = notifications.map(notif => ({
            id: notif.id_notificacion,
            message: notif.mensaje,
            date: new Date(notif.fecha).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            read: notif.leida === 1,
            type: notif.tipo || 'info',
            admin_id: notif.id_admin,
            client_id: notif.id_cliente
        }));
        
        updateNotificationCount();
        updateNotificationsList();
        
        // Mostrar notificaciones no leídas como toast
        const unreadNotifications = window.notifications.filter(n => !n.read);
        if (unreadNotifications.length > 0) {
            showInfo(`Tienes ${unreadNotifications.length} notificación(es) nueva(s)`);
        }
        
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        window.notifications = [];
        updateNotificationCount();
        updateNotificationsList();
    }
}

function updateNotificationCount() {
    const notifications = window.notifications || [];
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    if (badge) badge.textContent = unreadCount;
}

// Función para marcar una notificación como leída
window.markNotificationAsRead = async function(notificationId) {
    try {
        const response = await fetch(`http://localhost:5000/api/notificaciones/${notificationId}/marcar-leida`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Actualizar el estado local
            const notification = window.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                updateNotificationCount();
                updateNotificationsList();
            }
        }
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
};

// Función para crear una nueva notificación
window.createNotification = async function(mensaje, tipo = 'info', id_admin = null, id_cliente = null) {
    try {
        const response = await fetch('http://localhost:5000/api/notificaciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mensaje,
                tipo,
                id_admin,
                id_cliente
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            // Recargar notificaciones para mostrar la nueva
            await loadNotifications();
            return result;
        }
    } catch (error) {
        console.error('Error al crear notificación:', error);
    }
};

function updateNotificationsList() {
    const notifications = window.notifications || [];
    const list = document.getElementById('notificationsList');
    if (!list) return;
    list.innerHTML = '';
    if (notifications.length === 0) {
        list.innerHTML = '<p class="text-center text-muted">No hay notificaciones</p>';
        return;
    }
    notifications.forEach(notification => {
        const div = document.createElement('div');
        div.className = `notification-item ${notification.read ? 'read' : 'unread'} p-2 border-bottom`;
        div.style.cursor = 'pointer';
        div.onclick = () => markNotificationAsRead(notification.id);
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <p class="mb-1">${notification.message || notification.mensaje || ''}</p>
                <small class="text-muted">${notification.date || notification.fecha || ''}</small>
            </div>
            <div class="notification-type">
                <span class="badge bg-${notification.type === 'error' ? 'danger' : notification.type === 'warning' ? 'warning' : notification.type === 'success' ? 'success' : 'info'}">${notification.type}</span>
            </div>
        `;
        list.appendChild(div);
    });
}

window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.showConfirmation = showConfirmation;