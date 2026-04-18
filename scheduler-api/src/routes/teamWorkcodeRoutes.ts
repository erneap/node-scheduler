import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { NewWorkcode, Team, UpdateTeam } from "scheduler-models/scheduler/teams";
import { Workcode } from "scheduler-models/scheduler/labor";
import { postLogEntry, TeamService } from "scheduler-services";

const router = Router();
export default router;

/**
 * This method is used to add a new workcode to a team's workcode list.
 * STEPS:
 * 1) Get the new workcode data from the request
 * 2) Retrieve the team
 * 3) Check to see if the new workcode will be a possible duplicate by comparing the 
 * new workcode's identifier and title against those already in the team's list.
 * 4) if not found, add the new workcode with the data provided.
 * 5) Replace the team in the database
 * 6) Respond with the team.
 */
router.post('/team/workcode', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewWorkcode;
    const teamService = new TeamService();
    if (data.team !== '') {
      const iTeam = await teamService.getTeam(data.team);
      if (iTeam) {
        const team = new Team(iTeam);
        let found = false;
        team.workcodes.forEach(wc => {
          if (wc.id.toLowerCase() === data.id.toLowerCase() 
            || wc.title.toLowerCase() === data.title.toLowerCase()) {
            found = true;
          }
        });
        if (!found) {
          team.workcodes.push(new Workcode({
            id: data.id,
            title: data.title,
            start: data.start,
            shiftCode: data.shiftCode,
            altcode: data.altcode,
            search: data.search,
            isLeave: data.isLeave,
            textcolor: data.textcolor,
            backcolor: data.backcolor
          }));
          await teamService.replaceTeam(team);
          res.status(200).json(team);
        } else {
          throw new Error('Either workcode identifier or title duplicate')
        }
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Team identifier not provided');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamWorkcodes: Post: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will update a workcode within a team, based on the request data.
 * STEPS:
 * 1) Get the update data from the request.
 * 2) Pull the team from the database.
 * 3) Search for the workcode in the team based on the identifier.
 * 4) Replace the field data requested.
 * 5) Save the team into the database.
 * 6) Respond with the team.
 */
router.put('/team/workcode', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateTeam;
    const teamService = new TeamService();
    if (data.team !== '' && data.optid && data.optid !== '') {
      const iTeam = await teamService.getTeam(data.team);
      if (iTeam) {
        const team = new Team(iTeam);
        team.workcodes.forEach((wc, w) => {
          if (wc.id.toLowerCase() === data.optid?.toLowerCase()) {
            switch (data.field.toLowerCase()) {
              case "id":
                wc.id = data.value;
                break;
              case "name":
              case "title":
                wc.title = data.value;
                break;
              case "start":
              case "starttime":
                wc.start = Number(data.value);
                break;
              case "shift":
              case "shiftcode":
                wc.shiftCode = data.value;
                break;
              case "alt":
              case "altcode":
                wc.altcode = data.value;
                break;
              case "search":
                wc.search = data.value;
                break;
              case "isleave":
                wc.isLeave = (data.value.toLowerCase() === 'true');
                break;
              case "text":
              case "textcolor":
                wc.textcolor = data.value;
                break;
              case "back":
              case "backcolor":
                wc.backcolor = data.value;
                break;
            }
            team.workcodes[w] = wc;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Missing Update information from request');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamWorkcodes: Put: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is used to remove a workcode object from the team workcode list.
 * STEPS:
 * 1) Get the team and workcode identifiers from the request parameters.
 * 2) Get the team from the database.
 * 3) Find the workcode in the team's workcode list.
 * 4) if found, remove the workcode from the list.
 * 5) Replace the team in the database.
 * 6) Respond with the updated team.
 */
router.delete('/team/workcode/:team/:wcid', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const wcID = req.params.wcid as string;
    const teamService = new TeamService();
    if (teamid !== '' && wcID !== '') {
      const iTeam = await teamService.getTeam(teamid);
      if (iTeam) {
        const team = new Team(iTeam);
        let found = -1;
        team.workcodes.forEach((wc, w) => {
          if (wc.id.toLowerCase() === wcID.toLowerCase()) {
            found = w;
          }
        });
        if (found >= 0) {
          team.workcodes.splice(found, 1);
        }
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Team and/or workcode identifier not present');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teamWorkcodes: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});