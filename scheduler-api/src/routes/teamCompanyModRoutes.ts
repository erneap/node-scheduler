import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { NewModPeriod, Team, UpdateTeam } from "scheduler-models/scheduler/teams";
import { getDateFromString } from "./employeeAssignmentRoutes";
import { postLogEntry, TeamService } from "scheduler-services";

const router = Router();
export default router;

/**
 * This method is used to add a new mod period to a company within a team.
 * STEPS:
 * 1) Get the new mod period data from the request.
 * 2) Check for the team and company identifiers, plus year for the new mod period
 * 3) If present, get the team from the database
 * 4) find the company from the team's company list.
 * 5) Add the new mod period to the company
 * 6) replace the modified company to the team's company list
 * 7) Replace the team in the database
 * 8) Respond with the updated team.
 */
router.post('/team/company/mod', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewModPeriod;
    if (data.team !== '' && data.companyid !== '' && data.year > 0) {
      const teamService = new TeamService();
      const iTeam = await teamService.getTeam(data.team);
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach((co, c) => {
          if (co.id.toLowerCase() === data.companyid.toLowerCase()) {
            co.addModPeriod(data.year, data.start, data.end);
            team.companies[c] = co;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Required data not present in request')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamCompanyMod: Post: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will update a company's mod period 
 * STEPS:
 * 1) Get the team update from the request
 * 2) Check for required information in the update data
 * 3) If present, get the team from the database
 * 4) find the company from the team's company list.
 * 5) Modify mod period in the company
 * 6) replace the modified company to the team's company list
 * 7) Replace the team in the database
 * 8) Respond with the updated team.
 */
router.put('/team/company/mod', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateTeam;
    if (data.team !== '' && data.companyid && data.companyid !== '' && data.optid !== '') {
      const teamService = new TeamService();
      const iTeam = await teamService.getTeam(data.team);
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach((co, c) => {
          if (co.id.toLowerCase() === data.companyid?.toLowerCase()) {
            const year = Number(data.optid);
            co.updateModPeriod(year, data.field, getDateFromString(data.value))
            team.companies[c] = co;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Required data not present in request')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamCompanyMod: Put: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will delete a company's mod period 
 * STEPS:
 * 1) Get the team update from the request
 * 2) Check for required information in the update data
 * 3) If present, get the team from the database
 * 4) find the company from the team's company list.
 * 5) delete the mod period in the company.
 * 6) replace the modified company to the team's company list
 * 7) Replace the team in the database
 * 8) Respond with the updated team.
 */
router.delete('/team/company/mod/:team/:company/:year', auth, 
  async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const companyid = req.params.company as string;
    const sYear = req.params.year as string;
    if (teamid !== '' && companyid !== '' && sYear !== '') {
      const teamService = new TeamService();
      const iTeam = await teamService.getTeam(teamid);
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach((co, c) => {
          if (co.id.toLowerCase() === companyid.toLowerCase()) {
            const year = Number(sYear);
            co.deleteModPeriod(year);
            team.companies[c] = co;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Required data not present in request')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamCompanyMod: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});