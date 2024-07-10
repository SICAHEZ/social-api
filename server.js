const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', (req, res) => {
  const number = req.body.number; 
  const text = req.body.text;

  client.isRegisteredUser(number).then(function (isRegistered) {
    if (isRegistered) {
      client.sendMessage(number, text);
    }
  });

  res.send('Mensaje enviado correctamente.'); 
});

app.listen(port, () => {
    console.log(`Servidor Node.js escuchando en el puerto ${port}`);
});

app.use(express.urlencoded({ extended: true })); // Configura 'express' para procesar datos de formulario

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/wapp.html'); // Enruta la ruta raíz del servidor al archivo 'index.html'
});

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

client.on('qr', (qr) => {
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
    message.reply('Hola! Bienvenido al sistema de comunicaciones de Capital Humano de ESIME Zacatenco. ¿Cómo puedo ayudarte hoy? \n Tienes las siguientes opciones para elegir: \n \n 1) Escribe "Horarios" para consultar los horarios de servicio de Capital Humano. \n 2) Escribe "Faltas" para verificar tus inasistencias. \n 3) Escribe "Avisos" para recibir anuncios generales. \n Escribe un 0 (cero) para cerrar tu sesión.');
  } else if (txt === '1' || txt === 'horarios') { // Cambio en la comparación de 'horarios'
    message.reply('Nuestro horario de oficina es de 9:00 AM a 5:00 PM, de lunes a viernes. Estamos cerrados los fines de semana y días festivos.');
    message.reply('¿Te gustaría realizar otra consulta? Puedes escribir "Hola" para volver a comenzar.');
  } else if (txt === '2' || txt === 'faltas') { // Cambio en la comparación de 'faltas'
    message.reply('Para proteger la privacidad de los empleados, necesito que proporciones algunos detalles de verificación. Por favor, ingresa tu CURP');
  } else if (txt === '3' || txt === 'avisos') { // Cambio en la comparación de 'avisos'
    message.reply('No hay avisos por el momento');
    message.reply('¿Te gustaría realizar otra consulta? Puedes escribir "Hola" para volver a comenzar.');
    // Agrega el flujo para la solicitud especial al final del bloque listenMessage
  } else if (txt === '0' || txt === 'adios' || txt === 'adiós' || txt === 'cerrar' || txt === 'cerrar sesion' || txt === 'cerrar sesión' || txt === 'salir' || txt === 'salir de la sesion' || txt === 'salir de la sesión' || txt === 'salir de sesion' || txt === 'salir de sesión' || txt === 'bye') {
    message.reply('Sesión finalizada, Hasta luego');
    sendGoodbyeMessage(message.from); // Corrección aquí: usar 'message.from' en lugar de 'to'
  } else {
    message.reply('Lamento informarte que no puedo ayudar con esa solicitud específica. Por favor selecciona alguna de las opciones disponibles o bien contacta a nuestro equipo de Capital Humano para obtener más ayuda.');
    message.reply('¿Te gustaría realizar otra consulta? Puedes escribir "Hola" para volver a comenzar.');
  }

  console.log(txt);
});
