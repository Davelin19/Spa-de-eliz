// import { showSuccess, showError } from './utils/notifications.js';
// import { API_URL, DATATABLES_CONFIG } from './config.js';

let clientesTable;

// Initialize DataTable
$(document).ready(function () {
    // Cargar datos
    async function loadData() {
        try {
            console.log('Iniciando carga de clientes...');
            const response = await fetch(`${API_URL}/api/clientes`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('Respuesta de clientes:', result);
            
            // Verificar la estructura de la respuesta
            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Estructura de respuesta inválida');
            }
            
            const clientes = result.data;
            console.log('Clientes cargados:', clientes);

            // Destruir la tabla existente si existe
            if ($.fn.DataTable.isDataTable('#clientesTable')) {
                try {
                    $('#clientesTable').DataTable().destroy();
                } catch (error) {
                    console.warn('Error al destruir DataTable:', error);
                }
            }

            // Limpiar el contenido de la tabla
            $('#clientesTable tbody').empty();

            // Reinicializar la tabla con los nuevos datos
            clientesTable = $('#clientesTable').DataTable({
                data: clientes,
                columns: [
                    { data: 'id_cliente' },
                    { data: 'nombre' },
                    { data: 'email' },
                    { data: 'telefono' },
                    { data: 'direccion' },
                    {
                        data: 'estado',
                        render: function (data) {
                            const estadoClass = data === 'activo' ? 'success' : 'danger';
                            const icon = data === 'activo' ? 'check-circle' : 'times-circle';
                            return `<span class="badge badge-${estadoClass}">
                                <i class="fas fa-${icon} mr-1"></i>${data.charAt(0).toUpperCase() + data.slice(1)}
                            </span>`;
                        }
                    },
                    {
                        data: null,
                        orderable: false,
                        searchable: false,
                        render: function (data, type, row) {
                            return `<div class="btn-group">
                                <button class="btn btn-sm btn-info view-btn" data-id="${row.id_cliente}" title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-primary edit-btn" data-id="${row.id_cliente}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id_cliente}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                            </div>`;
                        }
                    }
                ],
                order: [[1, 'asc']], // Ordenar por nombre
                ...DATATABLES_CONFIG
            });

            // Actualizar estadísticas
            const total = clientes.length;
            const activos = clientes.filter(c => c.estado === 'activo').length;
            const inactivos = clientes.filter(c => c.estado === 'inactivo').length;

            $('#totalClientes').text(total);
            $('#clientesActivos').text(activos);
            $('#clientesInactivos').text(inactivos);

        } catch (error) {
            console.error('Error al cargar clientes:', error);
            showError('Error al cargar los clientes');
        }
    }

    // Guardar cliente
    async function saveCliente(data) {
        try {
            const url = data.id_cliente ?
                `${API_URL}/api/clientes/${data.id_cliente}` :
                `${API_URL}/api/clientes`;

            const method = data.id_cliente ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.error || 'Error al guardar el cliente');
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (data.id_cliente) {
                showSuccess('Cliente actualizado correctamente');
                // Crear notificación del sistema
                if (window.createNotification) {
                    window.createNotification(
                        `Cliente ${data.nombre} ha sido actualizado`,
                        'info',
                        1, // ID admin por defecto
                        data.id_cliente
                    );
                }
            } else {
                showSuccess('Cliente creado correctamente');
                // Crear notificación del sistema
                if (window.createNotification) {
                    window.createNotification(
                        `Nuevo cliente registrado: ${data.nombre}`,
                        'success',
                        1, // ID admin por defecto
                        result.id || null
                    );
                }
            }
            $('#clienteModal').modal('hide');
            loadData();
            return result;
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            showError('Error al guardar el cliente');
            throw error;
        }
    }

    // Eliminar cliente
    async function deleteCliente(id) {
        try {
            const response = await fetch(`${API_URL}/api/clientes/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.error || 'Error al eliminar el cliente');
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            showSuccess('Cliente eliminado correctamente');
            // Crear notificación del sistema
            if (window.createNotification) {
                window.createNotification(
                    `Cliente con ID ${id} ha sido eliminado`,
                    'warning',
                    1 // ID admin por defecto
                );
            }
            loadData();
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            showError('Error al eliminar el cliente');
        }
    }

    // Event Listeners
    $('#saveCliente').click(async function () {
        const formData = {
            nombre: $('#nombre').val(),
            email: $('#email').val(),
            telefono: $('#telefono').val(),
            direccion: $('#direccion').val(),
            estado: $('#estado').val()
        };

        const id = $('#id_cliente').val();
        const contrasena = $('#contrasena').val();

        if (id) {
            formData.id_cliente = id;
            if (contrasena) {
                formData.contrasena = contrasena;
            }
        } else {
            formData.contrasena = contrasena;
        }

        try {
            await saveCliente(formData);
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    });

    // Editar cliente
    $(document).on('click', '.edit-btn', async function () {
        const id = $(this).data('id');
        try {
            const response = await fetch(`${API_URL}/api/clientes/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.error || 'Error al cargar los datos del cliente');
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const cliente = await response.json();

            $('#id_cliente').val(cliente.id_cliente);
            $('#nombre').val(cliente.nombre);
            $('#email').val(cliente.email);
            $('#telefono').val(cliente.telefono);
            $('#direccion').val(cliente.direccion);
            $('#estado').val(cliente.estado);
            $('#contrasena').val('');

            $('#clienteModalLabel').text('Editar Cliente: ' + cliente.nombre);
            $('#clienteModal').modal('show');
        } catch (error) {
            console.error('Error al cargar cliente:', error);
            showError('Error al cargar los datos del cliente');
        }
    });

    // Eliminar cliente
    $(document).on('click', '.delete-btn', function () {
        const id = $(this).data('id');
        showConfirm('¿Está seguro que desea eliminar este cliente?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar')
            .then((result) => {
                if (result.isConfirmed) {
                    deleteCliente(id);
                }
            });
    });

    // Limpiar formulario solo si es NUEVO cliente
    $('button[data-target="#clienteModal"]').click(function () {
        $('#clienteForm')[0].reset();
        $('#id_cliente').val('');
        $('#clienteModalLabel').text('Nuevo Cliente');
        $('#contrasena').prop('required', true);
    });

    // Cargar datos iniciales
    loadData();

    // Nuevo evento para buscar cliente por ID
    $('#btnBuscarIdCliente').click(async function () {
        const id = $('#buscarIdCliente').val();
        if (!id) {
            showError('Por favor ingresa un ID');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/clientes/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.error || 'Cliente no encontrado');
                return;
            }
            const cliente = await response.json();
            // Muestra los datos en el modal de detalles (solo lectura)
            $('#detalle_id_cliente').text(cliente.id_cliente);
            $('#detalle_nombre').text(cliente.nombre);
            $('#detalle_email').text(cliente.email);
            $('#detalle_telefono').text(cliente.telefono);
            $('#detalle_direccion').text(cliente.direccion);
            $('#detalle_estado').text(cliente.estado);
            $('#detalleClienteModalLabel').text('Detalles del Cliente: ' + cliente.nombre);
            $('#detalleClienteModal').modal('show');
        } catch (error) {
            showError('Error al buscar el cliente');
        }
    });

    // Funciones de notificaciones
    let notifications = [];

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
});