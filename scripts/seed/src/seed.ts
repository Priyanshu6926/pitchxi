import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import {
  SEED_TEAMS,
  SEED_PLAYERS,
  SEED_MATCHES,
  MATCH_1_PERFORMANCES,
  MATCH_2_PERFORMANCES
} from './dataset';
import { calculatePlayerCredits } from '../../../apps/api/src/services/creditCalculator';

// Load api .env for DATABASE_URL
dotenv.config({ path: path.resolve(__dirname, '../../../apps/api/.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting PitchXI Seed Pipeline...\n');

  // 1. Teams
  console.log('🏟️  Seeding IPL Franchise Teams...');
  for (const team of SEED_TEAMS) {
    await prisma.team.upsert({
      where: { shortCode: team.shortCode },
      update: {
        name: team.name,
        primaryColor: team.primaryColor,
        logoUrl: team.logoUrl
      },
      create: {
        id: team.id,
        name: team.name,
        shortCode: team.shortCode,
        primaryColor: team.primaryColor,
        logoUrl: team.logoUrl
      }
    });
  }
  console.log(`✅ Seeded ${SEED_TEAMS.length} teams.`);

  // 2. Compute Player Credits using valuation formula (PRD §8.1)
  console.log('⚖️  Calculating Player Form Scores & Market Credits...');
  const valuationInputs = SEED_PLAYERS.map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    recentPoints: p.recentPoints,
    careerAveragePoints: p.careerAveragePoints
  }));

  const valuations = calculatePlayerCredits(valuationInputs);
  const valuationMap = new Map(valuations.map(v => [v.playerId, v]));

  // 3. Players
  console.log('🏏 Seeding Players...');
  for (const player of SEED_PLAYERS) {
    const valuation = valuationMap.get(player.id);
    const credit = valuation ? valuation.creditValue : 8.0;
    const projected = valuation ? valuation.formScore : 45.0;

    await prisma.player.upsert({
      where: { id: player.id },
      update: {
        name: player.name,
        teamId: player.teamId,
        role: player.role,
        creditValue: credit,
        projectedPoints: projected,
        photoUrl: player.photoUrl
      },
      create: {
        id: player.id,
        name: player.name,
        teamId: player.teamId,
        role: player.role,
        creditValue: credit,
        projectedPoints: projected,
        photoUrl: player.photoUrl
      }
    });
  }
  console.log(`✅ Seeded ${SEED_PLAYERS.length} players.`);

  // 4. Matches
  console.log('📅 Seeding Matches...');
  for (const match of SEED_MATCHES) {
    await prisma.match.upsert({
      where: { id: match.id },
      update: {
        teamAId: match.teamAId,
        teamBId: match.teamBId,
        venue: match.venue,
        matchDate: new Date(match.matchDate),
        status: match.status,
        source: match.source
      },
      create: {
        id: match.id,
        teamAId: match.teamAId,
        teamBId: match.teamBId,
        venue: match.venue,
        matchDate: new Date(match.matchDate),
        status: match.status,
        source: match.source
      }
    });
  }
  console.log(`✅ Seeded ${SEED_MATCHES.length} matches.`);

  // 5. Performances
  console.log('📊 Seeding Player Match Performances...');
  const allPerformances = [...MATCH_1_PERFORMANCES, ...MATCH_2_PERFORMANCES];
  for (const perf of allPerformances) {
    await prisma.playerMatchPerformance.upsert({
      where: {
        playerId_matchId: {
          playerId: perf.playerId,
          matchId: perf.matchId
        }
      },
      update: {
        runs: perf.runs,
        ballsFaced: perf.ballsFaced,
        fours: perf.fours,
        sixes: perf.sixes,
        wickets: perf.wickets,
        oversBowled: perf.oversBowled,
        runsConceded: perf.runsConceded,
        maidens: perf.maidens,
        catches: perf.catches,
        stumpings: perf.stumpings,
        runOuts: perf.runOuts,
        fantasyPoints: perf.fantasyPoints
      },
      create: {
        playerId: perf.playerId,
        matchId: perf.matchId,
        runs: perf.runs,
        ballsFaced: perf.ballsFaced,
        fours: perf.fours,
        sixes: perf.sixes,
        wickets: perf.wickets,
        oversBowled: perf.oversBowled,
        runsConceded: perf.runsConceded,
        maidens: perf.maidens,
        catches: perf.catches,
        stumpings: perf.stumpings,
        runOuts: perf.runOuts,
        fantasyPoints: perf.fantasyPoints
      }
    });
  }
  console.log(`✅ Seeded ${allPerformances.length} match performances.`);

  // Summary inspection
  console.log('\n🌟 Seed Summary:');
  const sampleTopPlayers = await prisma.player.findMany({
    take: 5,
    orderBy: { creditValue: 'desc' },
    include: { team: true }
  });

  console.log('Top Valued Players:');
  sampleTopPlayers.forEach(p => {
    console.log(` - ${p.name.padEnd(20)} | ${p.role.padEnd(5)} | ${p.team.shortCode.padEnd(4)} | Credit: ${p.creditValue} cr | Proj: ${p.projectedPoints} pts`);
  });

  console.log('\n✨ Database seeding complete!\n');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
