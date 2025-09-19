let citasTable;
let clientesGlobal = [];
let tratamientosGlobal = [];

// Initialize DataTable
$(document).ready(function () {
    // Cargar datos
    async function loadData() {
        try {
            console.log('Iniciando carga de citas...');
            const [citasResponse, clientesResponse, tratamientosResponse] = await Promise.all([
                fetch(`${API_URL}/api/citas`),
                fetch(`${API_URL}/api/clientes`),
                fetch(`${API_URL}/api/tratamientos`)
            ]);

            if (!citasResponse.ok || !clientesResponse.ok || !tratamientosResponse.ok) {
                throw new Error('Error al cargar los datos');
            }

            const citasResult = await citasResponse.json();
            const clientesResult = await clientesResponse.json();
            const tratamientosResult = await tratamientosResponse.json();

            // Verificar estructura de respuesta y extraer datos
            const citas = (citasResult && citasResult.success && Array.isArray(citasResult.data)) ? citasResult.data : [];
            clientesGlobal = (clientesResult && clientesResult.success && Array.isArray(clientesResult.data)) ? clientesResult.data : [];
            tratamientosGlobal = (tratamientosResult && tratamientosResult.success && Array.isArray(tratamientosResult.data)) ? tratamientosResult.data : [];

            function fillSelects(selectedCliente, selectedTratamiento) {
                const clienteSelect = $('#cliente');
                const tratamientoSelect = $('#tratamiento');
                clienteSelect.empty().append('<option value="">Seleccione un cliente</option>');
                clientesGlobal.forEach(cliente => {
                    clienteSelect.append(`<option value="${cliente.id_cliente}">${cliente.nombre}</option>`);
                });
                tratamientoSelect.empty().append('<option value="">Seleccione un tratamiento</option>');
                tratamientosGlobal.forEach(tratamiento => {
                    if (tratamiento.estado === 'activo') {
                        tratamientoSelect.append(`<option value="${tratamiento.id_tratamiento}">${tratamiento.nombre} - $${parseFloat(tratamiento.precio).toFixed(2)}</option>`);
                    }
                });
                if (selectedCliente) clienteSelect.val(selectedCliente);
                if (selectedTratamiento) tratamientoSelect.val(selectedTratamiento);
            }
            window.fillSelects = fillSelects; // Para usar fuera de loadData

            // Crear mapas para búsqueda rápida
            const clientesMap = new Map(clientesGlobal.map(c => [c.id_cliente, c.nombre]));
            const tratamientosMap = new Map(tratamientosGlobal.map(t => [t.id_tratamiento, t.nombre]));

            // Enriquecer los datos de citas con nombres
            const citasEnriquecidas = citas.map(cita => ({
                ...cita,
                nombre_cliente: clientesMap.get(cita.id_cliente) || 'Cliente no encontrado',
                nombre_tratamiento: tratamientosMap.get(cita.id_tratamiento) || 'Tratamiento no encontrado'
            }));

            // Destruir la tabla existente si existe
            if ($.fn.DataTable.isDataTable('#citasTable')) {
                try {
                    $('#citasTable').DataTable().destroy();
                } catch (error) {
                    console.warn('Error al destruir DataTable:', error);
                }
            }

            // Verificar si la tabla ya está inicializada
            if (!$.fn.DataTable.isDataTable('#citasTable')) {
                // Limpiar el contenido de la tabla solo si no está inicializada
                $('#citasTable tbody').empty();

                // Verificar que tenemos datos válidos
                console.log('Datos de citas para DataTable:', citasEnriquecidas);
                
                // Inicializar la tabla con los nuevos datos
                citasTable = $('#citasTable').DataTable({
                    data: citasEnriquecidas,
                    retrieve: true, // Permite reutilizar la instancia existente
                    destroy: false, // No destruir automáticamente
                    columns: [
                        { 
                            data: 'id_cita',
                            defaultContent: 'N/A'
                        },
                        { 
                            data: 'nombre_cliente',
                            defaultContent: 'Cliente no encontrado'
                        },
                        { 
                            data: 'nombre_tratamiento',
                            defaultContent: 'Tratamiento no encontrado'
                        },
                        {
                            data: 'fecha',
                            defaultContent: 'N/A',
                            render: function (data) {
                                if (!data) return 'N/A';
                                return new Date(data).toLocaleDateString('es-ES');
                            }
                        },
                        {
                            data: 'hora',
                            defaultContent: 'N/A',
                            render: function (data) {
                                return data ? data.substring(0, 5) : 'N/A';
                            }
                        },
                        {
                            data: 'estado',
                            defaultContent: 'N/A',
                            render: function (data) {
                                if (!data) return '<span class="badge badge-secondary">N/A</span>';
                                let estadoClass = 'secondary';
                                let icon = 'question-circle';
                                let label = data.charAt(0).toUpperCase() + data.slice(1);
                                switch (data) {
                                    case 'programada':
                                        estadoClass = 'warning';
                                        icon = 'clock';
                                        break;
                                    case 'completada':
                                        estadoClass = 'success';
                                        icon = 'check-circle';
                                        break;
                                    case 'cancelada':
                                        estadoClass = 'danger';
                                        icon = 'times-circle';
                                        break;
                                    default:
                                        estadoClass = 'secondary';
                                        icon = 'question-circle';
                                }
                                return `<span class="badge badge-${estadoClass}"><i class="fas fa-${icon} mr-1"></i>${label}</span>`;
                            }
                        },
                        {
                            data: null,
                            defaultContent: '',
                            orderable: false,
                            searchable: false,
                            render: function (data, type, row) {
                                if (!row || !row.id_cita) return '';
                                return `<div class="btn-group">
                                    <button class="btn btn-sm btn-info view-btn" data-id="${row.id_cita}" title="Ver detalles">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-primary edit-btn" data-id="${row.id_cita}" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id_cita}" title="Eliminar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>`;
                            }
                        }
                    ],
                    order: [[3, 'desc'], [4, 'asc']], // Ordenar por fecha y hora
                    ...DATATABLES_CONFIG
                });
            } else {
                // Si ya está inicializada, solo actualizar los datos
                citasTable = $('#citasTable').DataTable();
                citasTable.clear().rows.add(citasEnriquecidas).draw();
            }

            // Actualizar estadísticas
            const total = citas.length;
            const activas = citas.filter(c => c.estado === 'activa').length;
            const inactivas = citas.filter(c => c.estado === 'inactiva').length;

            $('#totalCitas').text(total);
            $('#citasActivas').text(activas);
            $('#citasInactivas').text(inactivas);

            // Cargar opciones en los selectores
            fillSelects();

        } catch (error) {
            console.error('Error al cargar citas:', error);
            showError('Error al cargar las citas');
        }
    }

    // Guardar cita
    async function saveCita(data) {
        try {
            const url = data.id_cita ?
                `${API_URL}/api/citas/${data.id_cita}` :
                `${API_URL}/api/citas`;

            const method = data.id_cita ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch (e) {}
                showError(errorMsg);
                throw new Error(errorMsg);
            }

            const result = await response.json();
            if (data.id_cita) {
                showSuccess('Cita actualizada correctamente');
                // Crear notificación del sistema
                if (window.createNotification) {
                    window.createNotification(
                        `Cita actualizada para el ${data.fecha} a las ${data.hora}`,
                        'info',
                        1, // ID admin por defecto
                        data.id_cliente
                    );
                }
            } else {
                showSuccess('Cita creada correctamente');
                // Crear notificación del sistema
                if (window.createNotification) {
                    window.createNotification(
                        `Nueva cita programada para el ${data.fecha} a las ${data.hora}`,
                        'success',
                        1, // ID admin por defecto
                        data.id_cliente
                    );
                }
            }
            $('#citaModal').modal('hide');
            loadData();
            return result;
        } catch (error) {
            console.error('Error al guardar cita:', error);
            // showError('Error al guardar la cita'); // Ya se muestra el error específico arriba
            throw error;
        }
    }

    // Eliminar cita
    async function deleteCita(id) {
        try {
            const response = await fetch(`${API_URL}/api/citas/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            showSuccess('Cita eliminada correctamente');
            // Crear notificación del sistema
            if (window.createNotification) {
                window.createNotification(
                    `Cita con ID ${id} ha sido cancelada`,
                    'warning',
                    1 // ID admin por defecto
                );
            }
            loadData();
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            showError('Error al eliminar la cita');
        }
    }

    // Event Listeners
    $('#saveCita').click(async function () {
        const formData = {
            id_cliente: $('#cliente').val(),
            id_tratamiento: $('#tratamiento').val(),
            fecha: $('#fecha').val(),
            hora: $('#hora').val(),
            estado: $('#estado').val(),
            observaciones: $('#observaciones').val(),
            id_empleada: $('#empleada').val()
        };

        const id = $('#id_cita').val();
        if (id) {
            formData.id_cita = id;
        }

        try {
            await saveCita(formData);
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    });

    // Limpiar formulario solo si es NUEVA cita
    $('button[data-target="#citaModal"], button[data-toggle="modal"][data-target="#citaModal"]').click(function () {
        $('#citaForm')[0].reset();
        $('#id_cita').val('');
        $('#citaModalLabel').text('Nueva Cita');
        fillSelects();
    });

    // Editar cita
    $(document).on('click', '.edit-btn', async function () {
        const id = $(this).data('id');
        try {
            const response = await fetch(`${API_URL}/api/citas/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.error || 'Error al cargar los datos de la cita');
                return;
            }
            const cita = await response.json();
            fillSelects(cita.id_cliente, cita.id_tratamiento);
            $('#id_cita').val(cita.id_cita);
            $('#fecha').val(cita.fecha);
        $('#hora').val(cita.hora ? cita.hora.substring(0, 5) : '');
            $('#estado').val(cita.estado);
            $('#observaciones').val(cita.observaciones || '');
            $('#empleada').val(cita.id_empleada || '');
            $('#citaModalLabel').text('Editar Cita: ' + (cita.cliente_nombre || cita.nombre_cliente || ''));
            $('#citaModal').modal('show');
        } catch (error) {
            showError('Error al cargar los datos de la cita');
        }
    });

    // Eliminar cita
    $(document).on('click', '.delete-btn', function () {
        const id = $(this).data('id');
        showConfirm('¿Está seguro que desea eliminar esta cita?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar')
            .then((result) => {
                if (result.isConfirmed) {
                    deleteCita(id);
                }
            });
    });

    // Buscar cita por ID y mostrar detalles
    $('#btnBuscarIdCita').click(async function () {
        const id = $('#buscarIdCita').val();
        if (!id) {
            showError('Por favor ingresa un ID');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/citas/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.error || 'Cita no encontrada');
                return;
            }
            const cita = await response.json();
            let clienteNombre = clientesGlobal.find(c => c.id_cliente == cita.id_cliente)?.nombre || cita.cliente_nombre || cita.nombre_cliente || cita.id_cliente;
            let tratamientoNombre = tratamientosGlobal.find(t => t.id_tratamiento == cita.id_tratamiento)?.nombre || cita.tratamiento_nombre || cita.nombre_tratamiento || cita.id_tratamiento;
            $('#detalle_id_cita').text(cita.id_cita);
            $('#detalle_cliente').text(clienteNombre);
            $('#detalle_tratamiento').text(tratamientoNombre);
            $('#detalle_fecha').text(cita.fecha);
        $('#detalle_hora').text(cita.hora);
            $('#detalle_estado').text(cita.estado);
            $('#detalle_observaciones').text(cita.observaciones || 'Sin observaciones');
            $('#detalle_empleada').text(cita.nombre_empleada || 'No asignada');
            $('#detalleCitaModalLabel').text('Detalles de la Cita: ' + clienteNombre);
            $('#detalleCitaModal').modal('show');
        } catch (error) {
            showError('Error al buscar la cita');
        }
    });

    // Cargar datos iniciales
    loadData();
});

