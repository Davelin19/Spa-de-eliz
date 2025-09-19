import { fetchAPI } from '../config/api.js';

class Tratamiento {
    static async getAll() {
        try {
            return await fetchAPI('/tratamientos');
        } catch (error) {
            console.error('Error en getAll:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            return await fetchAPI(`/tratamientos/${id}`);
        } catch (error) {
            console.error('Error en getById:', error);
            throw error;
        }
    }

    static async create(data) {
        try {
            const sql = `
                INSERT INTO tratamientos (nombre, descripcion, duracion, precio, estado)
                VALUES (?, ?, ?, ?, ?)
            `;
            const params = [
                data.nombre,
                data.descripcion,
                data.duracion,
                data.precio,
                data.estado || 'activo'
            ];
            const result = await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params })
            });
            return result.insertId;
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    }

    static async update(id, data) {
        try {
            const updates = [];
            const params = [];

            if (data.nombre) {
                updates.push('nombre = ?');
                params.push(data.nombre);
            }
            if (data.descripcion) {
                updates.push('descripcion = ?');
                params.push(data.descripcion);
            }
            if (data.duracion) {
                updates.push('duracion = ?');
                params.push(data.duracion);
            }
            if (data.precio) {
                updates.push('precio = ?');
                params.push(data.precio);
            }
            if (data.estado) {
                updates.push('estado = ?');
                params.push(data.estado);
            }

            if (updates.length === 0) {
                return;
            }

            params.push(id);
            const sql = `
                UPDATE tratamientos
                SET ${updates.join(', ')}
                WHERE id_tratamiento = ?
            `;
            const result = await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params })
            });
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const sql = 'DELETE FROM tratamientos WHERE id_tratamiento = ?';
            const result = await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params: [id] })
            });
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en delete:', error);
            throw error;
        }
    }
}

export default Tratamiento; 