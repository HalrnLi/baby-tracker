import { Router, Response } from 'express';
import Baby from '../models/Baby';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// All baby routes require authentication
router.use(authMiddleware);

// GET /api/baby - Get all babies for current user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const babies = await Baby.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ babies });
  } catch (error) {
    console.error('Get babies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/baby - Create a new baby
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, birthDate, gender } = req.body;

    if (!name || !birthDate || !gender) {
      res.status(400).json({ error: 'name, birthDate, and gender are required' });
      return;
    }

    if (!['male', 'female'].includes(gender)) {
      res.status(400).json({ error: 'gender must be "male" or "female"' });
      return;
    }

    const baby = await Baby.create({
      name,
      birthDate,
      gender,
      userId: req.userId!,
    });

    res.status(201).json({ baby });
  } catch (error) {
    console.error('Create baby error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/baby/:id - Update a baby
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, birthDate, gender } = req.body;

    if (!name || !birthDate || !gender) {
      res.status(400).json({ error: 'name, birthDate, and gender are required' });
      return;
    }

    if (!['male', 'female'].includes(gender)) {
      res.status(400).json({ error: 'gender must be "male" or "female"' });
      return;
    }

    const baby = await Baby.findOne({ where: { id, userId: req.userId } });
    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    await baby.update({ name, birthDate, gender });
    res.json({ baby });
  } catch (error) {
    console.error('Update baby error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