// Notificaciones
let notifications = [];

function loadNotifications() {
    notifications = [
        { id: 1, message: 'Nueva cita programada para mañana', read: false, date: '2024-03-20 10:00' },
        { id: 2, message: 'Recordatorio: Cita pendiente de confirmación', read: false, date: '2024-03-20 09:00' }
    ];
    updateNotificationCount();
    updateNotificationsList();
}

function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    $('#notificationCount').text(unreadCount);
}

function updateNotificationsList() {
    const list = $('#notificationsList');
    list.empty();

    if (notifications.length === 0) {
        list.append('<p class="text-center text-muted">No hay notificaciones</p>');
        return;
    }

    notifications.forEach(notification => {
        list.append(`
            <div class="notification-item ${notification.read ? 'read' : 'unread'} p-2 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                    <p class="mb-1">${notification.message}</p>
                    <small class="text-muted">${notification.date}</small>
                </div>
            </div>
        `);
    });
}

// Event Listeners
$('#notificationsBtn').click(function (e) {
    e.preventDefault();
    $('#notificationsModal').modal('show');
});

$('#markAllRead').click(function () {
    notifications.forEach(n => n.read = true);
    updateNotificationCount();
    updateNotificationsList();
});

$('#logoutBtn').click(function (e) {
    e.preventDefault();
    if (typeof window.initLogoutButton === 'function') {
        // Use global logout function
        logout();
    } else {
        // Fallback
        sessionStorage.removeItem('adminData');
        window.location.replace('index.html');
    }
});

// Initial load
loadNotifications();