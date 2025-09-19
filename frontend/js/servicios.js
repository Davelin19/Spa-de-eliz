import { showSuccess, showError } from './utils/notifications.js';
import { API_URL, DATATABLES_CONFIG } from './config.js';

let serviciosTable;

// Initialize DataTable
$(document).ready(function () {
    // Cargar datos
    async function loadData() {
        try {
            console.log('Iniciando carga de servicios...');
            const response = await fetch(`${API_URL}/api/servicios`);
            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }

            const servicios = await response.json();

            // Destruir la tabla existente si existe
            if ($.fn.DataTable.isDataTable('#serviciosTable')) {
                try {
                    $('#serviciosTable').DataTable().destroy();
                } catch (error) {
                    console.warn('Error al destruir DataTable:', error);
                }
            }

            // Limpiar el contenido de la tabla
            $('#serviciosTable tbody').empty();

            // Reinicializar la tabla con los nuevos datos
            serviciosTable = $('#serviciosTable').DataTable({
                data: servicios,
                columns: [
                    { data: 'id_servicio' },
                    { data: 'nombre' },
                    { data: 'descripcion' },
                    {
                        data: 'duracion',
                        render: function (data) {
                            return `${data} minutos`;
                        }
                    },
                    {
                        data: 'precio',
                        render: function (data) {
                            return `$${parseFloat(data).toFixed(2)}`;
                        }
                    },
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
                                <button class="btn btn-sm btn-info view-btn" data-id="${row.id_servicio}" title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-primary edit-btn" data-id="${row.id_servicio}" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id_servicio}" title="Eliminar">
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
            const total = servicios.length;
            const activos = servicios.filter(s => s.estado === 'activo').length;
            const inactivos = servicios.filter(s => s.estado === 'inactivo').length;
            const ingresos = servicios.reduce((sum, s) => sum + (parseFloat(s.precio) || 0), 0);

            $('#totalServicios').text(total);
            $('#serviciosActivos').text(activos);
            $('#serviciosInactivos').text(inactivos);
            $('#ingresosServicios').text(`$${ingresos.toFixed(2)}`);

        } catch (error) {
            console.error('Error al cargar servicios:', error);
            showError('Error al cargar los servicios');
        }
    }

    // Guardar servicio
    async function saveServicio(data) {
        try {
            const url = data.id_servicio ?
                `${API_URL}/api/servicios/${data.id_servicio}` :
                `${API_URL}/api/servicios`;

            const method = data.id_servicio ? 'PUT' : 'POST';

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
            showSuccess(data.id_servicio ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente');
            $('#servicioModal').modal('hide');
            loadData();
            return result;
        } catch (error) {
            console.error('Error al guardar servicio:', error);
            showError('Error al guardar el servicio');
            throw error;
        }
    }

    // Eliminar servicio
    async function deleteServicio(id) {
        try {
            const response = await fetch(`${API_URL}/api/servicios/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            showSuccess('Servicio eliminado correctamente');
            loadData();
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            showError('Error al eliminar el servicio');
        }
    }

    // Event Listeners
    $('#saveServicio').click(async function () {
        const formData = {
            nombre: $('#nombre').val(),
            descripcion: $('#descripcion').val(),
            duracion: $('#duracion').val(),
            precio: $('#precio').val(),
            estado: $('#estado').val()
        };

        const id = $('#id_servicio').val();
        if (id) {
            formData.id_servicio = id;
        }

        try {
            await saveServicio(formData);
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    });

    // Editar servicio
    $(document).on('click', '.edit-btn', async function () {
        const id = $(this).data('id');
        try {
            const response = await fetch(`${API_URL}/api/servicios/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const servicio = await response.json();

            $('#id_servicio').val(servicio.id_servicio);
            $('#nombre').val(servicio.nombre);
            $('#descripcion').val(servicio.descripcion);
            $('#duracion').val(servicio.duracion);
            $('#precio').val(servicio.precio);
            $('#estado').val(servicio.estado);

            $('#servicioModalLabel').text('Editar Servicio');
            $('#servicioModal').modal('show');
        } catch (error) {
            console.error('Error al cargar servicio:', error);
            showError('Error al cargar los datos del servicio');
        }
    });

    // Eliminar servicio
    $(document).on('click', '.delete-btn', async function () {
        const id = $(this).data('id');
        const result = await showConfirm('¿Está seguro que desea eliminar este servicio?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar');
        
        if (result.isConfirmed) {
            deleteServicio(id);
        }
    });

    // Limpiar formulario al abrir modal
    $('#servicioModal').on('show.bs.modal', function (e) {
        if (!$(e.relatedTarget).hasClass('edit-btn')) {
            $('#servicioForm')[0].reset();
            $('#id_servicio').val('');
            $('#servicioModalLabel').text('Nuevo Servicio');
        }
    });

    // Cargar datos iniciales
    loadData();
});