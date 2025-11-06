import { UserTable } from "@/entities/user";
import { query } from "sappsjs/orm";

export async function seed(): Promise<void> {
  console.log("  → Seeding users...");

  const users = [
    {
      email: "admin@example.com",
      name: "Admin User",
      password: "hashed_password_here",
    },
    {
      email: "user@example.com",
      name: "Regular User",
      password: "hashed_password_here",
    }
  ];

  for (const user of users) {
    await query(UserTable).insert(user);
  }

  console.log("  ✓ Users seeded");
}

export async function rollback(): Promise<void> {
  console.log("  → Rolling back users...");
  await query(UserTable).where("email", "IN", [
    "admin@example.com",
    "user@example.com"
  ]).delete();
  console.log("  ✓ Users rolled back");
}
