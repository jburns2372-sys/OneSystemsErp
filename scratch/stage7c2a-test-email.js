require('dotenv').config({ path: '.env.uat-v4-r7' });
const fs = require('fs');
const envContent = fs.readFileSync('.env.uat-v4-r7.credentials.local', 'utf-16le');
envContent.replace(/^\uFEFF/, '').split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
        process.env[match[1].trim()] = match[2].replace(/^["']|["']$/g, '').trim();
    }
});
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();

async function run() {
    try {
        console.log("Checking keys...");
        const keys = ['APP_BASE_URL', 'PASSWORD_RECOVERY_EMAIL_PROVIDER', 'PASSWORD_RECOVERY_EMAIL_FROM', 'RESEND_API_KEY'];
        for (const key of keys) {
            if (!process.env[key]) {
                throw new Error(`Missing key: ${key}`);
            }
        }
        console.log("Keys exist.");

        if (process.env.NEXT_PUBLIC_RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is exposed via NEXT_PUBLIC!");
        }

        const superAdmin = await prisma.user.findFirst({
            where: {
                role: 'SUPER_ADMIN'
            }
        });

        if (!superAdmin) {
            throw new Error("Super Admin not found.");
        }
        console.log("Found Super Admin");

        const originalAuthFields = {
            passwordHash: superAdmin.passwordHash,
            mustChangePassword: superAdmin.mustChangePassword,
            sessionVersion: superAdmin.sessionVersion
        };

        const tokensBefore = await prisma.passwordRecoveryToken.count();

        console.log("Sending test email...");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const data = await resend.emails.send({
            from: process.env.PASSWORD_RECOVERY_EMAIL_FROM,
            to: superAdmin.email,
            subject: 'UAT Delivery Test',
            text: 'This is a harmless token-free UAT delivery test.'
        });

        if (data.error) {
            throw new Error(`Email sending failed: ${JSON.stringify(data.error)}`);
        }

        console.log("Email sent successfully.");

        const tokensAfter = await prisma.passwordRecoveryToken.count();
        if (tokensAfter !== tokensBefore) {
            throw new Error("PasswordRecoveryToken was created!");
        }

        const superAdminAfter = await prisma.user.findUnique({ where: { id: superAdmin.id } });
        if (
            superAdminAfter.passwordHash !== originalAuthFields.passwordHash ||
            superAdminAfter.mustChangePassword !== originalAuthFields.mustChangePassword ||
            superAdminAfter.sessionVersion !== originalAuthFields.sessionVersion
        ) {
            throw new Error("User authentication field changed!");
        }

        console.log("No token created. No auth fields changed.");

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
run();
