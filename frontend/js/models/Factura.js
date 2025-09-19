class Factura {
    static async getAll() {
        try {
            const response = await fetch('/api/facturas');
            if (!response.ok) throw new Error('Error al obtener las facturas');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`/api/facturas/${id}`);
            if (!response.ok) throw new Error('Error al obtener la factura');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    static async create(factura) {
        try {
            const response = await fetch('/api/facturas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(factura)
            });
            if (!response.ok) throw new Error('Error al crear la factura');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    static async update(id, factura) {
        try {
            const response = await fetch(`/api/facturas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(factura)
            });
            if (!response.ok) throw new Error('Error al actualizar la factura');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const response = await fetch(`/api/facturas/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar la factura');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}

export default Factura; 