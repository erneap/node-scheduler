import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";

const router = Router();

router.post('/employee/assignment', async(req: Request, res: Response) => {

});

export default router;