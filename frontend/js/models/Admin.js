import Database from './Database.js';

class Admin {
    static async getAll() {
        const sql = `
            SELECT id_admin, nombre, email, telefono, estado, ultimo_acceso 
            FROM administradores 
            ORDER BY nombre
        `;
        return await Database.query(sql);
    }

    static async getById(id) {
        const sql = `
            SELECT id_admin, nombre, email, telefono, estado, ultimo_acceso 
            FROM administradores 
            WHERE id_admin = ?
        `;
        const result = await Database.query(sql, [id]);
        return result[0];
    }

    static async create(data) {
        const sql = `
            INSERT INTO administradores (nombre, email, telefono, password, estado) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [
            data.nombre,
            data.email,
            data.telefono,
            data.password,
            data.estado || 'activo'
        ];
        return await Database.query(sql, params);
    }

    static async update(id, data) {
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
        if (data.password) {
            updates.push('password = ?');
            params.push(data.password);
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
            UPDATE administradores 
            SET ${updates.join(', ')} 
            WHERE id_admin = ?
        `;
        return await Database.query(sql, params);
    }

    static async delete(id) {
        const sql = 'DELETE FROM administradores WHERE id_admin = ?';
        return await Database.query(sql, [id]);
    }
}

export default Admin; 