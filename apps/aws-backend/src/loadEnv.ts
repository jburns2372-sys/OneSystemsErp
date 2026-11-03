import dotenv from 'dotenv';

// Support launching the backend from either the repository root or this app's
// package directory. Existing process variables are not overwritten, so
// deployment-provided configuration remains authoritative.
dotenv.config({
  path: [
    '.env.local',
    '../../.env.local',
    '.env',
    '../../.env',
  ],
});
