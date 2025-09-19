import { fetchAPI } from '../config/api.js';

class Administrador {
    static async getAll() {
        try {
            const sql = `
                SELECT id_admin, nombre, email, telefono, estado
            FROM Administradores 
            ORDER BY nombre
        `;
            return await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params: [] })
            });
        } catch (error) {
            console.error('Error en getAll:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const sql = `
                SELECT id_admin, nombre, email, telefono, estado
            FROM Administradores 
            WHERE id_admin = ?
        `;
            const results = await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params: [id] })
            });
            return results[0];
        } catch (error) {
            console.error('Error en getById:', error);
            throw error;
        }
    }

    static async create(data) {
        try {
            const sql = `
            INSERT INTO Administradores (nombre, email, telefono, estado, contrasena) 
            VALUES (?, ?, ?, ?, SHA2(?, 256))
        `;
            const params = [
                data.nombre,
                data.email,
                data.telefono,
                data.estado || 'activo',
                data.contrasena || '123456' // Contraseña por defecto
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
            UPDATE Administradores 
            SET ${updates.join(', ')} 
            WHERE id_admin = ?
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
            const sql = 'DELETE FROM Administradores WHERE id_admin = ?';
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

    static async login(email, password) {
        try {
            const sql = `
                SELECT id_admin, nombre, email, telefono, estado
            FROM Administradores 
                WHERE email = ? AND contrasena = SHA2(?, 256) AND estado = 'activo'
            `;
            const results = await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params: [email, password] })
            });

            if (results.length === 0) {
                throw new Error('Credenciales inválidas');
            }

            const admin = results[0];

            // Guardar datos del administrador en sessionStorage
            sessionStorage.setItem('admin', JSON.stringify(admin));

            return admin;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    static async logout() {
        try {
            // Limpiar sessionStorage
            sessionStorage.removeItem('admin');
            return true;
        } catch (error) {
            console.error('Error en logout:', error);
            throw error;
        }
    }

    static isAuthenticated() {
        return !!sessionStorage.getItem('admin');
    }
}

export default Administrador; 