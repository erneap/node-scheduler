import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { Contact, NewTeam, Specialty, Team, UpdateTeam } 
  from "scheduler-models/scheduler/teams";
import { postLogEntry, TeamService } from "scheduler-services";
import { Employee } from "scheduler-models/scheduler/employees";
import { Site } from "scheduler-models/scheduler/sites";

const router = Router();
export default router;

/**
 * This method will provide the team object from the identifier given.
 * STEPS:
 * 1) Get the team identifier from the request
 * 2) Check for the teams database collection
 * 3) Pull the team from the database
 * 4) Respond with the team.
 */
router.get('/team/query/:team', async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    if (teamid !== '') {
      const teamService = new TeamService();
      const iTeam = await teamService.getTeam(teamid);
      if (iTeam) {
        const team = new Team(iTeam);
        const answer: Employee[] = [];
        const now = new Date();
        team.sites.forEach(iSite => {
          const site = new Site(iSite);
          const timeAtSite = new Date(now.getTime() + (site.utcOffset * 3600000));
          if (site.employees) {
            site.employees.forEach(iEmp => {
              const emp = new Employee(iEmp);
              if (emp.atSite(site.id, timeAtSite, timeAtSite)) {
                const wd = emp.getWorkday(timeAtSite);
                let bAdd = false;
                if (wd && wd.code !== '') {
                  team.workcodes.forEach(wc => {
                    if (!bAdd && wd.code.toLowerCase() === wc.id.toLowerCase()) {
                      const start = new Date(Date.UTC(timeAtSite.getUTCFullYear(), 
                        timeAtSite.getUTCMonth(), timeAtSite.getUTCDate(), wc.start, 0, 0));
                      const end = new Date(start.getTime() + (8 * 3600000));
                      if (timeAtSite.getTime() >= start.getTime() 
                        && timeAtSite.getTime() <= end.getTime()) {
                        bAdd = true;
                      }
                    }
                  });
                }
                if (bAdd) {
                  answer.push(emp);
                }
              }
            });
          }
        })
        res.status(200).json(answer);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Team id not provided.')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `team: Get: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});