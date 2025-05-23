import { db } from "../server/db";
import { 
  teams, players, courses, rounds, matches, matchPlayers, 
  holeScores, tournamentStandings 
} from "../shared/schema";

async function seedDatabase() {
  console.log("🌱 Seeding database with Rowdy Cup 2025 data...");

  try {
    // Clear existing data
    await db.delete(holeScores);
    await db.delete(matchPlayers);
    await db.delete(matches);
    await db.delete(rounds);
    await db.delete(courses);
    await db.delete(players);
    await db.delete(tournamentStandings);
    await db.delete(teams);

    // Create teams
    const aviators = await db.insert(teams).values({
      name: "Aviators",
      captain: "Todd Euckert",
      color: "#1E40AF",
      logo: "aviators-logo.svg"
    }).returning();

    const producers = await db.insert(teams).values({
      name: "Producers", 
      captain: "Jason Dugan",
      color: "#DC2626",
      logo: "producers-logo.svg"
    }).returning();

    console.log("✅ Teams created");

    // Create courses
    const idahoClub = await db.insert(courses).values({
      name: "The Idaho Club",
      par: 72,
      yardage: 7200,
      description: "Nicklaus Signature Course with stunning mountain views"
    }).returning();

    const circlingRaven = await db.insert(courses).values({
      name: "Circling Raven Golf Club", 
      par: 72,
      yardage: 7100,
      description: "#1 Golf Course in Idaho by Golfweek Magazine"
    }).returning();

    const cdaResort = await db.insert(courses).values({
      name: "The Golf Course at the Coeur d'Alene Resort",
      par: 71,
      yardage: 6800, 
      description: "America's Most Beautiful Resort Golf Course with floating green"
    }).returning();

    console.log("✅ Courses created");

    // Create players for Aviators
    const aviatorsPlayers = [
      "Todd Euckert", "Mike Johnson", "Steve Williams", "Dave Anderson",
      "Chris Taylor", "Mark Thompson", "Paul Davis", "Ryan Miller",
      "Kevin Brown", "Jason Smith", "Tom Wilson", "Brad Martinez"
    ];

    for (const playerName of aviatorsPlayers) {
      await db.insert(players).values({
        name: playerName,
        teamId: aviators[0].id,
        handicap: (Math.random() * 15 + 5).toFixed(1), // Random handicap 5-20
        photo: `${playerName.toLowerCase().replace(' ', '-')}.jpg`
      });
    }

    // Create players for Producers  
    const producersPlayers = [
      "Jason Dugan", "Scott Robinson", "Matt Garcia", "Tony Lopez",
      "Dan Rodriguez", "Alex Clark", "Nick Lewis", "Jake Walker",
      "Ben Hall", "Luke Allen", "Sam Young", "Cole King"
    ];

    for (const playerName of producersPlayers) {
      await db.insert(players).values({
        name: playerName,
        teamId: producers[0].id,
        handicap: (Math.random() * 15 + 5).toFixed(1), // Random handicap 5-20
        photo: `${playerName.toLowerCase().replace(' ', '-')}.jpg`
      });
    }

    console.log("✅ Players created");

    // Create tournament rounds
    const round1 = await db.insert(rounds).values({
      number: 1,
      courseId: idahoClub[0].id,
      format: "2-man Scramble",
      date: new Date("2025-08-07"),
      teeTime: "12:00 PM",
      status: "upcoming"
    }).returning();

    const round2 = await db.insert(rounds).values({
      number: 2,
      courseId: circlingRaven[0].id,
      format: "2-man Best Ball",
      date: new Date("2025-08-08"),
      teeTime: "9:00 AM", 
      status: "upcoming"
    }).returning();

    const round3 = await db.insert(rounds).values({
      number: 3,
      courseId: circlingRaven[0].id,
      format: "3-man Horse Race Scramble",
      date: new Date("2025-08-08"),
      teeTime: "5:00 PM",
      status: "upcoming"
    }).returning();

    const round4 = await db.insert(rounds).values({
      number: 4,
      courseId: cdaResort[0].id,
      format: "2-man Shamble",
      date: new Date("2025-08-09"),
      teeTime: "11:00 AM",
      status: "upcoming"
    }).returning();

    const round5 = await db.insert(rounds).values({
      number: 5,
      courseId: circlingRaven[0].id,
      format: "4-man Scramble",
      date: new Date("2025-08-10"),
      teeTime: "10:00 AM",
      status: "upcoming"
    }).returning();

    console.log("✅ Rounds created");

    // Create matches for Round 1 (6 matches, 2-man scramble)
    for (let i = 1; i <= 6; i++) {
      await db.insert(matches).values({
        roundId: round1[0].id,
        team1Id: aviators[0].id,
        team2Id: producers[0].id,
        status: "upcoming",
        currentHole: 1,
        team1Score: 0,
        team2Score: 0,
        points: "1.0"
      });
    }

    // Create matches for Round 2 (6 matches, 2-man best ball)
    for (let i = 1; i <= 6; i++) {
      await db.insert(matches).values({
        roundId: round2[0].id,
        team1Id: aviators[0].id,
        team2Id: producers[0].id,
        status: "upcoming",
        currentHole: 1,
        team1Score: 0,
        team2Score: 0,
        points: "1.0"
      });
    }

    // Create matches for Round 3 (4 matches, 3-man horse race)
    for (let i = 1; i <= 4; i++) {
      await db.insert(matches).values({
        roundId: round3[0].id,
        team1Id: aviators[0].id,
        team2Id: producers[0].id,
        status: "upcoming",
        currentHole: 1,
        team1Score: 0,
        team2Score: 0,
        points: "1.0"
      });
    }

    // Create matches for Round 4 (6 matches, 2-man shamble)
    for (let i = 1; i <= 6; i++) {
      await db.insert(matches).values({
        roundId: round4[0].id,
        team1Id: aviators[0].id,
        team2Id: producers[0].id,
        status: "upcoming",
        currentHole: 1,
        team1Score: 0,
        team2Score: 0,
        points: "1.0"
      });
    }

    // Create matches for Round 5 (3 matches, 4-man scramble)
    for (let i = 1; i <= 3; i++) {
      await db.insert(matches).values({
        roundId: round5[0].id,
        team1Id: aviators[0].id,
        team2Id: producers[0].id,
        status: "upcoming",
        currentHole: 1,
        team1Score: 0,
        team2Score: 0,
        points: "1.0"
      });
    }

    console.log("✅ Matches created");

    // Create tournament standings
    await db.insert(tournamentStandings).values({
      teamId: aviators[0].id,
      round1Points: "0",
      round2Points: "0", 
      round3Points: "0",
      round4Points: "0",
      totalPoints: "0"
    });

    await db.insert(tournamentStandings).values({
      teamId: producers[0].id,
      round1Points: "0",
      round2Points: "0",
      round3Points: "0", 
      round4Points: "0",
      totalPoints: "0"
    });

    console.log("✅ Tournament standings created");
    console.log("🎉 Database seeded successfully with Rowdy Cup 2025 tournament data!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log("✨ Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });