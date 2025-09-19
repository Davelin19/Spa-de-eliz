import { showSuccess, showError } from './utils/notifications.js';

// ... existing code ... 

$(document).on('click', '.btn-edit-cliente', function() {
    const id = $(this).data('id');
    const cliente = clientes.find(c => c.id_cliente == id);
    if (cliente) {
        $('#edit_id_cliente').val(cliente.id_cliente);
        $('#edit_nombre').val(cliente.nombre);
        $('#edit_email').val(cliente.email);
        $('#edit_telefono').val(cliente.telefono);
        $('#edit_direccion').val(cliente.direccion);
        $('#edit_estado').val(cliente.estado);
        $('#modalEditarCliente').modal('show');
    }
}); 