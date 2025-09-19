// import { showSuccess, showError } from './utils/notifications.js';

let administradoresTable;

// Initialize DataTable
$(document).ready(function () {
    // Cargar datos
    async function loadData() {
        try {
            console.log('Iniciando carga de administradores...');
            const response = await fetch(`${API_URL}/api/administradores`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const administradores = await response.json();
            console.log('Administradores cargados:', administradores);

            // Destruir la tabla existente si existe
            if ($.fn.DataTable.isDataTable('#administradoresTable')) {
                try {
                    $('#administradoresTable').DataTable().destroy();
                } catch (error) {
                    console.warn('Error al destruir DataTable:', error);
                }
            }

            // Limpiar el contenido de la tabla
            $('#administradoresTable tbody').empty();

            // Reinicializar la tabla con los nuevos datos
            administradoresTable = $('#administradoresTable').DataTable({
                data: administradores,
                columns: [
                    { data: 'id_admin' },
                    { data: 'nombre' },
                    { data: 'email' },
                    { data: 'telefono' },
                    {
                        data: 'estado',
                        render: function (data) {
                            const estadoClass = data === 'activo' ? 'success' : 'danger';
                            const icon = data === 'activo' ? 'check-circle' : 'times-circle';
                            return `<span class="badge badge-${estadoClass}"><i class="fas fa-${icon} mr-1"></i>${data.charAt(0).toUpperCase() + data.slice(1)}</span>`;
                        }
                    },
                    {
                        data: null,
                        orderable: false,
                        searchable: false,
                        render: function (data, type, row) {
                            return `<div class="btn-group">
                                <button class="btn btn-sm btn-info view-btn" data-id="${row.id_admin}" title="Ver detalles"><i class="fas fa-eye"></i></button>
                                <button class="btn btn-sm btn-primary edit-btn" data-id="${row.id_admin}" title="Editar"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id_admin}" title="Eliminar"><i class="fas fa-trash"></i></button>
                            </div>`;
                        }
                    }
                ],
                order: [[1, 'asc']], // Ordenar por nombre
                ...DATATABLES_CONFIG
            });

            // Actualizar estadísticas
            const total = administradores.length;
            const activos = administradores.filter(a => a.estado === 'activo').length;
            const inactivos = administradores.filter(a => a.estado === 'inactivo').length;

            $('#totalAdministradores').text(total);
            $('#administradoresActivos').text(activos);
            $('#administradoresInactivos').text(inactivos);

        } catch (error) {
            console.error('Error al cargar administradores:', error);
            // showError('Error al cargar los administradores');
        }
    }

    // Guardar administrador
    async function saveAdministrador(data) {
        try {
            const url = data.id_admin ?
                `${API_URL}/api/administradores/${data.id_admin}` :
                `${API_URL}/api/administradores`;

            const method = data.id_admin ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            // showSuccess(data.id_admin ? 'Administrador actualizado correctamente' : 'Administrador creado correctamente');
            $('#administradorModal').modal('hide');
            loadData();
            return result;
        } catch (error) {
            console.error('Error al guardar administrador:', error);
            // showError('Error al guardar el administrador');
            throw error;
        }
    }

    // Eliminar administrador
    async function deleteAdministrador(id) {
        try {
            const response = await fetch(`${API_URL}/api/administradores/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // showSuccess('Administrador eliminado correctamente');
            loadData();
        } catch (error) {
            console.error('Error al eliminar administrador:', error);
            // showError('Error al eliminar el administrador');
        }
    }

    // Guardar administrador (Agregar)
    $('#saveAdministrador').click(async function () {
        const formData = {
            nombre: $('#nombre').val(),
            email: $('#email').val(),
            telefono: $('#telefono').val(),
            estado: $('#estado').val(),
            contrasena: $('#contrasena').val()
        };
        try {
            await saveAdministrador(formData);
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    });

    // Editar administrador (abrir modal de editar y llenar campos)
    $(document).on('click', '.edit-btn', async function () {
        const id = $(this).data('id');
        try {
            const response = await fetch(`${API_URL}/api/administradores/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const administrador = await response.json();
            $('#editar_id_admin').val(administrador.id_admin);
            $('#editar_nombre').val(administrador.nombre);
            $('#editar_email').val(administrador.email);
            $('#editar_telefono').val(administrador.telefono);
            $('#editar_estado').val(administrador.estado);
            $('#editar_contrasena').val('');
            $('#editarAdminModal').modal('show');
        } catch (error) {
            console.error('Error al cargar administrador:', error);
        }
    });

    // Guardar cambios al editar
    $('#updateAdministrador').click(async function () {
        const formData = {
            id_admin: $('#editar_id_admin').val(),
            nombre: $('#editar_nombre').val(),
            email: $('#editar_email').val(),
            telefono: $('#editar_telefono').val(),
            estado: $('#editar_estado').val()
        };
        const contrasena = $('#editar_contrasena').val();
        if (contrasena) {
            formData.contrasena = contrasena;
        }
        try {
            await saveAdministrador(formData);
            $('#editarAdminModal').modal('hide');
        } catch (error) {
            console.error('Error al actualizar:', error);
        }
    });

    // Eliminar administrador
    $(document).on('click', '.delete-btn', function () {
        const id = $(this).data('id');
        showConfirm('¿Está seguro que desea eliminar este administrador?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar')
            .then((result) => {
                if (result.isConfirmed) {
                    deleteAdministrador(id);
                }
            });
    });

    // Limpiar formulario al abrir modal de agregar
    $('#administradorModal').on('show.bs.modal', function (e) {
        $('#administradorForm')[0].reset();
        $('#id_admin').val('');
        $('#administradorModalLabel').html('<i class="fas fa-user-plus mr-2" id="adminModalIcon"></i>Nuevo Administrador');
        $('#adminModalHeader').removeClass('bg-warning').addClass('bg-primary');
        $('#administradorModalLabel').removeClass('text-dark').addClass('text-white');
        $('#saveAdministrador').text('Guardar');
        $('#contrasena').prop('required', true);
    });

    // Buscar administrador por ID y mostrar detalles
    $('#btnBuscarIdAdmin').click(async function () {
        const id = $('#buscarIdAdmin').val();
        if (!id) {
            showError('Por favor, ingrese un ID de administrador');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/administradores/${id}`);
            if (!response.ok) {
                showError('Administrador no encontrado');
                return;
            }
            const admin = await response.json();
            $('#detalle_id_admin').text(admin.id_admin);
            $('#detalle_nombre').text(admin.nombre);
            $('#detalle_email').text(admin.email);
            $('#detalle_telefono').text(admin.telefono);
            $('#detalle_estado').text(admin.estado);
            $('#detalleAdminModal').modal('show');
        } catch (error) {
            showError('Error al buscar el administrador');
        }
    });

    // Mostrar detalles desde botón en la tabla
    $(document).on('click', '.details-btn', async function () {
        const id = $(this).data('id');
        try {
            const response = await fetch(`${API_URL}/api/administradores/${id}`);
            if (!response.ok) {
                showError('Administrador no encontrado');
                return;
            }
            const admin = await response.json();
            $('#detalle_id_admin').text(admin.id_admin);
            $('#detalle_nombre').text(admin.nombre);
            $('#detalle_email').text(admin.email);
            $('#detalle_telefono').text(admin.telefono);
            $('#detalle_estado').text(admin.estado);
            $('#detalleAdminModal').modal('show');
        } catch (error) {
            showError('Error al buscar el administrador');
        }
    });

    // Cargar datos iniciales
    loadData();

    // Hacer las funciones globales para notificaciones
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
        
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        window.notifications = [];
        updateNotificationCount();
        updateNotificationsList();
    }
};

window.updateNotificationCount = function() {
    const notifications = window.notifications || [];
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    if (badge) badge.textContent = unreadCount;
};

window.updateNotificationsList = function() {
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
                <p class="mb-1">${notification.message}</p>
                <small class="text-muted">${notification.date}</small>
            </div>
            <div class="notification-type">
                <span class="badge bg-${notification.type === 'error' ? 'danger' : notification.type === 'warning' ? 'warning' : notification.type === 'success' ? 'success' : 'info'}">${notification.type}</span>
            </div>
        `;
        list.appendChild(div);
    });
};

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

    // Nuevo código para el nuevo botón de editar
    $(document).on('click', '.btn-edit-admin', function() {
        const id = $(this).data('id');
        const admin = administradores.find(a => a.id_admin == id);
        if (admin) {
            $('#edit_id_admin').val(admin.id_admin);
            $('#edit_nombre_admin').val(admin.nombre);
            $('#edit_email_admin').val(admin.email);
            $('#edit_telefono_admin').val(admin.telefono);
            $('#edit_estado_admin').val(admin.estado);
            $('#modalEditarAdmin').modal('show');
        }
    });
});