import { createApp } from './app.js';
import { config } from './config/env.js';
import { closeDb } from './db/connection.js';
import { runMigrations } from './db/migrate.js';

// Make sure the schema exists before the first request arrives.
runMigrations();

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.env})`);
  console.log(`Database: ${config.databaseFile}`);
});

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down.`);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
