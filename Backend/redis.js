// redis.js

const redis = require('redis');
const { promisify } = require('util');

let client;

function createClient() {
  client = redis.createClient({
    url: 'redis://redis:6379', // redis://127.0.0.1:6379
    legacyMode: true
    //host: process.env.REDIS_HOST || '127.0.0.1'
  });

  client.on('error', (error) => {
    console.error('Redis error:', error);
  });

  const getAsync = promisify(client.get).bind(client);
  const setAsync = promisify(client.set).bind(client);
  const lRange = promisify(client.lrange).bind(client);
  const rPushX = promisify(client.rpush).bind(client);
  const Keyexists = promisify(client.exists).bind(client);

  return { get: getAsync, set: setAsync, lRange, rPushX, Keyexists, redisClient: client };
}

module.exports = {
  createClient
};

