import { db } from "../server/db";
import { profiles } from "@shared/schema";
import bcrypt from "bcrypt";

async function seedProfiles() {
  console.log("🌱 Seeding profiles...");

  try {
    // Hash passwords
    const saltRounds = 12;
    const adminPasswordHash = await bcrypt.hash("rowdycup2025", saltRounds);
    const profilePasswordHash = await bcrypt.hash("player123", saltRounds);

    // Create admin profile
    const adminProfile = await db.insert(profiles).values({
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "admin",
      email: "admin@rowdycup.com",
      firstName: "Tournament",
      lastName: "Admin",
      isActive: true
    }).returning();

    console.log("✅ Admin profile created:", adminProfile[0].username);

    // Create test player profiles
    const playerProfiles = await db.insert(profiles).values([
      {
        username: "aviator1",
        passwordHash: profilePasswordHash,
        role: "player",
        email: "aviator1@rowdycup.com",
        firstName: "Aviator",
        lastName: "Player",
        playerId: 1, // Assuming player ID 1 exists
        isActive: true
      },
      {
        username: "producer1",
        passwordHash: profilePasswordHash,
        role: "player",
        email: "producer1@rowdycup.com",
        firstName: "Producer",
        lastName: "Player",
        playerId: 13, // Assuming player ID 13 exists
        isActive: true
      },
      {
        username: "testprofile",
        passwordHash: profilePasswordHash,
        role: "player",
        email: "test@rowdycup.com",
        firstName: "Test",
        lastName: "Profile",
        isActive: true
      }
    ]).returning();

    console.log("✅ Player profiles created:", playerProfiles.map(u => u.username));

    console.log("✅ Profiles seeded successfully!");
    console.log("\n📋 Login credentials:");
    console.log("Admin: username=admin, password=rowdycup2025");
    console.log("Players: username=aviator1/producer1/testprofile, password=player123");

  } catch (error) {
    console.error("❌ Error seeding profiles:", error);
    throw error;
  }
}

// Run the seeding function
seedProfiles()
  .then(() => {
    console.log("🎉 Profile seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Profile seeding failed:", error);
    process.exit(1);
  });
