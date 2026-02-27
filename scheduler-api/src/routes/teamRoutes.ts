import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection, collections } from "scheduler-node-models/config";
import { getAllDatabaseInfo, getEmployee } from "./initialRoutes";
import { SiteUpdate, NewSite } from 'scheduler-node-models/scheduler/sites/web';
import { Site } from "scheduler-node-models/scheduler/sites";
import { ObjectId } from "mongodb";
import { Employee } from "scheduler-node-models/scheduler/employees";
import { ITeam, NewTeam, Team, UpdateTeam } from "scheduler-node-models/scheduler/teams";

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
router.get('/team/:team', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    if (collections.teams) {
      if (teamid && teamid !== '') {
        const query = { _id: new ObjectId(teamid) };
        const iTeam = await collections.teams.findOne<ITeam>(query);
        if (iTeam) {
          const team = new Team(iTeam);
          res.status(200).json(team);
        } else {
          throw new Error('Team not found');
        }
      } else {
        throw new Error('Team id not provided.')
      }
    } else {
      throw new Error('No team collection provided')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will create a new team from the data given (name).
 * STEPS:
 * 1) Pull required data from the request.
 * 2) Check to see if team name is already used in the database.
 * 3) if not found, create the team
 * 4) Insert the team in the database and pull the identifier.
 * 5) Add identifier to the team object.
 * 6) Respond with the team object.
 */
router.post('/team', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewTeam;
    if (collections.teams) {
      if (data.name !== '') {
        const teamCursor = await collections.teams.find<ITeam>({});
        const teams = await teamCursor.toArray();
        let found = false;
        teams.forEach(tm => {
          if (tm.name.toLowerCase() === data.name.toLowerCase()) {
            found = true;
          }
        });
        if (!found) {
          const team = new Team();
          team.name = data.name;
          const result = await collections.teams.insertOne(team);
          team.id = result.insertedId.toString();
          res.status(200).json(team);
        } else {
          throw new Error('New Team Name already in use.')
        }
      } else {
        throw new Error('Empty team name')
      }
    } else {
      throw new Error('No team collection provided')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * 
 */
router.put('/team', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateTeam;
    if (collections.teams) {
      if (data.team !== '') {
        const query = { _id: new ObjectId(data.team)};
        const iTeam = await collections.teams.findOne<ITeam>(query);
        if (iTeam) {
          const team = new Team(iTeam);
          switch (data.field.toLowerCase()) {
            case "name":
              team.name = data.value;
              break;
          }
          await collections.teams.replaceOne(query, team);
          res.status(200).json(team);
        } else {
          throw new Error('Team not found for identifier');
        }
      } else {
        throw new Error('No team identifier provided')
      }
    } else {
      throw new Error('No team collection provided')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});