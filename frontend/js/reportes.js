// import { showSuccess, showError } from './utils/notifications.js';
// import { API_URL, DATATABLES_CONFIG } from './config.js';

// Usar las variables globales definidas en config.js o tables.js
// const API_URL ya está definido en tables.js
const DATATABLES_CONFIG = window.DATATABLES_CONFIG || {
    language: {
        url: 'vendor/datatables/Spanish.json'
    },
    responsive: true
};

let reportesTable;

// Initialize DataTable
$(document).ready(function () {
    // Cargar datos
    async function loadData() {
        try {
            const response = await fetch(`${API_URL}/api/reportes`);
            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }

            const reportes = await response.json();
            
            // Si la respuesta tiene estructura {success: true, data: [...]}
            const reportesData = reportes.data || reportes;

            // Verificar si la tabla ya está inicializada
            if (!$.fn.DataTable.isDataTable('#reportesTable')) {
                // Limpiar el contenido de la tabla solo si no está inicializada
                $('#reportesTable tbody').empty();

                // Verificar que tenemos datos válidos
                console.log('Datos de reportes para DataTable:', reportesData);

                // Inicializar la tabla con los nuevos datos
                reportesTable = $('#reportesTable').DataTable({
                    data: reportesData,
                    retrieve: true, // Permite reutilizar la instancia existente
                    destroy: false, // No destruir automáticamente
                    columns: [
                        { 
                            data: 'id_reporte',
                            defaultContent: 'N/A'
                        },
                        { 
                            data: 'titulo',
                            defaultContent: 'Sin título'
                        },
                        { 
                            data: 'descripcion',
                            defaultContent: 'Sin descripción'
                        },
                        {
                            data: 'fecha_generacion',
                            defaultContent: 'N/A',
                            render: function (data) {
                                if (!data) return 'N/A';
                                return new Date(data).toLocaleDateString('es-ES');
                            }
                        },
                        { 
                            data: 'tipo',
                            defaultContent: 'N/A',
                            render: function (data) {
                                if (!data) return '<span class="badge badge-secondary">N/A</span>';
                                let tipoClass = 'primary';
                                let icon = 'file-alt';
                                let label = data.charAt(0).toUpperCase() + data.slice(1);
                                
                                switch (data.toLowerCase()) {
                                    case 'ventas':
                                        tipoClass = 'success';
                                        icon = 'chart-line';
                                        break;
                                    case 'clientes':
                                        tipoClass = 'info';
                                        icon = 'users';
                                        break;
                                    case 'tratamientos':
                                        tipoClass = 'warning';
                                        icon = 'spa';
                                        break;
                                    case 'citas':
                                        tipoClass = 'primary';
                                        icon = 'calendar';
                                        break;
                                    default:
                                        tipoClass = 'secondary';
                                        icon = 'file-alt';
                                }
                                
                                return `<span class="badge badge-${tipoClass}"><i class="fas fa-${icon} mr-1"></i>${label}</span>`;
                            }
                        },
                        {
                            data: null,
                            defaultContent: '',
                            orderable: false,
                            searchable: false,
                            render: function (data, type, row) {
                                if (!row || !row.id_reporte) return '';
                                return `<div class="btn-group">
                                    <button class="btn btn-sm btn-primary view-btn" data-id="${row.id_reporte}" title="Ver">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-success download-btn" data-id="${row.id_reporte}" title="Descargar">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id_reporte}" title="Eliminar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>`;
                            }
                        }
                    ],
                    order: [[3, 'desc']], // Ordenar por fecha de generación descendente
                    ...DATATABLES_CONFIG
                });
            } else {
                // Si ya está inicializada, solo actualizar los datos
                reportesTable = $('#reportesTable').DataTable();
                reportesTable.clear().rows.add(reportesData).draw();
            }

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

            // Actualizar estadísticas
            const total = reportes.length;
            let ultimo = '-';
            if (reportes.length > 0) {
                ultimo = reportes[0].fecha_reporte ? new Date(reportes[0].fecha_reporte).toLocaleDateString('es-ES') : '-';
            }
            $('#totalReportes').text(total);
            $('#ultimoReporte').text(ultimo);
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            showError('Error al cargar los reportes');
        }
    }

    // Guardar reporte (Agregar)
    $('#saveReporte').click(async function () {
        // Obtener admin logueado
        const adminData = sessionStorage.getItem('adminData');
        let id_admin = null;
        if (adminData) {
            try {
                const admin = JSON.parse(adminData);
                id_admin = admin.id_admin || admin.id || admin.idAdmin;
            } catch (e) { id_admin = null; }
        }
        const formData = {
            titulo: $('#titulo').val(),
            descripcion: $('#descripcion').val(),
            tipo: $('#tipo').val(),
            estado: $('#estado').val(),
            fecha_reporte: $('#fecha_reporte').val(),
            id_admin: id_admin
        };
        try {
            const response = await fetch(`${API_URL}/api/reportes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error('Error al crear el reporte');
            showSuccess('Reporte creado correctamente');
            $('#reporteModal').modal('hide');
            loadData();
        } catch (error) {
            showError('Error al crear el reporte');
        }
    });

    // Guardar reporte (Editar)
    $('#updateReporte').click(async function () {
        // Obtener admin logueado
        const adminData = sessionStorage.getItem('adminData');
        let id_admin = null;
        if (adminData) {
            try {
                const admin = JSON.parse(adminData);
                id_admin = admin.id_admin || admin.id || admin.idAdmin;
            } catch (e) { id_admin = null; }
        }
        const id = $('#editar_id_reporte').val();
        const formData = {
            titulo: $('#editar_titulo').val(),
            descripcion: $('#editar_descripcion').val(),
            tipo: $('#editar_tipo').val(),
            estado: $('#editar_estado').val(),
            fecha_reporte: $('#editar_fecha_reporte').val(),
            id_admin: id_admin
        };
        try {
            const response = await fetch(`${API_URL}/api/reportes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error('Error al actualizar el reporte');
            showSuccess('Reporte actualizado correctamente');
            $('#editarReporteModal').modal('hide');
            loadData();
        } catch (error) {
            showError('Error al actualizar el reporte');
        }
    });

    // Editar reporte (abrir modal y cargar datos)
    $(document).on('click', '.edit-btn', async function () {
        const id = $(this).data('id');
        try {
            const response = await fetch(`${API_URL}/api/reportes/${id}`);
            if (!response.ok) throw new Error('Error al obtener el reporte');
            const reporte = await response.json();
            $('#editar_id_reporte').val(reporte.id_reporte);
            $('#editar_titulo').val(reporte.titulo);
            $('#editar_descripcion').val(reporte.descripcion);
            $('#editar_tipo').val(reporte.tipo);
            $('#editar_estado').val(reporte.estado);
            $('#editar_fecha_reporte').val(reporte.fecha_reporte ? reporte.fecha_reporte.substring(0,10) : '');
            $('#editarReporteModal').modal('show');
        } catch (error) {
            showError('Error al cargar los datos del reporte');
        }
    });

    // Limpiar formulario al abrir modal de agregar
    $('#reporteModal').on('show.bs.modal', function () {
        $('#reporteForm')[0].reset();
        $('#id_reporte').val('');
        $('#fecha_reporte').val(new Date().toISOString().substring(0,10));
    });

    // Eliminar reporte
    $(document).on('click', '.delete-btn', async function () {
        const id = $(this).data('id');
        const result = await showConfirm('¿Está seguro que desea eliminar este reporte?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar');
        
        if (result.isConfirmed) {
            fetch(`${API_URL}/api/reportes/${id}`, { method: 'DELETE' })
                .then(resp => {
                    if (!resp.ok) throw new Error();
                    showSuccess('Reporte eliminado correctamente');
                    loadData();
                })
                .catch(() => showError('Error al eliminar el reporte'));
        }
    });

    // Mostrar detalles en el bloque fuera del modal
    function mostrarDetalleReporte(r) {
        $('#detalle_id_reporte').text(r.id_reporte);
        $('#detalle_titulo').text(r.titulo);
        $('#detalle_descripcion').text(r.descripcion);
        $('#detalle_tipo').text(r.tipo);
        $('#detalle_fecha').text(r.fecha_reporte ? new Date(r.fecha_reporte).toLocaleDateString('es-ES') : '-');
        $('#detalle_admin').text(r.nombre_admin || '-');
        $('#detalleReporte').show();
    }

    // Consulta individual de reporte por ID
    $('#buscarReporteForm').submit(async function (e) {
        e.preventDefault();
        const id = $('#buscarReporteId').val();
        // Limpiar campos
        $('#detalle_id_reporte, #detalle_titulo, #detalle_descripcion, #detalle_tipo, #detalle_fecha, #detalle_admin').text('');
        $('#detalleReporte').hide();
        if (!id) return;
        try {
            const response = await fetch(`${API_URL}/api/reportes/${id}`);
            if (!response.ok) throw new Error('No se encontró el reporte');
            const r = await response.json();
            mostrarDetalleReporte(r);
        } catch (error) {
            showError('No se encontró el reporte con ID ' + id);
        }
    });

    // Evento para mostrar detalles del reporte desde la tabla
    $(document).on('click', '.details-btn', async function () {
        const id = $(this).data('id');
        // Limpiar campos
        $('#detalle_id_reporte, #detalle_titulo, #detalle_descripcion, #detalle_tipo, #detalle_fecha, #detalle_admin').text('');
        $('#detalleReporte').hide();
        try {
            const response = await fetch(`${API_URL}/api/reportes/${id}`);
            if (!response.ok) throw new Error('No se encontró el reporte');
            const r = await response.json();
            mostrarDetalleReporte(r);
        } catch (error) {
            showError('No se encontró el reporte con ID ' + id);
        }
    });

    // Cargar datos al iniciar
    loadData();

    // Nuevo evento para editar reporte
    $(document).on('click', '.btn-edit-reporte', function() {
        const id = $(this).data('id');
        const reporte = reportes.find(r => r.id_reporte == id);
        if (reporte) {
            $('#edit_id_reporte').val(reporte.id_reporte);
            $('#edit_titulo').val(reporte.titulo);
            $('#edit_descripcion').val(reporte.descripcion);
            $('#edit_tipo').val(reporte.tipo);
            $('#edit_fecha_reporte').val(reporte.fecha_reporte);
            $('#edit_id_admin_reporte').val(reporte.id_admin);
            $('#modalEditarReporte').modal('show');
        }
    });
});