import { Router, Response } from 'express';
import Baby from '../models/Baby';
import Reminder from '../models/Reminder';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// All reminder routes require authentication
router.use(authMiddleware);

// GET /api/reminders - Get all reminders for current user's babies
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const babies = await Baby.findAll({ where: { userId: req.userId } });
    const babyIds = babies.map((b) => b.id);

    if (babyIds.length === 0) {
      res.json({ reminders: [] });
      return;
    }

    const reminders = await Reminder.findAll({
      where: { babyId: babyIds },
      order: [['createdAt', 'DESC']],
    });

    res.json({ reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reminders - Create a new reminder
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId, type, intervalMinutes, enabled } = req.body;

    if (!babyId || !type || intervalMinutes === undefined) {
      res.status(400).json({ error: 'babyId, type, and intervalMinutes are required' });
      return;
    }

    if (!['pump', 'diaper'].includes(type)) {
      res.status(400).json({ error: 'type must be "pump" or "diaper"' });
      return;
    }

    if (typeof intervalMinutes !== 'number' || intervalMinutes <= 0) {
      res.status(400).json({ error: 'intervalMinutes must be a positive number' });
      return;
    }

    const baby = await Baby.findOne({ where: { id: babyId, userId: req.userId } });
    if (!baby) {
      res.status(403).json({ error: 'Access denied to this baby' });
      return;
    }

    const reminder = await Reminder.create({
      babyId,
      userId: req.userId!,
      type,
      intervalMinutes,
      enabled: enabled !== undefined ? enabled : true,
    });

    res.status(201).json({ reminder });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reminders/:id - Update a reminder
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { intervalMinutes, enabled } = req.body;

    const reminder = await Reminder.findByPk(id);
    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    // Verify the baby belongs to the current user
    const baby = await Baby.findOne({ where: { id: reminder.babyId, userId: req.userId } });
    if (!baby) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (intervalMinutes !== undefined) {
      if (typeof intervalMinutes !== 'number' || intervalMinutes <= 0) {
        res.status(400).json({ error: 'intervalMinutes must be a positive number' });
        return;
      }
      reminder.intervalMinutes = intervalMinutes;
    }

    if (enabled !== undefined) {
      reminder.enabled = enabled;
    }

    await reminder.save();
    res.json({ reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/reminders/:id - Delete a reminder
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const reminder = await Reminder.findByPk(id);
    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    const baby = await Baby.findOne({ where: { id: reminder.babyId, userId: req.userId } });
    if (!baby) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await reminder.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/reminders/:id/trigger - Mark reminder as triggered (update lastTriggered)
router.patch('/:id/trigger', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const reminder = await Reminder.findByPk(id);
    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    // Verify the baby belongs to the current user
    const baby = await Baby.findOne({ where: { id: reminder.babyId, userId: req.userId } });
    if (!baby) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    reminder.lastTriggered = new Date();
    await reminder.save();

    res.json({ reminder });
  } catch (error) {
    console.error('Trigger reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
