import { Router } from 'express';
import { getSchema } from '../controllers/postgresData.controller';

const postgresRouter = Router();

// Retrieve Postgres schema from remote db
postgresRouter.post('/getSchema', getSchema, (req, res) => {
  return res.status(200).json(res.locals.data);
});

export { postgresRouter };