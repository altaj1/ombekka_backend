import { prisma } from "../src/lib/prisma";
import "dotenv/config";

async function main() {
  const ecoCount = await prisma.eco.count();
  const playerCount = await prisma.player.count();
  const tournamentCount = await prisma.tournament.count();
  const gameCount = await prisma.game.count();

  console.log("Database Verification:");
  console.log("- Eco openings:", ecoCount);
  console.log("- Players:", playerCount);
  console.log("- Tournaments:", tournamentCount);
  console.log("- Games:", gameCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
