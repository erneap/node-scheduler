import { Request, Response, Router } from "express";
import { InitialResponse } from 'scheduler-models/scheduler/web';
import { Employee } 
  from "scheduler-models/scheduler/employees";
import { Site } from "scheduler-models/scheduler/sites";
import { Team } from "scheduler-models/scheduler/teams";
import { auth } from '../middleware/authorization.middleware';
import { BuildInitial, collections, postLogEntry } from "scheduler-services";

const router = Router();

/**
 * This method is used to pull the initial data to the requesting employee/user.  It
 * consists of the requesting employee's data, their team and site w/the site's 
 * employees and work associated with these employees.
 */
router.get('/initial/:id', auth, async(req: Request, res: Response) => {
  try {
    let initial: InitialResponse = {
      employee: new Employee(),
      site: new Site(),
      team: new Team(),
    };
    const userid = req.params.id as string;

    // to pull initial data, we start with a user id, then pull the employee's record
    // from the database, then pull the employee's team and search the team sites to 
    // get the employee's site.  After this we will get the employees for the site and
    // then get work for each employee in the site's list, one at a time.
    if (userid) {
      const build = new BuildInitial(userid);
      initial = await build.build();
    } else {
      throw new Error('No Userid provided')
    }
    
    res.status(200).json(initial);
  } catch (err) {
    const error = err as Error;
    await postLogEntry('employee', `initial: Get: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

export default router;