// routes/whatsapp.js
const express = require('express');
/ routes/whatsapp.js
const express = require('express');
const router = express.Router();
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inicializar el cliente de WhatsApp
const client = new Client({
    puppeteer: {
        headless: true,
    },
});

let receivedMessages = []; // Arreglo para almacenar los mensajes recibidos

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// Reglas básicas del chatbot
const basicResponses = {
    'hola': '¡Hola! ¿Cómo estás?',
    'adiós': '¡Adiós! Que tengas un buen día.',
    '¿cómo estás?': 'Estoy bien, gracias por preguntar.',
    'gracias': 'De nada, ¡estoy aquí para ayudarte!',
    'hora': `La hora actual es ${new Date().toLocaleTimeString()}.`,
    // Agrega más respuestas según lo que necesites
};

client.on('message_create', message => {
    console.log('Mensaje recibido:', message.body);

    // Guardar los mensajes entrantes
    receivedMessages.push({
        id: message.id._serialized,
        from: message.from,
        body: message.body,
        timestamp: message.timestamp,
    });

    // Respuesta automática a mensajes específicos
    const normalizedMessage = message.body.toLowerCase().trim(); // Normalizar el mensaje para evitar errores con mayúsculas
    if (basicResponses[normalizedMessage]) {
        message.reply(basicResponses[normalizedMessage]);
    } else if (message.body === '!ping') {
        message.reply('pong');
    }
});

client.initialize();

// Endpoint para enviar un mensaje
router.post('/send', async (req, res) => {
    const { numeroDestino, mensaje } = req.body;

    if (!numeroDestino || !mensaje) {
        return res.status(400).json({ error: 'Número de destino y mensaje son requeridos' });
    }

    try {
        const chatId = `${numeroDestino}@c.us`;
        const response = await client.sendMessage(chatId, mensaje);
        res.json({ message: 'Mensaje enviado', response });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
});

// Endpoint para obtener los mensajes recibidos
router.get('/messages', (req, res) => {
    res.json({ messages: receivedMessages });
});

module.exports = router;