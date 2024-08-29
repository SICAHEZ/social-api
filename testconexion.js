const { sql, connectToDB } = require('./dbConfig');

// Llamada a la función para conectar a la base de datos
connectToDB();

// Hacer una consulta
async function performQuery() {
    try {
      await connectToDB(); // Conexión
      const result = await sql.query('SELECT * FROM Anuncios');
      console.log(result.recordset);
    } catch (error) {
      console.error('Error al ejecutar la consulta:', error);
    }
  }

// Llamar a la función de consulta
performQuery().then(() => {
    sql.close();
});

process.on('exit', () => {
    sql.close();
  });