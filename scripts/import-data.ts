import { prisma } from "../src/lib/prisma";
import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const DATA_DIR = path.join(process.cwd(), "ombekke-attachments (1)");

const ECO_CSV = path.join(DATA_DIR, "eco_202603300925.csv");
const PLAYER_CSV = path.join(DATA_DIR, "player_202603300923.csv");
const TOURNAMENT_CSV = path.join(DATA_DIR, "tournament_202603300926.csv");
const GAMES_CSV = path.join(DATA_DIR, "games_202603300921.csv");

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.includes("?")) return null;
  const [year, month, day] = dateStr.split(".").map(Number);
  if (!year || isNaN(year)) return null;
  // Handle cases like 2012.00.00
  const m = month > 0 ? month - 1 : 0;
  const d = day > 0 ? day : 1;
  return new Date(year, m, d);
}

async function importEco() {
  console.log("Importing ECO openings...");
  const content = fs.readFileSync(ECO_CSV, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  for (const record of records) {
    await prisma.eco.upsert({
      where: { id: record.eco },
      update: {
        name: record.eco_name,
        example: record.eco_example,
        type: record.eco_type,
        group: record.eco_group,
      },
      create: {
        id: record.eco,
        name: record.eco_name,
        example: record.eco_example,
        type: record.eco_type,
        group: record.eco_group,
      },
    });
  }
  console.log(`Imported ${records.length} ECO openings.`);
}

async function importPlayers() {
  console.log("Importing Players...");
  const content = fs.readFileSync(PLAYER_CSV, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  for (const record of records) {
    await prisma.player.upsert({
      where: { fideId: parseInt(record.fide_id) },
      update: {
        name: record.name,
        country: record.country || null,
        sex: record.sex || null,
        title: record.title || null,
      },
      create: {
        fideId: parseInt(record.fide_id),
        name: record.name,
        country: record.country || null,
        sex: record.sex || null,
        title: record.title || null,
      },
    });
  }
  console.log(`Imported ${records.length} Players.`);
}

async function importTournaments() {
  console.log("Importing Tournaments...");
  const content = fs.readFileSync(TOURNAMENT_CSV, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  for (const record of records) {
    await prisma.tournament.upsert({
      where: { eventId: parseInt(record.event_id) },
      update: {
        event: record.event,
        place: record.place || null,
        federation: record.federation || null,
        startDate: parseDate(record.startdate),
        endDate: parseDate(record.enddate),
        type: record.type || null,
      },
      create: {
        eventId: parseInt(record.event_id),
        event: record.event,
        place: record.place || null,
        federation: record.federation || null,
        startDate: parseDate(record.startdate),
        endDate: parseDate(record.enddate),
        type: record.type || null,
      },
    });
  }
  console.log(`Imported ${records.length} Tournaments.`);
}

async function importGames() {
  console.log("Importing Games (this might take a while)...");

  const content = fs.readFileSync(GAMES_CSV, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  const knownPlayers = new Set<number>();
  const playersInDb = await prisma.player.findMany({
    select: { fideId: true },
  });
  playersInDb.forEach((p) => knownPlayers.add(p.fideId));

  const knownEcos = new Set<string>();
  const ecosInDb = await prisma.eco.findMany({ select: { id: true } });
  ecosInDb.forEach((e) => knownEcos.add(e.id));

  const knownTournaments = new Set<number>();
  const tournamentsInDb = await prisma.tournament.findMany({
    select: { eventId: true },
  });
  tournamentsInDb.forEach((t) => knownTournaments.add(t.eventId));

  // Pre-collect missing stubs
  const missingPlayers = new Set<number>();
  const missingEcos = new Set<string>();
  const missingTournaments = new Set<number>();

  for (const record of records) {
    const whiteId = parseInt(record.white);
    const blackId = parseInt(record.black);
    const eventId = parseInt(record.event);
    const ecoCode = record.eco;

    if (isNaN(whiteId) || isNaN(blackId) || isNaN(eventId)) {
      continue; // Skip games with missing required IDs
    }

    // Default eco code if missing
    const finalEco = ecoCode || "A00";

    if (!knownPlayers.has(whiteId)) missingPlayers.add(whiteId);
    if (!knownPlayers.has(blackId)) missingPlayers.add(blackId);
    if (!knownEcos.has(finalEco)) missingEcos.add(finalEco);
    if (!knownTournaments.has(eventId)) missingTournaments.add(eventId);
  }

  console.log(
    `Creating ${missingPlayers.size} missing players, ${missingEcos.size} missing ECOs, and ${missingTournaments.size} missing tournaments...`,
  );

  // Batch create missing records
  if (missingPlayers.size > 0) {
    const playerBatch = Array.from(missingPlayers).map((id) => ({
      fideId: id,
      name: `Unknown Player ${id}`,
      country: "UNK",
    }));
    for (let i = 0; i < playerBatch.length; i += 1000) {
      await prisma.player.createMany({
        data: playerBatch.slice(i, i + 1000),
        skipDuplicates: true,
      });
    }
  }

  if (missingEcos.size > 0) {
    const ecoBatch = Array.from(missingEcos).map((id) => ({
      id,
      name: "Unknown Opening",
      example: "",
      type: "U",
      group: "Unknown",
    }));
    for (let i = 0; i < ecoBatch.length; i += 1000) {
      await prisma.eco.createMany({
        data: ecoBatch.slice(i, i + 1000),
        skipDuplicates: true,
      });
    }
  }

  if (missingTournaments.size > 0) {
    const tournamentBatch = Array.from(missingTournaments).map((id) => ({
      eventId: id,
      event: `Unknown Event ${id}`,
    }));
    for (let i = 0; i < tournamentBatch.length; i += 1000) {
      await prisma.tournament.createMany({
        data: tournamentBatch.slice(i, i + 1000),
        skipDuplicates: true,
      });
    }
  }

  const batchSize = 1000;
  let batch: any[] = [];
  let count = 0;

  for (const record of records) {
    const whiteId = parseInt(record.white);
    const blackId = parseInt(record.black);
    const eventId = parseInt(record.event);
    const ecoCode = record.eco || "A00";

    if (isNaN(whiteId) || isNaN(blackId) || isNaN(eventId)) {
      continue;
    }

    batch.push({
      id: record.game_id,
      tournamentId: eventId,
      datePlayed: parseDate(record.date_played),
      round: record.round ? parseFloat(record.round) : null,
      whiteId,
      blackId,
      result: record.result,
      whiteElo: record.white_elo ? parseFloat(record.white_elo) : null,
      blackElo: record.black_elo ? parseFloat(record.black_elo) : null,
      ecoCode,
      plyCount: record.ply_count ? parseFloat(record.ply_count) : null,
      termination: record.termination || null,
      endgame: record.endgame || null,
      endgameCount: record.endgame_count
        ? parseFloat(record.endgame_count)
        : null,
    });

    if (batch.length >= batchSize) {
      await prisma.game.createMany({
        data: batch,
        skipDuplicates: true,
      });
      count += batch.length;
      if (count % 5000 === 0) console.log(`Imported ${count} games...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await prisma.game.createMany({
      data: batch,
      skipDuplicates: true,
    });
    count += batch.length;
  }

  console.log(`Imported ${count} Games total.`);
}

async function main() {
  try {
    await importEco();
    await importPlayers();
    await importTournaments();
    await importGames();
  } catch (error) {
    console.error("Import failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
