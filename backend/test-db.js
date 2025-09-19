import mysql from 'mysql2/promise';

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'armony_stetic'
        });

        console.log('Conexión exitosa a la base de datos');

        // Probar consultas
        const [clientes] = await connection.execute('SELECT * FROM Clientes');
        console.log('Clientes:', clientes);

        const [tratamientos] = await connection.execute('SELECT * FROM Tratamientos');
        console.log('Tratamientos:', tratamientos);

        const [citas] = await connection.execute('SELECT * FROM Citas');
        console.log('Citas:', citas);

        const [administradores] = await connection.execute('SELECT * FROM Administradores');
        console.log('Administradores:', administradores);

        const [servicios] = await connection.execute('SELECT * FROM Servicios');
        console.log('Servicios:', servicios);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

testConnection(); 