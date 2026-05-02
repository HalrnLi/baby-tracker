import { Router, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Baby from '../models/Baby';
import RecordModel from '../models/Record';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// All sync routes require authentication
router.use(authMiddleware);

// GET /api/sync - Get all records updated since lastSync timestamp
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lastSync } = req.query;

    // Get all babies belonging to the current user
    const babies = await Baby.findAll({ where: { userId: req.userId } });
    const babyIds = babies.map((b) => b.id);

    // For pump records, they don't need babyId association - return all pump records for this user
    // For non-pump records, they must belong to one of the user's babies
    const whereClause: Record<string, unknown> = {
      userId: req.userId,
    };

    if (babyIds.length > 0) {
      // Use Op.or to combine: (babyId in user's babies) OR (type is pump - regardless of babyId)
      (whereClause as Record<string, unknown>)[Op.or as unknown as string] = [
        { babyId: babyIds },
        { type: 'pump' }
      ];
    } else {
      // User has no babies, return all pump records (pump records don't require babyId)
      whereClause.type = 'pump';
    }

    // If lastSync provided, only get records created after that
    if (lastSync && typeof lastSync === 'string') {
      const lastSyncDate = new Date(lastSync);
      if (!isNaN(lastSyncDate.getTime())) {
        whereClause.createdAt = {
          [Op.gt]: lastSyncDate,
        };
      }
    }

    const records = await RecordModel.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']],
      include: [
        { model: Baby, as: 'baby', attributes: ['id', 'name'] },
      ],
    });

    res.json({
      records,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sync - Batch create records from client
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { records } = req.body;

    if (!Array.isArray(records)) {
      await t.rollback();
      res.status(400).json({ error: 'records must be an array' });
      return;
    }

    if (records.length === 0) {
      await t.commit();
      res.json({ created: [], lastSync: new Date().toISOString() });
      return;
    }

    // Get all babies belonging to the current user
    const babies = await Baby.findAll({ where: { userId: req.userId } });
    const babyIds = babies.map((b) => b.id);

    const createdRecords: RecordModel[] = [];

    for (const record of records) {
      const { id, babyId, type, data, clientCreatedAt } = record;

      // Validate record type
      if (!['feed', 'pump', 'diaper', 'weight'].includes(type)) {
        continue;
      }

      // For pump records, babyId is optional
      // For other types, babyId is required and must belong to user
      if (type !== 'pump') {
        if (!babyId || !babyIds.includes(babyId)) {
          continue; // Skip records for babies that don't belong to user
        }
      }

      // Create record with client's timestamp
      const created = await RecordModel.create({
        babyId: babyId || null,
        userId: req.userId!,
        type,
        data,
        createdAt: clientCreatedAt ? new Date(clientCreatedAt) : undefined,
      }, { transaction: t });

      // Re-fetch with associations
      const fullRecord = await RecordModel.findByPk(created.id, {
        include: [{ model: Baby, as: 'baby', attributes: ['id', 'name'] }],
        transaction: t,
      });

      if (fullRecord) {
        createdRecords.push(fullRecord);
      }
    }

    await t.commit();
    res.status(201).json({
      created: createdRecords,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    await t.rollback();
    console.error('Sync post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
