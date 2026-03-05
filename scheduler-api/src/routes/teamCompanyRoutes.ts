import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection, collections } from "scheduler-node-models/config";
import { ObjectId } from "mongodb";
import { ITeam, NewCompany, Team, UpdateTeam } from "scheduler-node-models/scheduler/teams";
import { Company } from "scheduler-node-models/scheduler/teams/company";

const router = Router();
export default router;

/**
 * This method will be used to add a new company to the team.
 * STEPS:
 * 1) Pull the company information from the request.
 * 2) Pull the team from the database.
 * 3) Check if the company is already in the company list for the team, based on identifer
 * and/or name.
 * 4) if not found, add the company to the team's company list.
 * 5) Update the team in the database.
 * 6) Respond with the team.
 */
router.post('/team/company', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewCompany;
    if (data.team !== '' && data.id !== '') {
      if (collections.teams) {
        const query = { _id: new ObjectId(data.team) };
        const iTeam = await collections.teams.findOne<ITeam>(query);
        if (iTeam) {
          const team = new Team(iTeam);
          let found = false;
          team.companies.forEach(co => {
            if (co.id.toLowerCase() === data.id.toLowerCase() 
              || co.name.toLowerCase() === data.name.toLowerCase()) {
              found = true;
            }
          });
          if (!found) {
            team.companies.push(new Company({
              id: data.id,
              name: data.name,
              ingest: data.ingest,
              ingestPeriod: data.ingestPeriod,
              startDay: data.startDay,
              ingestPwd: data.ingestPwd
            }));
          } else {
            throw new Error('Company already present')
          }
        } else {
          throw new Error('Team not found');
        }
      } else {
        throw new Error('No teams collections provided');
      }
    } else {
      throw new Error('Required data not present')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`teamCompany: Post: Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is used to update a field within a company.
 * STEPS:
 * 1) Get the team update information from the request
 * 2) Check to ensure a team and company identifier is present in the update info.
 * 3) Get the team from the database
 * 4) Find the company in the team's company list.
 * 5) Update the field within the company.
 * 6) Replace the team within the database.
 * 7) Respond with the updated team.
 */
router.put('/team/company', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateTeam;
    if (data.team !== '' && data.companyid && data.companyid !== '') {
      if (collections.teams) {
        const query = { _id: new ObjectId(data.team) };
        const iTeam = await collections.teams.findOne<ITeam>(query);
        if (iTeam) {
          const team = new Team(iTeam);
          team.companies.forEach((co, c) => {
            if (co.id.toLowerCase() === data.companyid?.toLowerCase()) {
              switch (data.field.toLowerCase()) {
                case "name":
                  co.name = data.value;
                  break;
                case "ingest":
                  co.ingest = data.value;
                  break;
                case "period":
                case "ingestperiod":
                  co.ingestPeriod = Number(data.value);
                  break;
                case "start":
                case "startday":
                  co.startDay = Number(data.value);
                  break;
                case "pwd":
                case "password":
                case "ingestpwd":
                  co.ingestPwd = data.value;
                  break;
              }
              team.companies[c] = co;
            }
          });
          await collections.teams.replaceOne(query, team);
          res.status(200).json(team);
        } else {
          throw new Error('Team not found');
        }
      } else {
        throw new Error('No teams collection provided')
      }
    } else {
      throw new Error('Either team and/or company identifier not present in request');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`teamCompany: Put: Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to remove a company from a team.
 * STEPS:
 * 1) Pull the team and company identifier from the request.
 * 2) Check to ensure both identifiers are present.
 * 3) Get the team from the database.
 * 4) Find the company in the team's company list.
 * 5) If present, remove it.
 * 6) Replace the team in the database.
 * 7) Respond with the updated team.
 */
router.delete('/team/company/:team/:company', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const companyid = req.params.company as string;
    if (teamid !== '' && companyid !== '') {
      if (collections.teams) {
        const query = { _id: new ObjectId(teamid) };
        const iTeam = await collections.teams.findOne<ITeam>(query);
        if (iTeam) {
          const team = new Team(iTeam);
          let found = -1;
          team.companies.forEach((co, c) => {
            if (co.id.toLowerCase() === companyid.toLowerCase()) {
              found = c;
            }
          });
          if (found >= 0) {
            team.companies.splice(found, 1);
          }
          await collections.teams.replaceOne(query, team);
          res.status(200).json(team);
        } else {
          throw new Error('Team not found');
        }
      } else {
        throw new Error('No team collections provided');
      }
    } else {
      throw new Error('Missing either team or company identifier');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`teamCompany: Delete: Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});