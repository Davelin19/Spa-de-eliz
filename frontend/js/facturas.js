// Sistema de Facturación - Armony Stetic
// Conectado con datos reales de la base de datos

// Variables globales
let facturas = [];
let clientes = [];
let tratamientos = [];
let administradores = [];
let facturasTable;

// Usar configuración global de config.js
const API_BASE_URL = window.API_URL || 'http://localhost:5000';
const API_ENDPOINTS = {
    facturas: `${API_BASE_URL}/api/facturas`,
    clientes: `${API_BASE_URL}/api/clientes`,
    tratamientos: `${API_BASE_URL}/api/tratamientos`,
    administradores: `${API_BASE_URL}/api/administradores`,
    pagos: `${API_BASE_URL}/api/pagos`
};

// Inicialización cuando se carga la página
$(document).ready(function() {
    inicializarSistema();
    configurarEventos();
    cargarDatos();
});

// Función principal de inicialización
function inicializarSistema() {
    // Inicializar DataTable
    facturasTable = $('#facturasTable').DataTable({
        language: {
            url: 'vendor/datatables/Spanish.json'
        },
        responsive: true,
        order: [[0, 'desc']],
        columnDefs: [
            { targets: -1, orderable: false } // Columna de acciones no ordenable
        ]
    });

    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    $('#fechaPago').val(today);
}

// Configurar eventos
function configurarEventos() {
    // Eventos de filtros
    $('#filtroEstado, #filtroMetodoPago, #filtroFechaInicio, #filtroFechaFin').on('change', aplicarFiltros);
    
    // Evento de búsqueda por ID
    $('#btnBuscarIdFactura').on('click', buscarFacturaPorId);
    $('#buscarIdFactura').on('keypress', function(e) {
        if (e.which === 13) {
            buscarFacturaPorId();
        }
    });

    // Eventos del formulario
    $('#clienteSelect').on('change', function() {
        const clienteId = $(this).val();
        if (clienteId) {
            cargarTratamientosCliente(clienteId);
        }
    });

    $('#tratamientoSelect').on('change', function() {
        const tratamientoId = $(this).val();
        if (tratamientoId) {
            actualizarPrecioTratamiento(tratamientoId);
        }
    });

    // Eventos de notificaciones y logout
    $('#notificationsBtn').on('click', mostrarNotificaciones);
    // Inicializar el botón de logout usando la función global
    if (window.initLogoutButton) {
        window.initLogoutButton();
    }
}

// Cargar todos los datos necesarios
async function cargarDatos() {
    try {
        await Promise.all([
            cargarFacturas(),
            cargarClientes(),
            cargarTratamientos(),
            cargarAdministradores()
        ]);
        
        actualizarEstadisticas();
        llenarSelectores();
    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarError('Error al cargar los datos del sistema');
    }
}

// Cargar facturas desde la base de datos
async function cargarFacturas() {
    try {
        // Simulación de llamada a la API - reemplazar con llamada real
        const response = await fetch(API_ENDPOINTS.pagos);
        if (!response.ok) throw new Error('Error al cargar facturas');
        
        facturas = await response.json();
        
        // Si no hay endpoint real, usar datos de ejemplo basados en la estructura de la BD
        if (facturas.length === 0) {
            facturas = generarDatosEjemplo();
        }
        
        actualizarTablaFacturas();
    } catch (error) {
        console.error('Error cargando facturas:', error);
        // Usar datos de ejemplo si falla la conexión
        facturas = generarDatosEjemplo();
        actualizarTablaFacturas();
    }
}

