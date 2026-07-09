import { CognitoIdentityProviderClient, SignUpCommand, AdminConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "us-east-1" });

async function seed() {
  const email = "admin@onesystemserp.com";
  const password = "Password123!";
  const clientId = "73tb3r016bs6d427o8241veug9";
  const userPoolId = "us-east-1_ap8ISLZxw";

  console.log("Registering in Cognito...");
  try {
    const signUpCommand = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }]
    });
    await client.send(signUpCommand);

    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: userPoolId,
      Username: email,
    });
    await client.send(confirmCommand);
    console.log("Cognito user created and confirmed.");
  } catch (e: any) {
    console.log("Cognito Error:", e.message);
  }

  console.log("Registering in Prisma...");
  try {
    await prisma.user.upsert({
      where: { email },
      update: { role: "SUPER_ADMIN" },
      create: {
        email,
        name: "System Admin",
        role: "SUPER_ADMIN",
        status: "ACTIVE"
      }
    });
    console.log("Prisma user created as SUPER_ADMIN.");
  } catch (e: any) {
    console.log("Prisma Error:", e.message);
  }
}

seed().catch(console.error);
