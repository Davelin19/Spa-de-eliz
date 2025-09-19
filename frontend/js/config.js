// Configuración global
window.API_URL = 'http://localhost:5000';

// Configuración de DataTables
window.DATATABLES_CONFIG = {
    language: {
        url: 'js/datatables/es-ES.json'
    },
    responsive: true,
    pageLength: 10,
    lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
    order: [[0, 'desc']],
    searching: false
}; 