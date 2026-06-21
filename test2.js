const { PrismaClient } = require('@prisma/client');
const { getUserPermissions } = require('./src/lib/permissions.ts'); // wait require won't work for ts. I will write a simple script inline.
