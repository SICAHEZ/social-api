const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const { sql, connectToDB } = require('./dbConfig');
const MessageMedia = require('./src/structures/MessageMedia');

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/sendMessage', async (req, res) => {
  console.log(req.body);
  try {
    // Envía un mensaje 'enviando' al frontend antes de realizar las acciones
    //res.status(200).json({ status: 'enviando' });
    // Conecta a la base de datos antes de realizar la consulta
    await connectToDB();

    let numeros = [];

    if (req.body.name && req.body.name.length > 0) {
      // Elimina espacios adicionales antes de dividir la cadena name en partes usando la coma como separador
      const namesArray = req.body.name.map(name => name.trim());
      
      // Si se proporcionó el campo name, realiza una consulta en la tabla datos_personales para cada nombre
      for (const name of namesArray) {
        console.log(name);
        const sqlQueryName = `SELECT TELCASA FROM datos_personales WHERE NOMBRE = '${name.trim()}'`;
        const consulta_telefonos_name = await sql.query(sqlQueryName);
        numeros = numeros.concat(consulta_telefonos_name.recordset.map(row => row.TELCASA));
      }
    }

    if (req.body.opciones && req.body.opciones.length > 0) {
      // Si se proporcionaron opciones, realiza la consulta en la tabla PruebasWA
      const opcionesStr = "'" + req.body.opciones.join("','") + "'";
      const sqlQueryOptions = `SELECT Numero FROM PruebasWA WHERE TIPO IN (${opcionesStr})`;
      const consulta_telefonos_options = await sql.query(sqlQueryOptions);
      numeros = numeros.concat(consulta_telefonos_options.recordset.map(row => row.Numero));
    }
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const getRandomDelay = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1) + min) * 1000; // Genera un tiempo aleatorio en milisegundos
    };

    for (let i = 0; i < numeros.length; i++) {
      const number = numeros[i];
      // Verifica que el número tenga exactamente 10 dígitos antes de formatearlo
      if (/^\d{10}$/.test(number)) {
        const formattedNumber = '521' + number + '@c.us';
        console.log(formattedNumber);

        // Realiza las acciones necesarias con los números formateados
        const isRegistered = await client.isRegisteredUser(formattedNumber);

        if (isRegistered) {
          const delayTime = getRandomDelay(15, 45);
          await delay(delayTime);
          await client.sendMessage(formattedNumber, req.body.text);
        }
      } else {
        console.log(`Número no válido: ${number}`);
      }
    };

    res.status(200).json({ status: 'enviados', message: 'Mensajes enviados correctamente.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor' });        
  }
});

