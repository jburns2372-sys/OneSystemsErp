import type { NextApiRequest, NextApiResponse } from 'next';
import app from '../../../apps/aws-backend/src/index';

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}
