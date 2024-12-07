// app/utils/rabbitmq.js

const amqp = require('amqplib');

const config = require('../../config/local.json');

let channel;

const connect = async () => {
  try {
    const connection = await amqp.connect({
      protocol: 'amqp',
      hostname: config.RABBITMQ_HOST || 'localhost',
      port: config.RABBITMQ_PORT || 5672,
      username: config.RABBITMQ_USER || 'guest',
      password: config.RABBITMQ_PASSWORD || 'guest',
    });
    channel = await connection.createChannel();
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ', error);
  }
};

const publishMessage = async (queue, message) => {
  if (!channel) {
    await connect();
  }
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(message));
};

module.exports = {
  connect,
  publishMessage,
};