document.addEventListener('DOMContentLoaded', function () {
    // Cargar el sidebar
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) {
        sidebarPlaceholder.innerHTML = `
            <nav class="col-md-2 d-none d-md-block sidebar">
                <div class="sidebar-sticky">
                    <div class="text-center py-4">
                        <img src="img/logo.png" alt="Armony Stetic Logo" class="img-fluid mb-2" style="max-width: 120px;">
                        <h4 class="brand-text">Armony Stetic</h4>
                    </div>
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link" href="index.html">
                                <i class="fas fa-home"></i> Inicio
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="clientes.html">
                                <i class="fas fa-users"></i> Clientes
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="tratamientos.html">
                                <i class="fas fa-spa"></i> Tratamientos
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="citas.html">
                                <i class="fas fa-calendar-alt"></i> Citas
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="servicios.html">
                                <i class="fas fa-concierge-bell"></i> Servicios
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="reportes.html">
                                <i class="fas fa-chart-bar"></i> Reportes
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="facturas.html">
                                <i class="fas fa-file-invoice-dollar"></i> Facturas
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="administradores.html">
                                <i class="fas fa-user-shield"></i> Administradores
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
        `;
    }

    // Cargar la barra de navegación
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        navbarPlaceholder.innerHTML = `
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu">
                <i class="fas fa-bars"></i>
            </button>
            <div class="ms-auto d-flex align-items-center">
                <div class="dropdown me-3">
                    <button class="btn btn-link position-relative" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-bell"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            3
                        </span>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end" id="notifications-dropdown">
                        <h6 class="dropdown-header">Notificaciones</h6>
                        <div id="notifications-list">
                            <!-- Las notificaciones se cargarán dinámicamente aquí -->
                        </div>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item text-center" href="#" id="mark-all-read">Marcar todas como leídas</a>
                    </div>
                </div>
                <div class="dropdown">
                    <button class="btn btn-link dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end">
                        <a class="dropdown-item" href="#">
                            <i class="fas fa-user"></i> Perfil
                        </a>
                        <a class="dropdown-item" href="#">
                            <i class="fas fa-cog"></i> Configuración
                        </a>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item" href="login.html">
                            <i class="fas fa-sign-out-alt"></i> Cerrar sesión
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Marcar la página actual como activa
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.nav-link');
    menuItems.forEach(item => {
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });

    // Cargar notificaciones dinámicamente
    function loadNotifications() {
        fetch('/api/notificaciones')
            .then(response => response.json())
            .then(data => {
                const notificationsList = document.getElementById('notifications-list');
                const notificationBadge = document.querySelector('.badge.bg-danger');
                
                if (notificationsList) {
                    if (data.length === 0) {
                        notificationsList.innerHTML = '<div class="dropdown-item text-muted">No hay notificaciones</div>';
                        if (notificationBadge) notificationBadge.style.display = 'none';
                    } else {
                        notificationsList.innerHTML = data.map(notification => {
                            const isUnread = !notification.leida;
                            const bgClass = isUnread ? 'bg-light' : '';
                            return `
                                <div class="dropdown-item notification-item ${bgClass}" data-id="${notification.id}">
                                    <div class="d-flex align-items-start">
                                        <i class="fas fa-${getNotificationIcon(notification.tipo)} me-2 mt-1"></i>
                                        <div class="flex-grow-1">
                                            <div class="fw-bold">${notification.mensaje}</div>
                                            <small class="text-muted">${formatDate(notification.fecha)}</small>
                                        </div>
                                        ${isUnread ? '<span class="badge bg-primary ms-2">Nuevo</span>' : ''}
                                    </div>
                                </div>
                            `;
                        }).join('');
                        
                        const unreadCount = data.filter(n => !n.leida).length;
                        if (notificationBadge) {
                            if (unreadCount > 0) {
                                notificationBadge.textContent = unreadCount;
                                notificationBadge.style.display = 'block';
                            } else {
                                notificationBadge.style.display = 'none';
                            }
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error al cargar notificaciones:', error);
                const notificationsList = document.getElementById('notifications-list');
                if (notificationsList) {
                    notificationsList.innerHTML = '<div class="dropdown-item text-danger">Error al cargar notificaciones</div>';
                }
            });
    }

    function getNotificationIcon(tipo) {
        switch(tipo) {
            case 'info': return 'info-circle';
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'error': return 'times-circle';
            default: return 'bell';
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return date.toLocaleDateString();
    }

    // Marcar todas como leídas
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fetch('/api/notificaciones/marcar-leidas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadNotifications();
                }
            })
            .catch(error => console.error('Error al marcar notificaciones como leídas:', error));
        });
    }

    // Cargar notificaciones al inicio
    loadNotifications();

    // Recargar notificaciones cada 30 segundos
    setInterval(loadNotifications, 30000);
});