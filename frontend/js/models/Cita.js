import { fetchAPI } from '../config/api.js';

class Cita {
    static async getAll() {
        try {
            return await fetchAPI('/citas');
        } catch (error) {
            console.error('Error en getAll:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            return await fetchAPI(`/citas/${id}`);
        } catch (error) {
            console.error('Error en getById:', error);
            throw error;
        }
    }

    static async create(cita) {
        try {
            const sql = `
                INSERT INTO citas (id_cliente, id_tratamiento, fecha, hora, estado)
                VALUES (?, ?, ?, ?, ?)
            `;
            const result = await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({
                    sql,
                    params: [
                        cita.id_cliente,
                        cita.id_tratamiento,
                        cita.fecha,
                        cita.hora,
                        cita.estado || 'pendiente'
                    ]
                })
            });
            return result.insertId;
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    }

    static async update(id, cita) {
        try {
            const sql = `
                UPDATE citas
                SET id_cliente = ?,
                    id_tratamiento = ?,
                    fecha = ?,
                    hora = ?,
                    estado = ?
                WHERE id_cita = ?
            `;
            const result = await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({
                    sql,
                    params: [
                        cita.id_cliente,
                        cita.id_tratamiento,
                        cita.fecha,
                        cita.hora,
                        cita.estado,
                        id
                    ]
                })
            });
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const sql = `
                DELETE FROM citas
                WHERE id_cita = ?
            `;
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

    static async getByCliente(idCliente) {
        try {
            const sql = `
                SELECT c.id_cita, c.id_cliente, c.id_tratamiento, c.fecha, c.hora, c.estado,
                       cl.nombre as nombre_cliente,
                       t.nombre as nombre_tratamiento
                FROM citas c
                JOIN clientes cl ON c.id_cliente = cl.id_cliente
                JOIN tratamientos t ON c.id_tratamiento = t.id_tratamiento
                WHERE c.id_cliente = ?
                ORDER BY c.fecha DESC, c.hora DESC
            `;
            return await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params: [idCliente] })
            });
        } catch (error) {
            console.error('Error en getByCliente:', error);
            throw error;
        }
    }

    static async getByTratamiento(idTratamiento) {
        try {
            const sql = `
                SELECT c.id_cita, c.id_cliente, c.id_tratamiento, c.fecha, c.hora, c.estado,
                       cl.nombre as nombre_cliente,
                       t.nombre as nombre_tratamiento
                FROM citas c
                JOIN clientes cl ON c.id_cliente = cl.id_cliente
                JOIN tratamientos t ON c.id_tratamiento = t.id_tratamiento
                WHERE c.id_tratamiento = ?
                ORDER BY c.fecha DESC, c.hora DESC
            `;
            return await fetchAPI('/db', {
                method: 'POST',
                body: JSON.stringify({ sql, params: [idTratamiento] })
            });
        } catch (error) {
            console.error('Error en getByTratamiento:', error);
            throw error;
        }
    }
}

export default Cita; 