import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig(process.env);
const app = buildApp();

await app.listen({ port: config.PORT, host: config.HOST });
