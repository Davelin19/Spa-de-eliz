// Configuración de la API
const API_URL = 'http://localhost:5000';

// Función para formatear fechas
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Función para formatear horas
function formatTime(timeString) {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // Formato HH:mm
}

// Función para mostrar errores
function showError(message) {
    console.error(message);
    // Mostrar el error con el sistema de notificaciones moderno
    if (typeof window.showError === 'function') {
        window.showError(message);
    }
}

// Función para cargar tratamientos
async function loadTratamientos() {
    try {
        const response = await fetch(`${API_URL}/api/tratamientos`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Respuesta de tratamientos:', result);

        // Verificar que la respuesta tenga la estructura correcta
        if (!result.success || !Array.isArray(result.data)) {
            throw new Error('Formato de respuesta inválido');
        }

        const tratamientos = result.data;
        const tbody = document.querySelector('#tratamientosTable tbody');
        if (!tbody) {
            console.error('No se encontró el elemento tbody en la tabla de tratamientos');
            return;
        }
        tbody.innerHTML = '';

        tratamientos.forEach(tratamiento => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tratamiento.id_tratamiento}</td>
                <td>${tratamiento.nombre}</td>
                <td>${tratamiento.descripcion}</td>
                <td>${tratamiento.duracion} min</td>
                <td>$${tratamiento.precio}</td>
                <td>${tratamiento.estado}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editTratamiento(${tratamiento.id_tratamiento})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTratamiento(${tratamiento.id_tratamiento})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Estadísticas dinámicas - verificar que existan los elementos
        const totalTratamientosEl = document.getElementById('totalTratamientos');
        const tratamientosActivosEl = document.getElementById('tratamientosActivos');
        const tratamientosInactivosEl = document.getElementById('tratamientosInactivos');
        const sumaPreciosEl = document.getElementById('sumaPrecios');

        if (totalTratamientosEl) totalTratamientosEl.textContent = tratamientos.length;
        
        const activos = tratamientos.filter(t => t.estado === 'activo').length;
        const inactivos = tratamientos.filter(t => t.estado === 'inactivo').length;
        
        if (tratamientosActivosEl) tratamientosActivosEl.textContent = activos;
        if (tratamientosInactivosEl) tratamientosInactivosEl.textContent = inactivos;
        
        const sumaPrecios = tratamientos.reduce((sum, t) => sum + (parseFloat(t.precio) || 0), 0);
        if (sumaPreciosEl) sumaPreciosEl.textContent = `$${sumaPrecios.toFixed(2)}`;

        // DataTable initialization is handled by tratamientos.js
        // No need to initialize here to avoid conflicts
    } catch (error) {
        console.error('Error al cargar tratamientos:', error);
        showError('Error al cargar los tratamientos');
    }
}

// Función para cargar citas
async function loadCitas() {
    try {
        const response = await fetch(`${API_URL}/api/citas`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Citas cargadas:', result);

        // Verificar que la respuesta tenga la estructura correcta
        if (!result.success || !Array.isArray(result.data)) {
            throw new Error('Formato de respuesta inválido');
        }

        const citas = result.data;
        const tbody = document.querySelector('#citasTable tbody');
        if (!tbody) {
            console.error('No se encontró el elemento tbody en la tabla de citas');
            return;
        }
        tbody.innerHTML = '';

        citas.forEach(cita => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cita.id_cita}</td>
                <td>${cita.cliente_nombre || 'N/A'}</td>
                <td>${cita.tratamiento_nombre || 'N/A'}</td>
                <td>${formatDate(cita.fecha)}</td>
                <td>${formatTime(cita.hora)}</td>
                <td>${cita.estado}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editCita(${cita.id_cita})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCita(${cita.id_cita})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Estadísticas dinámicas
        document.getElementById('totalCitas').textContent = citas.length;
        const programadas = citas.filter(c => c.estado === 'programada').length;
        const completadas = citas.filter(c => c.estado === 'completada').length;
        const canceladas = citas.filter(c => c.estado === 'cancelada').length;
        
        // Actualizar estadísticas si existen los elementos
        const totalCitasEl = document.getElementById('totalCitas');
        const programadasEl = document.getElementById('citasProgramadas');
        const completadasEl = document.getElementById('citasCompletadas');
        const canceladasEl = document.getElementById('citasCanceladas');
        
        if (totalCitasEl) totalCitasEl.textContent = citas.length;
        if (programadasEl) programadasEl.textContent = programadas;
        if (completadasEl) completadasEl.textContent = completadas;
        if (canceladasEl) canceladasEl.textContent = canceladas;

        // DataTable initialization is handled by citas.js
        // No need to initialize here to avoid conflicts
    } catch (error) {
        console.error('Error al cargar citas:', error);
        showError('Error al cargar las citas');
    }
}

// Función para cargar clientes - REMOVIDA
// La funcionalidad de clientes ahora se maneja en clientes.js

// Función para cargar facturas
async function loadFacturas() {
    try {
        const response = await fetch(`${API_URL}/api/facturas`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const facturas = await response.json();
        console.log('Facturas cargadas:', facturas);

        const tbody = document.querySelector('#facturasTable tbody');
        if (!tbody) {
            console.error('No se encontró el elemento tbody en la tabla de facturas');
            return;
        }
        tbody.innerHTML = '';

        facturas.forEach(factura => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${factura.id_factura}</td>
                <td>${factura.nombre_cliente}</td>
                <td>${formatDate(factura.fecha)}</td>
                <td>$${factura.monto}</td>
                <td>${factura.estado}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editFactura(${factura.id_factura})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFactura(${factura.id_factura})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Estadísticas dinámicas
        document.getElementById('totalFacturas').textContent = facturas.length;
        const activas = facturas.filter(f => f.estado === 'activa').length;
        const inactivas = facturas.filter(f => f.estado === 'inactiva').length;
        document.getElementById('facturasActivas').textContent = activas;
        document.getElementById('facturasInactivas').textContent = inactivas;
        const ingresos = facturas.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
        document.getElementById('ingresosTotales').textContent = `$${ingresos.toFixed(2)}`;

        // Destruir DataTable antes de vaciar tbody
        const tableFacturas = $('#facturasTable');
        if (tableFacturas.length && tableFacturas.find('tbody').length && $.fn.DataTable.isDataTable('#facturasTable')) {
            try {
                tableFacturas.DataTable().destroy();
            } catch (error) {
                console.warn('Error al destruir DataTable facturas:', error);
            }
        }
        $('#facturasTable tbody').empty();
        $('#facturasTable').DataTable({
            language: {
                url: 'js/datatables/es-ES.json'
            }
        });
    } catch (error) {
        console.error('Error al cargar facturas:', error);
        showError('Error al cargar las facturas');
    }
}

// Función para cargar reportes
async function loadReportes() {
    try {
        const response = await fetch(`${API_URL}/api/reportes`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Reportes cargados:', result);

        // Verificar que la respuesta tenga la estructura correcta
        if (!result.success || !Array.isArray(result.data)) {
            throw new Error('Formato de respuesta inválido');
        }

        const reportes = result.data;
        const tbody = document.querySelector('#reportesTable tbody');
        if (!tbody) {
            console.error('No se encontró el elemento tbody en la tabla de reportes');
            return;
        }
        tbody.innerHTML = '';

        reportes.forEach(reporte => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reporte.id_reporte}</td>
                <td>${reporte.titulo}</td>
                <td>${formatDate(reporte.fecha_reporte)}</td>
                <td>${reporte.tipo}</td>
                <td>${reporte.estado}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editReporte(${reporte.id_reporte})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReporte(${reporte.id_reporte})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Estadísticas dinámicas - verificar que existan los elementos
        const totalReportesEl = document.getElementById('totalReportes');
        const ultimoReporteEl = document.getElementById('ultimoReporte');
        
        if (totalReportesEl) totalReportesEl.textContent = reportes.length;
        if (ultimoReporteEl) {
            ultimoReporteEl.textContent = reportes.length > 0 ? formatDate(reportes[0].fecha_reporte) : '-';
        }

        // DataTable initialization is handled by reportes.js
        // No need to initialize here to avoid conflicts
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        showError('Error al cargar los reportes');
    }
}

// Función para cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        // Cargar estadísticas de clientes
        const clientesResponse = await fetch(`${API_URL}/api/clientes`);
        if (clientesResponse.ok) {
            const result = await clientesResponse.json();
            if (result.success && Array.isArray(result.data)) {
                const totalClientes = document.getElementById('totalClientes');
                if (totalClientes) {
                    totalClientes.textContent = result.data.length;
                }
            }
        }

        // Cargar estadísticas de citas del día
        const citasResponse = await fetch(`${API_URL}/api/citas`);
        if (citasResponse.ok) {
            const result = await citasResponse.json();
            if (result.success && Array.isArray(result.data)) {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                const citasHoy = result.data.filter(cita => {
                    const citaDate = new Date(cita.fecha);
                    const citaDateStr = citaDate.toISOString().split('T')[0];
                    return citaDateStr === todayStr;
                });
                const totalCitas = document.getElementById('totalCitas');
                if (totalCitas) {
                    totalCitas.textContent = citasHoy.length;
                }
            }
        }

        // Cargar estadísticas de tratamientos activos
        const tratamientosResponse = await fetch(`${API_URL}/api/tratamientos`);
        if (tratamientosResponse.ok) {
            const result = await tratamientosResponse.json();
            if (result.success && Array.isArray(result.data)) {
                const tratamientosActivos = result.data.filter(t => t.estado === 'activo');
                const totalTratamientos = document.getElementById('totalTratamientos');
                if (totalTratamientos) {
                    totalTratamientos.textContent = tratamientosActivos.length;
                }
            }
        }

        // No cargar reportes ya que no existe ese endpoint
        const totalReportes = document.getElementById('totalReportes');
        if (totalReportes) {
            totalReportes.textContent = '0';
        }

    } catch (error) {
        console.error('Error cargando estadísticas del dashboard:', error);
        showError('Error al cargar las estadísticas del dashboard');
    }
}

// Cargar datos cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado, verificando página actual...');
    // Determinar qué tabla cargar basado en la página actual
    const currentPage = window.location.pathname.split('/').pop();
    console.log('Página actual:', currentPage);

    switch (currentPage) {
        case 'tratamientos.html':
            console.log('Cargando tratamientos...');
            loadTratamientos();
            break;
        case 'citas.html':
            console.log('Cargando citas...');
            loadCitas();
            break;
        case 'clientes.html':
            console.log('Página de clientes - funcionalidad manejada por clientes.js');
            break;
        case 'facturas.html':
            console.log('Cargando facturas...');
            loadFacturas();
            break;
        case 'reportes.html':
            console.log('Cargando reportes...');
            loadReportes();
            break;
        case 'home.html':
            console.log('Cargando estadísticas del dashboard...');
            loadDashboardStats();
            break;
        default:
            console.log('Página no reconocida:', currentPage);
    }
});