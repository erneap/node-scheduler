import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { ObjectId } from "mongodb";
import { ITeam, NewCompanyHoliday, Team, UpdateTeam } from "scheduler-models/scheduler/teams";
import { HolidayType } from "scheduler-models/scheduler/teams/company";
import { collections, postLogEntry, TeamService } from "scheduler-services";

const router = Router();
export default router;

/**
 * This method is used to add a new company holiday.
 * STEPS:
 * 1) Get the new holiday information from the request.
 * 2) Check to ensure the team, company, and new holiday name is present
 * 3) Get the team from the database.
 * 4) Find the company from the team's company list.
 * 5) Check for the holiday, by name, in the company's holiday list.
 * 6) If not found, add it to the list.
 * 7) Update the team with the updated company.
 * 8) Replace the team in the database.
 * 9) Respond with the updated team.
 */
router.post('/team/company/holiday', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewCompanyHoliday;
    if (data.team !== '' && data.company !== '' && data.name !== '') {
      const teamService = new TeamService();
      const iTeam = await teamService.getTeam(data.team);
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach((co, c) => {
          if (co.id.toLowerCase() === data.company.toLowerCase()) {
            let found = false;
            co.holidays.forEach(hol => {
              if (hol.name.toLowerCase() === data.name.toLowerCase()) {
                found = true;
              }
            });
            if (!found) {
              co.addHoliday(data.holidayType, data.name);
            }
            team.companies[c] = co;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Required data not present');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamCompanyHoliday: Post: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to update a company holiday.
 * STEPS:
 * 1) Get the update team information to include the team, company and holiday identifiers.
 * 2) Breakout the Holiday Type and sort id for the holiday to update.
 * 3) Get the team from the database.
 * 4) Find the company from the team's company list.
 * 5) Update the company's holiday list.
 * 6) Replace company with the updated company.
 * 7) Replace the team in the database.
 * 8) Respond with the updated team.
 */
router.put('/team/company/holiday', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateTeam;
    if (data.team !== '' && data.companyid && data.companyid !== '' 
      && data.optid && data.optid !== '') {
      const teamService = new TeamService();
      const holType: HolidayType = (data.optid.substring(0,1).toLowerCase() === 'h') 
        ? HolidayType.holiday : HolidayType.floating;
      const sortid = Number(data.optid.substring(1));
      const iTeam = await teamService.getTeam(data.team);
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach((co, c) => {
          if (co.id.toLowerCase() === data.companyid?.toLowerCase()) {
            co.updateHoliday(holType, sortid, data.field, data.value);
            team.companies[c] = co;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');  
      }
    } else {
      throw new Error('Required data not present');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamCompanyHoliday: Put: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to remove a holiday from a team's company's holiday list.
 * STEPS:
 * 1) Get the team, company and holiday identifiers from the request.
 * 2) Separate the holiday identifier into holiday type and sort id.
 * 3) Get the team from the database.
 * 4) Find the company in the team's company list.
 * 5) Delete the holiday from the company's holiday list.
 * 6) Replace the company in the team.
 * 7) Replace the team in the database.
 * 8) Respond with the updated team.
 */
router.delete('/team/company/holiday/:team/:company/:holid', auth, 
  async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const companyid = req.params.company as string;
    const holid = req.params.holid as string;
    const teamService = new TeamService();
    if (teamid !== '' && companyid !== '' && holid !== '') {
      const holType = (holid.substring(0,1).toLowerCase() === 'h') ? HolidayType.holiday
        : HolidayType.floating;
      const sortID = Number(holid.substring(1));
      const iTeam = await teamService.getTeam(teamid);
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach((co, c) => {
          if (co.id.toLowerCase() === companyid.toLowerCase()) {
            co.deleteHoliday(holType, sortID);
            team.companies[c] = co;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Required information not present in request')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamCompanyHoliday: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});