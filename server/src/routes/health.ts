import { Router, Request, Response } from 'express';
import sequelize from '../config/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      database: 'connected',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      error: (err as Error).message
    });
  }
});

export default router;
