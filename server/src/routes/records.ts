import { Router, Response } from 'express';
import Baby from '../models/Baby';
import RecordModel, { RecordType } from '../models/Record';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// All record routes require authentication
router.use(authMiddleware);

// GET /api/records - Get all records for current user's babies
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby_id, type } = req.query;

    // Get all babies belonging to the current user
    const babies = await Baby.findAll({ where: { userId: req.userId } });
    const babyIds = babies.map((b) => b.id);

    // For pump records, babyId is not required - they can be queried without baby_id
    const isPumpOnly = type === 'pump' && !baby_id;

    if (babyIds.length === 0 && !isPumpOnly) {
      res.json({ records: [] });
      return;
    }

    const whereClause: Record<string, unknown> = {};

    // For pump without baby_id, return all pump records (including those without babyId)
    // For other types or pump with baby_id, filter by babyId
    if (isPumpOnly) {
      // Return all pump records for this user (with or without babyId)
      whereClause.type = 'pump';
      whereClause.userId = req.userId;
    } else {
      whereClause.babyId = babyIds;

      if (baby_id) {
        if (!babyIds.includes(baby_id as string)) {
          res.status(403).json({ error: 'Access denied to this baby' });
          return;
        }
        whereClause.babyId = baby_id;
      }

      if (type) {
        if (!['feed', 'pump', 'diaper', 'weight'].includes(type as string)) {
          res.status(400).json({ error: 'Invalid type. Must be feed, pump, diaper, or weight' });
          return;
        }
        whereClause.type = type;
      }
    }

    const records = await RecordModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Baby, as: 'baby', attributes: ['id', 'name'] },
      ],
    });

    res.json({ records });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/records - Create a new record
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId, type, data } = req.body;

    if (!type || !data) {
      res.status(400).json({ error: 'type and data are required' });
      return;
    }

    const validTypes: RecordType[] = ['feed', 'pump', 'diaper', 'weight'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: 'type must be feed, pump, diaper, or weight' });
      return;
    }

    // For pump records, babyId is optional (pumping is mother's activity)
    // For other types, babyId is required
    if (type !== 'pump') {
      if (!babyId) {
        res.status(400).json({ error: 'babyId is required for feed, diaper, and weight records' });
        return;
      }

      // Verify baby belongs to current user
      const baby = await Baby.findOne({ where: { id: babyId, userId: req.userId } });
      if (!baby) {
        res.status(403).json({ error: 'Access denied to this baby' });
        return;
      }
    }

    const record = await RecordModel.create({
      babyId: babyId || null, // pump records don't need babyId
      userId: req.userId!,
      type,
      data,
    });

    res.status(201).json({ record });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/records/:id - Delete a record
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await RecordModel.findByPk(id);

    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    if (record.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied. You can only delete your own records' });
      return;
    }

    await record.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
