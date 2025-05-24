import { db } from "../server/db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";

async function seedUsers() {
  console.log("🌱 Seeding users...");

  try {
    // Hash passwords
    const saltRounds = 12;
    const adminPasswordHash = await bcrypt.hash("rowdycup2025", saltRounds);
    const userPasswordHash = await bcrypt.hash("player123", saltRounds);

    // Create admin user
    const adminUser = await db.insert(users).values({
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "admin",
      email: "admin@rowdycup.com",
      firstName: "Tournament",
      lastName: "Admin",
      isActive: true
    }).returning();

    console.log("✅ Admin user created:", adminUser[0].username);

    // Create test player users
    const playerUsers = await db.insert(users).values([
      {
        username: "aviator1",
        passwordHash: userPasswordHash,
        role: "player",
        email: "aviator1@rowdycup.com",
        firstName: "Aviator",
        lastName: "Player",
        playerId: 1, // Assuming player ID 1 exists
        isActive: true
      },
      {
        username: "producer1",
        passwordHash: userPasswordHash,
        role: "player",
        email: "producer1@rowdycup.com",
        firstName: "Producer",
        lastName: "Player",
        playerId: 13, // Assuming player ID 13 exists
        isActive: true
      },
      {
        username: "testuser",
        passwordHash: userPasswordHash,
        role: "player",
        email: "test@rowdycup.com",
        firstName: "Test",
        lastName: "User",
        isActive: true
      }
    ]).returning();

    console.log("✅ Player users created:", playerUsers.map(u => u.username));

    console.log("✅ Users seeded successfully!");
    console.log("\n📋 Login credentials:");
    console.log("Admin: username=admin, password=rowdycup2025");
    console.log("Players: username=aviator1/producer1/testuser, password=player123");

  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
}

// Run the seeding function
seedUsers()
  .then(() => {
    console.log("🎉 User seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 User seeding failed:", error);
    process.exit(1);
  });
