import { Router, Response } from 'express';
import { Op } from 'sequelize';
import Baby from '../models/Baby';
import RecordModel, { FeedData, PumpData, DiaperData, WeightData } from '../models/Record';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

interface DayStats {
  date: string;
  feed: { count: number; totalAmount: number; breastCount: number; formulaCount: number };
  pump: { count: number; totalAmount: number };
  diaper: { count: number; pee: number; poop: number; both: number };
  weight: { count: number; latest: number | null };
}

interface Summary {
  feed: { totalCount: number; totalAmount: number; avgPerDay: number };
  pump: { totalCount: number; totalAmount: number };
  diaper: { totalCount: number; avgPerDay: number };
}

// GET /api/stats?baby_id=xxx&days=7
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby_id, days } = req.query;
    const daysNum = Math.min(parseInt(days as string) || 7, 30);

    // Verify baby belongs to current user
    if (!baby_id || typeof baby_id !== 'string') {
      res.status(400).json({ error: 'baby_id is required' });
      return;
    }

    const baby = await Baby.findOne({ where: { id: baby_id, userId: req.userId } });
    if (!baby) {
      res.status(403).json({ error: 'Access denied to this baby' });
      return;
    }

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum + 1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all records within date range
    const records = await RecordModel.findAll({
      where: {
        babyId: baby_id,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      order: [['createdAt', 'ASC']],
    });

    // Initialize stats structure for each day
    const statsMap: { [key: string]: DayStats } = {};
    for (let i = 0; i < daysNum; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      statsMap[dateStr] = {
        date: dateStr,
        feed: { count: 0, totalAmount: 0, breastCount: 0, formulaCount: 0 },
        pump: { count: 0, totalAmount: 0 },
        diaper: { count: 0, pee: 0, poop: 0, both: 0 },
        weight: { count: 0, latest: null },
      };
    }

    // Aggregate records by day
    let latestWeight: { date: string; weight: number } | null = null;

    records.forEach((record) => {
      const dateStr = record.createdAt.toISOString().split('T')[0];
      const dayStats = statsMap[dateStr];
      if (!dayStats) return;

      const data = record.data as FeedData | PumpData | DiaperData | WeightData;

      switch (record.type) {
        case 'feed': {
          const feedData = data as FeedData;
          dayStats.feed.count++;
          if (feedData.amount) {
            dayStats.feed.totalAmount += feedData.amount;
          }
          if (feedData.source === 'breast') {
            dayStats.feed.breastCount++;
          } else if (feedData.source === 'formula') {
            dayStats.feed.formulaCount++;
          }
          break;
        }
        case 'pump': {
          const pumpData = data as PumpData;
          dayStats.pump.count++;
          if (pumpData.amount) {
            dayStats.pump.totalAmount += pumpData.amount;
          }
          break;
        }
        case 'diaper': {
          const diaperData = data as DiaperData;
          dayStats.diaper.count++;
          if (diaperData.type === 'pee') {
            dayStats.diaper.pee++;
          } else if (diaperData.type === 'poop') {
            dayStats.diaper.poop++;
          } else if (diaperData.type === 'both') {
            dayStats.diaper.both++;
          }
          break;
        }
        case 'weight': {
          const weightData = data as WeightData;
          dayStats.weight.count++;
          if (weightData.weightKg) {
            dayStats.weight.latest = weightData.weightKg;
            // Track the latest weight overall
            if (!latestWeight || dateStr > latestWeight.date) {
              latestWeight = { date: dateStr, weight: weightData.weightKg };
            }
          }
          break;
        }
      }
    });

    const stats = Object.values(statsMap).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary
    const summary: Summary = {
      feed: { totalCount: 0, totalAmount: 0, avgPerDay: 0 },
      pump: { totalCount: 0, totalAmount: 0 },
      diaper: { totalCount: 0, avgPerDay: 0 },
    };

    stats.forEach((day) => {
      summary.feed.totalCount += day.feed.count;
      summary.feed.totalAmount += day.feed.totalAmount;
      summary.pump.totalCount += day.pump.count;
      summary.pump.totalAmount += day.pump.totalAmount;
      summary.diaper.totalCount += day.diaper.count;
    });

    summary.feed.avgPerDay = parseFloat((summary.feed.totalCount / daysNum).toFixed(1));
    summary.diaper.avgPerDay = parseFloat((summary.diaper.totalCount / daysNum).toFixed(1));

    res.json({ stats, summary });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
