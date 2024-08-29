// Configuración de la conexión a la base de datos
const sql = require('mssql');

    const config = {
      user: 'dev',
      password: 'bati-cueva22',
      server: 'localhost',
      database: 'SICAH_PRIMARYKEY',
      options: {
        encrypt: false
      }
    };

// Función para conectar a la base de datos
async function connectToDB() {
  try {
    await sql.connect(config);
    console.log('Conexión exitosa a la base de datos.');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

module.exports = { sql, connectToDB };