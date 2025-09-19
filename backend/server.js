import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import { createPool } from 'mysql2/promise';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Configuración de CORS
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware para manejar errores CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(join(__dirname)));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/vendor', express.static(path.join(__dirname, 'vendor')));

// Configuración de la base de datos
const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'armony_stetic',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para hashear la contraseña
function hashPassword(password) {
    return createHash('sha256').update(password).digest('hex');
}

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'tu_clave_secreta');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// Ruta de login
app.post('/api/login', async (req, res) => {
    console.log('Recibida solicitud de login:', req.body);
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
        console.log('Credenciales incompletas');
        return res.status(400).json({
            success: false,
            error: 'Email y contraseña son requeridos'
        });
    }

    try {
        const hashedPassword = hashPassword(contrasena);
        console.log('Buscando usuario con email:', email);

        const [rows] = await pool.query(
            'SELECT * FROM administradores WHERE email = ? AND contrasena = ?',
            [email, hashedPassword]
        );

        console.log('Resultado de la consulta:', rows);

        if (rows.length > 0) {
            const admin = rows[0];
            // Generar un token simple (en producción usar JWT)
            const token = Buffer.from(admin.email + Date.now()).toString('base64');

            console.log('Login exitoso para:', admin.email);
            res.json({
                success: true,
                admin: {
                    id: admin.id,
                    nombre: admin.nombre,
                    email: admin.email,
                    rol: admin.rol
                },
                token: token
            });
        } else {
            console.log('Credenciales inválidas para:', email);
            res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Ruta para verificar el estado del servidor
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Ruta para obtener clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Clientes WHERE estado = "activo"');
        console.log('Clientes obtenidos:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Ruta para obtener tratamientos
app.get('/api/tratamientos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Tratamientos WHERE estado = "activo"');
        console.log('Tratamientos obtenidos:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener tratamientos:', error);
        res.status(500).json({ error: 'Error al obtener tratamientos' });
    }
});

// Ruta para obtener citas
app.get('/api/citas', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, cl.nombre as cliente_nombre, t.nombre as tratamiento_nombre 
            FROM Citas c 
            JOIN Clientes cl ON c.id_cliente = cl.id_cliente 
            JOIN Tratamientos t ON c.id_tratamiento = t.id_tratamiento 
            WHERE c.estado = "activo"
        `);
        console.log('Citas obtenidas:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ error: 'Error al obtener citas' });
    }
});

// Ruta para obtener servicios
app.get('/api/servicios', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, t.nombre as nombre_tratamiento 
            FROM Servicios s 
            JOIN Tratamientos t ON s.id_tratamiento = t.id_tratamiento 
            WHERE s.estado = "activo"
        `);
        console.log('Servicios obtenidos:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});

// Ruta para obtener reportes
app.get('/api/reportes', verifyToken, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT r.*, a.nombre as nombre_admin 
            FROM Reportes r 
            LEFT JOIN Administradores a ON r.id_admin = a.id_admin
            ORDER BY r.fecha_reporte DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener reportes' });
    }
});

// Ruta para consultas a la base de datos
app.post('/api/db', async (req, res) => {
    try {
        const { sql, params } = req.body;
        const connection = await mysql.createConnection(dbConfig);

        const [results] = await connection.execute(sql, params);
        await connection.end();

        res.json(results);
    } catch (error) {
        console.error('Error en la consulta:', error);
        res.status(500).json({ message: 'Error en la consulta a la base de datos' });
    }
});

// Rutas específicas para las páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/clientes', (req, res) => {
    res.sendFile(path.join(__dirname, 'clientes.html'));
});

app.get('/tratamientos', (req, res) => {
    res.sendFile(path.join(__dirname, 'tratamientos.html'));
});

app.get('/citas', (req, res) => {
    res.sendFile(path.join(__dirname, 'citas.html'));
});

app.get('/servicios', (req, res) => {
    res.sendFile(path.join(__dirname, 'servicios.html'));
});

app.get('/administradores', (req, res) => {
    res.sendFile(path.join(__dirname, 'administradores.html'));
});

// Ruta catch-all para manejar rutas no encontradas
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Iniciar el servidor
const startServer = (port) => {
    try {
        app.listen(port, () => {
            console.log(`Servidor corriendo en http://localhost:${port}`);
            console.log('Rutas disponibles:');
            console.log('- POST /api/login');
            console.log('- GET /api/status');
        });
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`Puerto ${port} en uso, intentando con puerto ${port + 1}`);
            startServer(port + 1);
        } else {
            console.error('Error al iniciar el servidor:', error);
        }
    }
};

startServer(port); 