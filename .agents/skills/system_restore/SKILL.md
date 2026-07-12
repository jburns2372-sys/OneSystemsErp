---
name: system_restore
description: Non-destructive master restore protocol. Executes the Knowledge Center seeder to repair and recreate all missing functional rules, SOPs, access rights matrices, and AI instructions. Does NOT erase any user data.
---

# System Restore Protocol

When the user asks you to perform a system restore, master restore, or functional repair, you MUST execute this exact protocol.

## Purpose
This protocol repairs the functional layer of the application (Knowledge Records, AI instructions, SOPs, Access Rights Matrix) without modifying or deleting any live user transaction data (e.g., job orders, material requests, billing). It is completely non-destructive.

## Execution Steps
1. **Run the Knowledge Center Seeder**:
   Execute the following command in the root directory:
   ```bash
   npx tsx prisma/seeders/seed-knowledge-center.ts
   ```
2. **Verify Output**:
   Ensure the output indicates that the SOPs and rules were successfully created or updated.
3. **Notify User**:
   Inform the user that the System Restore Protocol has successfully rebuilt the system's functional logic, validation rules, and AI configurations without touching any of their actual production data.
