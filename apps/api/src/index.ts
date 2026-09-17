import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'PitchXI API',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: String(error)
    });
  }
});

app.get('/api/info', async (_req, res) => {
  try {
    const [teamsCount, playersCount, matchesCount] = await Promise.all([
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count()
    ]);

    res.json({
      appName: 'PitchXI',
      version: '1.0.0',
      entities: {
        teams: teamsCount,
        players: playersCount,
        matches: matchesCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve database info' });
  }
});

// Start listening if not imported as module
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🏏 PitchXI API server running on http://localhost:${PORT}`);
  });
}

export default app;
