// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

const prisma = new PrismaClient();
const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    if (process.env.COGNITO_CLIENT_ID) {
      const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: normalizedEmail,
          PASSWORD: password,
        },
      });
      await client.send(command);
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ success: false, error: 'Account is temporarily locked' });
    }

    if (!process.env.COGNITO_CLIENT_ID) {
      // Never bypass password verification when Cognito is not configured
      const isPasswordValid = await bcrypt.compare(String(password), user.passwordHash || '');
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
    }

    res.json({ success: true, user: { id: user.id, role: user.role } });
  } catch (error: any) {
    console.error('Auth Error (AWS Backend):', error);
    if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    return res.status(500).json({ success: false, error: 'Authentication error' });
  }
});

router.post('/logout', async (req, res) => {
  res.json({ success: true, message: 'Logout request received by backend' });
});

export default router;
