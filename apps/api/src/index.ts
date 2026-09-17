import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import authRoutes from './routes/authRoutes';
import matchRoutes from './routes/matchRoutes';
import squadRoutes from './routes/squadRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Base Health Check
app.get('/health', async (_req: Request, res: Response) => {
  try {
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

// App Info
app.get('/api/info', async (_req: Request, res: Response) => {
  try {
    const [teamsCount, playersCount, matchesCount, squadsCount] = await Promise.all([
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count(),
      prisma.fantasySquad.count()
    ]);

    res.json({
      appName: 'PitchXI',
      version: '1.0.0',
      entities: {
        teams: teamsCount,
        players: playersCount,
        matches: matchesCount,
        squads: squadsCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve database info' });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/squads', squadRoutes);

// Global 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested API route does not exist.' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start listening if not imported in test suite
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🏏 PitchXI API server running on http://localhost:${PORT}`);
  });
}

export default app;