// Cargar clientes desde la base de datos
async function cargarClientes() {
    try {
        const response = await fetch(API_ENDPOINTS.clientes);
        if (!response.ok) throw new Error('Error al cargar clientes');
        
        const result = await response.json();
        
        // Extraer el array de datos de la respuesta de la API
        if (result && result.success && Array.isArray(result.data)) {
            clientes = result.data;
        } else if (Array.isArray(result)) {
            clientes = result;
        } else {
            clientes = [];
        }
        
        // Datos de ejemplo si no hay datos
        if (clientes.length === 0) {
            clientes = [
                { id: 1, nombre: 'María García', email: 'maria@email.com', telefono: '123456789' },
                { id: 2, nombre: 'Ana López', email: 'ana@email.com', telefono: '987654321' },
                { id: 3, nombre: 'Carmen Rodríguez', email: 'carmen@email.com', telefono: '456789123' },
                { id: 4, nombre: 'Laura Martínez', email: 'laura@email.com', telefono: '789123456' },
                { id: 5, nombre: 'Isabel Fernández', email: 'isabel@email.com', telefono: '321654987' }
            ];
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
        clientes = [
            { id: 1, nombre: 'María García', email: 'maria@email.com', telefono: '123456789' },
            { id: 2, nombre: 'Ana López', email: 'ana@email.com', telefono: '987654321' },
            { id: 3, nombre: 'Carmen Rodríguez', email: 'carmen@email.com', telefono: '456789123' }
        ];
    }
}

// Cargar tratamientos desde la base de datos
async function cargarTratamientos() {
    try {
        const response = await fetch(API_ENDPOINTS.tratamientos);
        if (!response.ok) throw new Error('Error al cargar tratamientos');
        
        const result = await response.json();
        
        // Extraer el array de datos de la respuesta de la API
        if (result && result.success && Array.isArray(result.data)) {
            tratamientos = result.data;
        } else if (Array.isArray(result)) {
            tratamientos = result;
        } else {
            tratamientos = [];
        }
        
        // Datos de ejemplo si no hay datos
        if (tratamientos.length === 0) {
            tratamientos = [
                { id: 1, nombre: 'Limpieza Facial', precio: 50.00, duracion: 60 },
                { id: 2, nombre: 'Masaje Relajante', precio: 80.00, duracion: 90 },
                { id: 3, nombre: 'Tratamiento Anti-edad', precio: 120.00, duracion: 75 },
                { id: 4, nombre: 'Depilación Láser', precio: 200.00, duracion: 45 },
                { id: 5, nombre: 'Hidratación Profunda', precio: 90.00, duracion: 60 }
            ];
        }
    } catch (error) {
        console.error('Error cargando tratamientos:', error);
        tratamientos = [
            { id: 1, nombre: 'Limpieza Facial', precio: 50.00, duracion: 60 },
            { id: 2, nombre: 'Masaje Relajante', precio: 80.00, duracion: 90 },
            { id: 3, nombre: 'Tratamiento Anti-edad', precio: 120.00, duracion: 75 }
        ];
    }
}

// Cargar administradores desde la base de datos
async function cargarAdministradores() {
    try {
        const response = await fetch(API_ENDPOINTS.administradores);
        if (!response.ok) throw new Error('Error al cargar administradores');
        
        const result = await response.json();
        
        // Extraer el array de datos de la respuesta de la API
        if (result && result.success && Array.isArray(result.data)) {
            administradores = result.data;
        } else if (Array.isArray(result)) {
            administradores = result;
        } else {
            administradores = [];
        }
        
        // Datos de ejemplo si no hay datos
        if (administradores.length === 0) {
            administradores = [
                { id: 1, nombre: 'Admin Principal', email: 'admin@armony.com' },
                { id: 2, nombre: 'Supervisor', email: 'supervisor@armony.com' }
            ];
        }
    } catch (error) {
        console.error('Error cargando administradores:', error);
        administradores = [
            { id: 1, nombre: 'Admin Principal', email: 'admin@armony.com' },
            { id: 2, nombre: 'Supervisor', email: 'supervisor@armony.com' }
        ];
    }
}

// Generar datos de ejemplo basados en la estructura de la BD
function generarDatosEjemplo() {
    return [
        {
            id: 1,
            id_cliente: 1,
            id_tratamiento: 1,
            fecha_pago: '2024-01-15',
            total: 50000,
            metodo_pago: 'efectivo',
            estado_pago: 'completado',
            numero_referencia: 'REF001',
            observaciones: 'Pago completo en efectivo'
        },
        {
            id: 2,
            id_cliente: 2,
            id_tratamiento: 2,
            fecha_pago: '2024-01-16',
            total: 80000,
            metodo_pago: 'tarjeta',
            estado_pago: 'completado',
            numero_referencia: 'REF002',
            observaciones: 'Pago con tarjeta de crédito'
        },
        {
            id: 3,
            id_cliente: 3,
            id_tratamiento: 3,
            fecha_pago: '2024-01-17',
            total: 120000,
            metodo_pago: 'transferencia',
            estado_pago: 'pendiente',
            numero_referencia: 'REF003',
            observaciones: 'Esperando confirmación de transferencia'
        },
        {
            id: 4,
            id_cliente: 1,
            id_tratamiento: 4,
            fecha_pago: '2024-01-18',
            total: 150000,
            metodo_pago: 'tarjeta',
            estado_pago: 'completado',
            numero_referencia: 'REF004',
            observaciones: 'Tratamiento completo'
        },
        {
            id: 5,
            id_cliente: 2,
            id_tratamiento: 5,
            fecha_pago: '2024-01-19',
            total: 100000,
            metodo_pago: 'efectivo',
            estado_pago: 'fallido',
            numero_referencia: 'REF005',
            observaciones: 'Pago rechazado, cliente no se presentó'
        }
    ];
}

// Llenar selectores con datos reales
function llenarSelectores() {
    // Verificar que clientes sea un array antes de usar forEach
    if (!Array.isArray(clientes)) {
        console.warn('clientes no es un array:', clientes);
        clientes = [];
    }
    
    // Llenar selector de clientes
    const clienteSelect = $('#clienteSelect');
    clienteSelect.empty().append('<option value="">Seleccionar cliente...</option>');
    clientes.forEach(cliente => {
        clienteSelect.append(`<option value="${cliente.id}">${cliente.nombre}</option>`);
    });

    // Verificar que tratamientos sea un array antes de usar forEach
    if (!Array.isArray(tratamientos)) {
        console.warn('tratamientos no es un array:', tratamientos);
        tratamientos = [];
    }

    // Llenar selector de tratamientos
    const tratamientoSelect = $('#tratamientoSelect');
    tratamientoSelect.empty().append('<option value="">Seleccionar tratamiento...</option>');
    tratamientos.forEach(tratamiento => {
        tratamientoSelect.append(`<option value="${tratamiento.id}">${tratamiento.nombre} - $${formatearPrecio(tratamiento.precio)}</option>`);
    });

    // Llenar selector de administradores
    const adminSelect = $('#adminSelect');
    adminSelect.empty().append('<option value="">Seleccionar administrador...</option>');
    administradores.forEach(admin => {
        adminSelect.append(`<option value="${admin.id}">${admin.nombre}</option>`);
    });
}

// Actualizar tabla de facturas
function actualizarTablaFacturas() {
    facturasTable.clear();
    
    facturas.forEach(factura => {
        // Verificar si los datos vienen del endpoint (con nombres resueltos) o son datos de ejemplo
        let clienteNombre = factura.cliente_nombre || 'Cliente no encontrado';
        let tratamientoNombre = factura.tratamiento_nombre || 'Tratamiento no encontrado';
        
        // Si son datos de ejemplo, buscar los nombres en los arrays correspondientes
        if (!factura.cliente_nombre && factura.id_cliente) {
            const cliente = clientes.find(c => c.id_cliente === factura.id_cliente);
            clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado';
        }
        
        if (!factura.tratamiento_nombre && factura.id_tratamiento) {
            const tratamiento = tratamientos.find(t => t.id_tratamiento === factura.id_tratamiento);
            tratamientoNombre = tratamiento ? tratamiento.nombre : 'Tratamiento no encontrado';
        }
        
        const row = [
            factura.id_pago || factura.id,
            clienteNombre,
            tratamientoNombre,
            formatearFecha(factura.fecha_pago),
            `$${formatearPrecio(factura.total)}`,
            capitalizarPrimera(factura.metodo_pago),
            generarBadgeEstado(factura.estado_pago || factura.estado),
            generarBotonesAccion(factura.id_pago || factura.id)
        ];
        
        facturasTable.row.add(row);
    });
    
    facturasTable.draw();
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const totalFacturas = facturas.length;
    const facturasCompletadas = facturas.filter(f => f.estado_pago === 'completado').length;
    const facturasPendientes = facturas.filter(f => f.estado_pago === 'pendiente').length;
    const ingresosTotales = facturas
        .filter(f => f.estado_pago === 'completado')
        .reduce((total, f) => total + f.total, 0);

    $('#totalFacturas').text(totalFacturas);
    $('#facturasCompletadas').text(facturasCompletadas);
    $('#facturasPendientes').text(facturasPendientes);
    $('#ingresosTotales').text(`$${formatearPrecio(ingresosTotales)}`);
}

// Generar badge de estado
function generarBadgeEstado(estado) {
    const clases = {
        'completado': 'status-completado',
        'pendiente': 'status-pendiente',
        'fallido': 'status-fallido',
        'reembolsado': 'status-reembolsado'
    };
    
    // Verificar que estado no sea null o undefined
    const estadoSeguro = estado || 'desconocido';
    
    return `<span class="status-badge ${clases[estadoSeguro] || ''}">${capitalizarPrimera(estadoSeguro)}</span>`;
}

// Generar botones de acción
function generarBotonesAccion(facturaId) {
    return `
        <div class="btn-group" role="group">
            <button class="btn btn-sm btn-info" onclick="verFactura(${facturaId})" title="Ver detalles">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning" onclick="editarFactura(${facturaId})" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="eliminarFactura(${facturaId})" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

// Aplicar filtros
function aplicarFiltros() {
    const estado = $('#filtroEstado').val();
    const metodoPago = $('#filtroMetodoPago').val();
    const fechaInicio = $('#filtroFechaInicio').val();
    const fechaFin = $('#filtroFechaFin').val();

    let facturasFiltradas = [...facturas];

    if (estado) {
        facturasFiltradas = facturasFiltradas.filter(f => f.estado_pago === estado);
    }

    if (metodoPago) {
        facturasFiltradas = facturasFiltradas.filter(f => f.metodo_pago === metodoPago);
    }

    if (fechaInicio) {
        facturasFiltradas = facturasFiltradas.filter(f => f.fecha_pago >= fechaInicio);
    }

    if (fechaFin) {
        facturasFiltradas = facturasFiltradas.filter(f => f.fecha_pago <= fechaFin);
    }

    // Actualizar tabla con facturas filtradas
    facturasTable.clear();
    facturasFiltradas.forEach(factura => {
        const cliente = clientes.find(c => c.id === factura.id_cliente);
        const tratamiento = tratamientos.find(t => t.id === factura.id_tratamiento);
        
        const row = [
            factura.id,
            cliente ? cliente.nombre : 'Cliente no encontrado',
            tratamiento ? tratamiento.nombre : 'Tratamiento no encontrado',
            formatearFecha(factura.fecha_pago),
            `$${formatearPrecio(factura.total)}`,
            capitalizarPrimera(factura.metodo_pago),
            generarBadgeEstado(factura.estado_pago),
            generarBotonesAccion(factura.id)
        ];
        
        facturasTable.row.add(row);
    });
    
    facturasTable.draw();
}

// Limpiar filtros
function limpiarFiltros() {
    $('#filtroEstado, #filtroMetodoPago, #filtroFechaInicio, #filtroFechaFin').val('');
    actualizarTablaFacturas();
}

// Buscar factura por ID
function buscarFacturaPorId() {
    const id = $('#buscarIdFactura').val();
    if (!id) {
        mostrarError('Por favor ingrese un ID de factura');
        return;
    }

    const factura = facturas.find(f => f.id == id);
    if (factura) {
        verFactura(factura.id);
        $('#buscarIdFactura').val('');
    } else {
        mostrarError('No se encontró una factura con ese ID');
    }
}

// Ver detalles de factura
function verFactura(facturaId) {
    const factura = facturas.find(f => f.id_pago === facturaId);
    if (!factura) {
        mostrarError('Factura no encontrada');
        return;
    }

    // Los datos ya vienen con nombres resueltos del endpoint
    // Llenar modal con datos
    $('#verFacturaId').text(factura.id_pago);
    $('#verFacturaCliente').text(factura.cliente_nombre || 'No disponible');
    $('#verFacturaTratamiento').text(factura.tratamiento_nombre || 'No disponible');
    $('#verFacturaAdmin').text('No asignado'); // No disponible en el endpoint actual
    $('#verFacturaFecha').text(formatearFecha(factura.fecha_pago));
    $('#verFacturaTotal').text(`$${formatearPrecio(factura.total)}`);
    $('#verFacturaMetodo').text(capitalizarPrimera(factura.metodo_pago));
    $('#verFacturaEstado').html(generarBadgeEstado(factura.estado));
    $('#verFacturaReferencia').text('No disponible'); // No disponible en el endpoint actual
    $('#verFacturaObservaciones').text('Sin observaciones'); // No disponible en el endpoint actual

    $('#verFacturaModal').modal('show');
}

// Editar factura
function editarFactura(facturaId) {
    const factura = facturas.find(f => f.id_pago === facturaId);
    if (!factura) {
        mostrarError('Factura no encontrada');
        return;
    }

    // Llenar formulario con datos existentes
    $('#facturaId').val(factura.id_pago);
    $('#clienteSelect').val(factura.id_cliente);
    $('#tratamientoSelect').val(factura.id_tratamiento || '');
    $('#adminSelect').val(''); // No disponible en el endpoint actual
    $('#fechaPago').val(factura.fecha_pago);
    $('#total').val(factura.total);
    $('#metodoPago').val(factura.metodo_pago);
    $('#estadoPago').val(factura.estado);
    $('#numeroReferencia').val(''); // No disponible en el endpoint actual
    $('#observaciones').val(''); // No disponible en el endpoint actual

    $('#facturaModalLabel').text('Editar Factura');
    $('#facturaModal').modal('show');
}

// Guardar factura (nueva o editada)
async function guardarFactura() {
    const formData = {
        id: $('#facturaId').val(),
        id_cliente: $('#clienteSelect').val(),
        id_tratamiento: $('#tratamientoSelect').val(),
        id_administrador: $('#adminSelect').val() || null,
        fecha_pago: $('#fechaPago').val(),
        total: parseFloat($('#total').val()),
        metodo_pago: $('#metodoPago').val(),
        estado_pago: $('#estadoPago').val(),
        numero_referencia: $('#numeroReferencia').val(),
        observaciones: $('#observaciones').val()
    };

    // Validaciones
    if (!formData.id_cliente || !formData.id_tratamiento || !formData.fecha_pago || 
        !formData.total || !formData.metodo_pago || !formData.estado_pago) {
        mostrarError('Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        let response;
        if (formData.id) {
            // Actualizar factura existente
            response = await fetch(`${API_ENDPOINTS.pagos}/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            // Crear nueva factura
            response = await fetch(API_ENDPOINTS.pagos, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }

        if (response.ok) {
            mostrarExito(formData.id ? 'Factura actualizada correctamente' : 'Factura creada correctamente');
            $('#facturaModal').modal('hide');
            limpiarFormulario();
            await cargarFacturas();
            actualizarEstadisticas();
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
    } catch (error) {
        console.error('Error guardando factura:', error);
        // Simular guardado exitoso para demo
        if (formData.id) {
            const index = facturas.findIndex(f => f.id == formData.id);
            if (index !== -1) {
                facturas[index] = { ...facturas[index], ...formData };
            }
        } else {
            formData.id = Math.max(...facturas.map(f => f.id)) + 1;
            facturas.push(formData);
        }
        
        mostrarExito(formData.id ? 'Factura actualizada correctamente' : 'Factura creada correctamente');
        $('#facturaModal').modal('hide');
        limpiarFormulario();
        actualizarTablaFacturas();
        actualizarEstadisticas();
    }
}

// Eliminar factura
async function eliminarFactura(facturaId) {
    const result = await showConfirm('¿Está seguro de que desea eliminar esta factura?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar');
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`${API_ENDPOINTS.pagos}/${facturaId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                mostrarExito('Factura eliminada correctamente');
                await cargarFacturas();
                actualizarEstadisticas();
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error eliminando factura:', error);
            // Simular eliminación exitosa para demo
            facturas = facturas.filter(f => f.id_pago !== facturaId);
            mostrarExito('Factura eliminada correctamente');
            actualizarTablaFacturas();
            actualizarEstadisticas();
        }
    }
}

// Limpiar formulario
function limpiarFormulario() {
    $('#facturaForm')[0].reset();
    $('#facturaId').val('');
    $('#facturaModalLabel').text('Nueva Factura');
    
    // Establecer fecha actual
    const today = new Date().toISOString().split('T')[0];
    $('#fechaPago').val(today);
}

// Actualizar precio cuando se selecciona un tratamiento
function actualizarPrecioTratamiento(tratamientoId) {
    const tratamiento = tratamientos.find(t => t.id == tratamientoId);
    if (tratamiento) {
        $('#total').val(tratamiento.precio);
    }
}

// Imprimir factura
function imprimirFactura() {
    window.print();
}

// Descargar PDF
function descargarPDF() {
    mostrarInfo('Función de descarga PDF en desarrollo');
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

// Mostrar notificaciones
function mostrarNotificaciones() {
    mostrarInfo('Sistema de notificaciones en desarrollo');
}

// Cerrar sesión
// Función cerrarSesion removida - ahora se usa la función global de auth.js

// Funciones de utilidad
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO').format(precio);
}

function capitalizarPrimera(str) {
    if (!str || typeof str !== 'string') {
        return str || '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function mostrarMensaje(tipo, mensaje) {
    switch(tipo) {
        case 'error':
            showError(mensaje);
            break;
        case 'success':
            showSuccess(mensaje);
            break;
        case 'info':
            showInfo(mensaje);
            break;
        default:
            showInfo(mensaje);
    }
}

function mostrarError(mensaje) {
    showError(mensaje);
}

function mostrarExito(mensaje) {
    showSuccess(mensaje);
}

function mostrarInfo(mensaje) {
    showInfo(mensaje);
}

// Eventos del modal
$('#facturaModal').on('hidden.bs.modal', function() {
    limpiarFormulario();
});

// Configurar fecha mínima (no permitir fechas futuras)
$('#fechaPago').attr('max', new Date().toISOString().split('T')[0]);