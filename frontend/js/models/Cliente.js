import { fetchAPI } from '../config/api.js';

class Cliente {
    static async getAll() {
        try {
            return await fetchAPI('/clientes');
        } catch (error) {
            console.error('Error en getAll:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            return await fetchAPI(`/clientes/${id}`);
        } catch (error) {
            console.error('Error en getById:', error);
            throw error;
        }
    }

    static async create(data) {
        try {
            const sql = `
                INSERT INTO Clientes (nombre, email, telefono, direccion, estado, contrasena)
                VALUES (?, ?, ?, ?, ?, SHA2(?, 256))
            `;
            const params = [
                data.nombre,
                data.email,
                data.telefono,
                data.direccion,
                data.estado || 'activo',
                data.contrasena
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
            if (data.email) {
                updates.push('email = ?');
                params.push(data.email);
            }
            if (data.telefono) {
                updates.push('telefono = ?');
                params.push(data.telefono);
            }
            if (data.direccion) {
                updates.push('direccion = ?');
                params.push(data.direccion);
            }
            if (data.estado) {
                updates.push('estado = ?');
                params.push(data.estado);
            }
            if (data.contrasena) {
                updates.push('contrasena = SHA2(?, 256)');
                params.push(data.contrasena);
            }

            if (updates.length === 0) {
                return;
            }

            params.push(id);
            const sql = `
                UPDATE Clientes
                SET ${updates.join(', ')}
                WHERE id_cliente = ?
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
            const sql = 'DELETE FROM Clientes WHERE id_cliente = ?';
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

    static async login(email, contrasena) {
        try {
            const sql = `
                SELECT id_cliente, nombre, email, estado
                FROM Clientes
                WHERE email = ? AND contrasena = SHA2(?, 256)
            `;
            const results = await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params: [email, contrasena] })
            });
            return results[0];
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }
}

export default Cliente; 