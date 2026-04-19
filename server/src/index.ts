import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, syncDatabase } from './config/database';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,  // 允许所有来源，方便手机测试
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    // Just check that the app is running
    res.json({
      status: 'ok',
      apiVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

async function start(): Promise<void> {
  try {
    await connectDatabase();
    await syncDatabase(false, true);
    app.listen(PORT, () => {
      console.log(`🚀 Baby Tracker API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
