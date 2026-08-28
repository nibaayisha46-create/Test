import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin/non-browser callers (curl, tests) which send no Origin.
        if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/users', userRoutes);
  app.use('/api/reports', reportRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
