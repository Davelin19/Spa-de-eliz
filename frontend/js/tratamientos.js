// import { showSuccess, showError } from './utils/notifications.js';

let tratamientosTable;

// Initialize DataTable
$(document).ready(function () {
    // Cargar datos
    async function loadData() {
        try {
            console.log('Iniciando carga de tratamientos...');
            const response = await fetch(`${API_URL}/api/tratamientos`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('Respuesta de tratamientos:', result);
            
            // Extraer datos de la respuesta
            const tratamientos = (result && result.success && Array.isArray(result.data)) ? result.data : [];
            console.log('Tratamientos cargados:', tratamientos);

            // Destruir la tabla existente si existe
            if ($.fn.DataTable.isDataTable('#tratamientosTable')) {
                try {
                    $('#tratamientosTable').DataTable().destroy();
                } catch (error) {
                    console.warn('Error al destruir DataTable:', error);
                }
            }

            // Verificar si la tabla ya está inicializada
            if (!$.fn.DataTable.isDataTable('#tratamientosTable')) {
                // Limpiar el contenido de la tabla solo si no está inicializada
                $('#tratamientosTable tbody').empty();

                // Verificar que tenemos datos válidos
                console.log('Datos de tratamientos para DataTable:', tratamientos);

                // Inicializar la tabla con los nuevos datos
                tratamientosTable = $('#tratamientosTable').DataTable({
                    data: tratamientos,
                    retrieve: true, // Permite reutilizar la instancia existente
                    destroy: false, // No destruir automáticamente
                    columns: [
                        { 
                            data: 'id_tratamiento',
                            defaultContent: 'N/A'
                        },
                        { 
                            data: 'nombre',
                            defaultContent: 'Sin nombre'
                        },
                        { 
                            data: 'descripcion',
                            defaultContent: 'Sin descripción'
                        },
                        {
                            data: 'duracion',
                            defaultContent: 'N/A',
                            render: function (data) {
                                if (!data) return 'N/A';
                                return data + ' min';
                            }
                        },
                        {
                            data: 'precio',
                            defaultContent: 'N/A',
                            render: function (data) {
                                if (!data) return 'N/A';
                                return '$' + parseFloat(data).toFixed(2);
                            }
                        },
                        {
                            data: 'estado',
                            defaultContent: 'N/A',
                            render: function (data) {
                                if (!data) return '<span class="badge badge-secondary">N/A</span>';
                                let estadoClass = data === 'activo' ? 'success' : 'danger';
                                let icon = data === 'activo' ? 'check-circle' : 'times-circle';
                                let label = data.charAt(0).toUpperCase() + data.slice(1);
                                return `<span class="badge badge-${estadoClass}"><i class="fas fa-${icon} mr-1"></i>${label}</span>`;
                            }
                        },
                        {
                            data: null,
                            defaultContent: '',
                            orderable: false,
                            searchable: false,
                            render: function (data, type, row) {
                                if (!row || !row.id_tratamiento) return '';
                                return `<div class="btn-group">
                                    <button class="btn btn-sm btn-info view-btn" data-id="${row.id_tratamiento}" title="Ver detalles">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-primary edit-btn" data-id="${row.id_tratamiento}" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id_tratamiento}" title="Eliminar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>`;
                            }
                        }
                    ],
                    order: [[1, 'asc']], // Ordenar por nombre ascendente
                    ...DATATABLES_CONFIG
                });
            } else {
                // Si ya está inicializada, solo actualizar los datos
                tratamientosTable = $('#tratamientosTable').DataTable();
                tratamientosTable.clear().rows.add(tratamientos).draw();
            }

            // Actualizar estadísticas
            const total = tratamientos.length;
            const activos = tratamientos.filter(t => t.estado === 'activo').length;
            const inactivos = tratamientos.filter(t => t.estado === 'inactivo').length;
            const sumaPrecios = tratamientos.reduce((sum, t) => sum + (parseFloat(t.precio) || 0), 0);

            $('#totalTratamientos').text(total);
            $('#tratamientosActivos').text(activos);
            $('#tratamientosInactivos').text(inactivos);
            $('#sumaPrecios').text(`$${sumaPrecios.toFixed(2)}`);

        } catch (error) {
            console.error('Error al cargar tratamientos:', error);
            showError('Error al cargar los tratamientos');
        }
    }

    // Guardar tratamiento
    async function saveTratamiento(data) {
        try {
            const url = data.id_tratamiento ?
                `${API_URL}/api/tratamientos/${data.id_tratamiento}` :
                `${API_URL}/api/tratamientos`;

            const method = data.id_tratamiento ? 'PUT' : 'POST';

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
            showSuccess(data.id_tratamiento ? 'Tratamiento actualizado correctamente' : 'Tratamiento creado correctamente');
            $('#tratamientoModal').modal('hide');
            loadData();
            return result;
        } catch (error) {
            console.error('Error al guardar tratamiento:', error);
            showError('Error al guardar el tratamiento');
            throw error;
        }
    }

    // Eliminar tratamiento
    async function deleteTratamiento(id) {
        try {
            const response = await fetch(`${API_URL}/api/tratamientos/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            showSuccess('Tratamiento eliminado correctamente');
            loadData();
        } catch (error) {
            console.error('Error al eliminar tratamiento:', error);
            showError('Error al eliminar el tratamiento');
        }
    }

    // Event Listeners
    $('#saveTratamiento').click(async function () {
        const formData = {
            nombre: $('#nombre').val(),
            descripcion: $('#descripcion').val(),
            duracion: $('#duracion').val(),
            precio: $('#precio').val(),
            estado: $('#estado').val()
        };
        try {
            await saveTratamiento(formData);
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    });

    // Guardar tratamiento (Editar)
    $('#updateTratamiento').click(async function () {
        const formData = {
            id_tratamiento: $('#editar_id_tratamiento').val(),
            nombre: $('#editar_nombre').val(),
            descripcion: $('#editar_descripcion').val(),
            duracion: $('#editar_duracion').val(),
            precio: $('#editar_precio').val(),
            estado: $('#editar_estado').val()
        };
        try {
            await saveTratamiento(formData);
            $('#editarTratamientoModal').modal('hide');
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    });

    // Editar tratamiento (abrir modal y cargar datos)
    $(document).on('click', '.edit-btn', async function () {
        const id = $(this).data('id');
        try {
            const response = await fetch(`${API_URL}/api/tratamientos/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tratamiento = await response.json();
            $('#editar_id_tratamiento').val(tratamiento.id_tratamiento);
            $('#editar_nombre').val(tratamiento.nombre);
            $('#editar_descripcion').val(tratamiento.descripcion);
            $('#editar_duracion').val(tratamiento.duracion);
            $('#editar_precio').val(tratamiento.precio);
            $('#editar_estado').val(tratamiento.estado);
            $('#editarTratamientoModalLabel').text('Editar Tratamiento: ' + tratamiento.nombre);
            $('#editarTratamientoModal').modal('show');
        } catch (error) {
            console.error('Error al cargar tratamiento:', error);
            showError('Error al cargar los datos del tratamiento');
        }
    });

    // Eliminar tratamiento
    $(document).on('click', '.delete-btn', function () {
        const id = $(this).data('id');
        showConfirm('¿Está seguro que desea eliminar este tratamiento?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar')
            .then((result) => {
                if (result.isConfirmed) {
                    deleteTratamiento(id);
                }
            });
    });

    // Limpiar formulario solo si es NUEVO tratamiento
    $('button[data-target="#tratamientoModal"]').click(function () {
        $('#tratamientoForm')[0].reset();
        $('#id_tratamiento').val('');
        $('#tratamientoModalLabel').text('Nuevo Tratamiento');
    });

    // Buscar tratamiento por ID y mostrar detalles
    $('#btnBuscarIdTratamiento').click(async function () {
        const id = $('#buscarIdTratamiento').val();
        if (!id) {
            showError('Por favor ingresa un ID');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/tratamientos/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.error || 'Tratamiento no encontrado');
                return;
            }
            const tratamiento = await response.json();
            // Muestra los datos en el modal de detalles (solo lectura)
            $('#detalle_id_tratamiento').text(tratamiento.id_tratamiento);
            $('#detalle_nombre').text(tratamiento.nombre);
            $('#detalle_descripcion').text(tratamiento.descripcion);
            $('#detalle_duracion').text(tratamiento.duracion + ' min');
            $('#detalle_precio').text('$' + parseFloat(tratamiento.precio).toFixed(2));
            $('#detalle_estado').text(tratamiento.estado);
            $('#detalleTratamientoModalLabel').text('Detalles del Tratamiento: ' + tratamiento.nombre);
            $('#detalleTratamientoModal').modal('show');
        } catch (error) {
            showError('Error al buscar el tratamiento');
        }
    });

    // Quitar foco del botón al cerrar el modal de edición para evitar advertencia de accesibilidad
    $('#editarTratamientoModal').on('hidden.bs.modal', function () {
        $('#updateTratamiento').blur();
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

    // Nuevo evento para editar tratamiento
    $(document).on('click', '.btn-edit-tratamiento', function() {
        const id = $(this).data('id');
        const tratamiento = tratamientos.find(t => t.id_tratamiento == id);
        if (tratamiento) {
            $('#edit_id_tratamiento').val(tratamiento.id_tratamiento);
            $('#edit_nombre_tratamiento').val(tratamiento.nombre);
            $('#edit_descripcion').val(tratamiento.descripcion);
            $('#edit_duracion').val(tratamiento.duracion);
            $('#edit_precio').val(tratamiento.precio);
            $('#edit_estado_tratamiento').val(tratamiento.estado);
            $('#modalEditarTratamiento').modal('show');
        }
    });
});