app.post('/notificar-incidencia', async (req, res) => {
  try {
    console.log(req.body);
    // Conecta a la base de datos antes de realizar la consulta
    await connectToDB();

    // Realiza la consulta en la tabla datos_personales para obtener el TELCASA asociado al RFC
    const { rfc, fecha, incidencias } = req.body;
    const sqlQueryRFC = `SELECT TELCASA, NOMBRE FROM datos_personales WHERE RFC = '${rfc}'`;
    const consulta_telefonos_rfc = await sql.query(sqlQueryRFC);

    // Verifica si se obtuvo un número de teléfono válido
    if (consulta_telefonos_rfc.recordset.length > 0) {
      const telefono = consulta_telefonos_rfc.recordset[0].TELCASA;
      const nombre = consulta_telefonos_rfc.recordset[0].NOMBRE;

      // Formatea el número de teléfono y realiza las acciones necesarias
      if (/^\d{10}$/.test(telefono)) {
        const formattedNumber = '521' + telefono + '@c.us';
        console.log(formattedNumber);

        // Realiza las acciones necesarias con el número formateado (enviar mensaje de WhatsApp)
        const mensaje = `Hola ${nombre}, se ha registrado una incidencia el día ${fecha}, de tipo ${incidencias}. Tienes tres días para justificar la incidencia.`;

        const isRegistered = await client.isRegisteredUser(formattedNumber);

        if (isRegistered) {
          await client.sendMessage(formattedNumber, mensaje);
        }

        res.status(200).json({ message: 'Mensaje de WhatsApp enviado correctamente.' });
      } else {
        console.log(`Número de teléfono no válido: ${telefono}`);
        res.status(400).json({ message: 'Número de teléfono no válido.' });
      }
    } else {
      console.log(`No se encontró un registro para el RFC: ${rfc}`);
      res.status(404).json({ message: 'No se encontró un registro para el RFC proporcionado.' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.listen(port, () => {
    console.log(`Servidor Node.js escuchando en el puerto ${port}`);
});

app.use(express.urlencoded({ extended: true })); // Configura 'express' para procesar datos de formulario

app.use(express.static('public'));


const { Client, LocalAuth } = require('./index');
const wwebVersion = '2.2412.54';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false
  },
  webVersionCache: {
    type: 'remote',
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
  }
});
client.initialize();

client.on('loading_screen', (percent, message) => {
  console.log('LOADING SCREEN', percent, message);
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
  console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
  console.log('Client is ready!'); 
});

const sendGoodbyeMessage = (to) => {
  const goodbyeMessage = "¡Gracias por usar nuestro asistente de Capital Humano! ¡Que tengas un excelente día!";
  client.sendMessage(to, goodbyeMessage);
};

// Evento 'message': se activa cuando se recibe un mensaje
client.on('message', async (message) => {
  let txt = message.body.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase(); // Obtén el contenido del mensaje
  
  console.log(message.body); // Imprime en la consola el contenido de cada mensaje que recibe el cliente de 'whatsapp-web.js'
 
  // Algoritmo de detección de mensajes
  // Saludo
  if (txt === 'hola' || txt === 'ola' || txt === 'buenos dias' || txt === 'buenas tardes' || txt === 'buenas noches' || txt === 'buen dia' || txt === '?') {
    client.sendMessage(message.from,'Hola! Bienvenido al sistema de comunicaciones de Capital Humano de ESIME Zacatenco. ¿Cómo puedo ayudarte hoy? \n Tienes las siguientes opciones para elegir: \n \n 1) Escribe "Horarios" para consultar los horarios de servicio de Capital Humano. \n 2) Escribe "Avisos" para recibir anuncios generales.');
  } else if (txt === '1' || txt === 'horarios') { // Cambio en la comparación de 'horarios'
    client.sendMessage(message.from,'Nuestro horario de oficina es de 9:00 AM a 5:00 PM, de lunes a viernes. Estamos cerrados los fines de semana y días festivos.');
    client.sendMessage(message.from,'¿Te gustaría realizar otra consulta? Puedes escribir "Hola" para volver a comenzar.');
 } else if (txt === '2' || txt === 'avisos') {
    await sendAnuncios(message);
  } else {
    client.sendMessage(message.from,'Lamento informarte que no puedo ayudar con esa solicitud específica. Por favor selecciona alguna de las opciones disponibles o bien contacta a nuestro equipo de Capital Humano para obtener más ayuda.');
    client.sendMessage(message.from,'¿Te gustaría realizar otra consulta? Puedes escribir "Hola" para volver a comenzar.');
  }

  console.log(txt);
});

async function sendAnuncios(message) {
  try {
    await connectToDB(); // Usa la configuración importada
    const result = await sql.query('SELECT anuncio, img_name FROM Anuncios');

    const sendMessagePromises = [];

    if (result.recordset.length > 0) {
      // Si hay anuncios, envía cada uno de ellos por separado
      result.recordset.forEach(async (row) => {
        const anuncio = row.anuncio;
        if (row.img_name) {
          // Si hay una imagen asociada, crea un objeto MessageMedia y envíalo
          const filePath = `C:/xampp/htdocs/sicah-web/imgadd/${row.img_name}`;
          const media = MessageMedia.fromFilePath(filePath);
          sendMessagePromises.push(client.sendMessage(message.from, media, { caption: anuncio }));
        } else {
          // Si no hay imagen asociada, solo envía el texto del anuncio
          sendMessagePromises.push(client.sendMessage(message.from, anuncio));
        }
      });

      // Espera a que todos los mensajes se hayan enviado antes de enviar la pregunta
      await Promise.all(sendMessagePromises);

      await client.sendMessage(message.from, '¿Te gustaría realizar otra consulta? Puedes escribir "Hola" para volver a comenzar.');
    } else {
      // Si no hay anuncios, envía un mensaje indicando que no hay avisos
      client.sendMessage(message.from, 'No hay avisos por el momento.');
      await client.sendMessage(message.from, '¿Te gustaría realizar otra consulta? Puedes escribir "Hola" para volver a comenzar.');
    }
  } catch (err) {
    console.error(err);
    message.reply('Ocurrió un error al consultar la base de datos.');
  }
}
