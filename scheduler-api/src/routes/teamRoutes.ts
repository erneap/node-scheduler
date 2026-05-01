import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { Contact, NewTeam, Specialty, Team, UpdateTeam } 
  from "scheduler-models/scheduler/teams";
import { EmployeeService, postLogEntry, TeamService, UserService } from "scheduler-services";
import { User } from "scheduler-models/users";
import { Employee } from "scheduler-models/scheduler/employees";

const router = Router();
export default router;

/**
 * This method will provide the team object from the identifier given.
 * STEPS:
 * 1) Get the team identifier from the request
 * 2) Check for the teams database collection
 * 3) Pull the team from the database
 * 4) Pull the employees for the team and add
 * 4) Respond with the team.
 */
router.get('/team/:team', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    console.log(teamid);
    if (teamid !== '') {
      const teamService = new TeamService();
      const userService = new UserService();
      const employeeService = new EmployeeService();
      const iTeam = await teamService.getTeam(teamid);
      if (iTeam) {
        const team = new Team(iTeam);
        const employees: Employee[] = [];
        const emps = await employeeService.getByTeam(teamid);
        emps.forEach(emp => {
          employees.push(new Employee(emp));
        });
        employees.sort((a,b) => a.compareTo(b));
        team.employees = employees;
        res.status(200).json(team);
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

/**
 * This method will get all the teams in the database, to display in the admin
 * teams page for editing
 */
router.get('/teams', auth, async(req: Request, res: Response) => {
  try {
    const teamService = new TeamService();
    const iTeams = await teamService.getAllTeams();
    const teams: Team[] = [];
    iTeams.forEach(team => {
      teams.push(new Team(team));
    })
    teams.sort((a,b) => (a.name < b.name) ? -1 : 1);
    res.status(200).json(teams);
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `teams: Get: Error: ${error.message}`);
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
    const teamService = new TeamService();
    const teams = await teamService.getAllTeams();
    if (data.name !== '') {
      let found = false;
      teams.forEach(tm => {
        if (tm.name.toLowerCase() === data.name.toLowerCase()) {
          found = true;
        }
      });
      if (!found) {
        const team = new Team();
        team.name = data.name;
        const result = await teamService.insertTeam(team);
        res.status(200).json(result);
      } else {
        throw new Error('New Team Name already in use.')
      }
    } else {
      throw new Error('Empty team name')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `team: Post: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is used to update a team. which is mainly the name field, but I've included
 * updating the specialty type and contact type lists.  You can add, remove, change name 
 * and move the item.
 * STEPS:
 * 1) Get the data from the request as an UpdateTeam object.
 * 2) Get team from the database
 * 3) based on the field value fo the data object, update the team.
 * 4) replace the team in the database
 * 5) respond with the updated team.
 */
router.put('/team', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateTeam;
    const teamService = new TeamService();
    if (data.team !== '') {
      const iTeam = await teamService.getTeam(data.team);
      if (iTeam) {
        const team = new Team(iTeam);
        let bfound = false;
        let ifound = -1;
        let max = -1;
        let sort = -1;
        switch (data.field.toLowerCase()) {
          case "name":
            team.name = data.value;
            break;
          case "addspecialty":
            // first check to ensure the new specialty isn't already in the list
            bfound = false;
            max = -1;
            sort = -1;
            team.specialties.forEach(spc => {
              if (spc.name.toLowerCase() === data.value.toLowerCase()) {
                bfound = true;
              } else { 
                if (max < spc.id) {
                  max = spc.id;
                }
                if (sort < spc.sort) {
                  sort = spc.sort;
                }
              }
            });
            // if not found, add it.
            if (!bfound) {
              team.specialties.push(new Specialty({
                id: max+1,
                name: data.value,
                sort: sort+1
              }));
            }
            break;
          case "changespecialty":
            if (data.optid) {
              team.specialties.forEach((spc, s) => {
                if (spc.id === Number(data.optid)) {
                  team.specialties[s].name = data.value;
                }
              });
            }
            break;
          case "movespecialty":
            let spcID = -1;
            if (data.optid) {
              spcID = Number(data.optid);
            }
            team.specialties.sort((a,b) => a.compareTo(b));
            // find the specialty to move, then swap sort numbers with either the one
            // before (up) or after (down)
            team.specialties.forEach((spc, s) => {
              if (spc.id === spcID) {
                if (data.value.toLowerCase() === 'up' && s > 0) {
                  const tsort = team.specialties[s-1].sort;
                  team.specialties[s-1].sort = spc.sort;
                  team.specialties[s].sort = tsort;
                } else if (data.value.toLowerCase() !== 'up' 
                  && s < team.specialties.length - 1) {
                  const tsort = team.specialties[s+1].sort;
                  team.specialties[s+1].sort = spc.sort;
                  team.specialties[s].sort = tsort;
                }
              }
            });
            break;
          case "removespecialty":
            // find the identifier for the specialty in the specialty list, then
            // delete it.
            ifound = -1;
            let sID = -1;
            if (data.optid) {
              sID = Number(data.optid);
            } else {
              sID = Number(data.value);
            }
            team.specialties.forEach((spc, s) => {
              if (spc.id === sID) {
                ifound = s;
              }
            });
            if (ifound >= 0) {
              team.specialties.splice(ifound, 1);
            }
            break;
          case "addcontact":
          case "addcontacttype":
            bfound = false;
            max = -1;
            sort = -1;
            // search to see if the contact type is already in the list by name
            team.contacttypes.forEach(ct => {
              if (ct.name.toLowerCase() === data.value.toLowerCase()) {
                bfound = true;
              } else {
                if (max < ct.id) {
                  max = ct.id;
                }
                if (sort < ct.sort) {
                  sort = ct.sort;
                }
              }
            });
            // if not found, add it to the list at the end.
            if (!bfound) {
              team.contacttypes.push(new Contact({
                id: max+1,
                name: data.value,
                sort: sort+1
              }));
            }
            break;
          case "changecontact":
          case "changecontacttype":
            if (data.optid) {
              team.contacttypes.forEach((spc, s) => {
                if (spc.id === Number(data.optid)) {
                  team.contacttypes[s].name = data.value;
                }
              });
            }
            break;
          case "movecontact":
          case "movecontacttype":
            let ctID = -1;
            if (data.optid) {
              ctID = Number(data.optid);
            }
            team.contacttypes.sort((a,b) => a.compareTo(b));
            // find the specialty to move, then swap sort numbers with either the one
            // before (up) or after (down)
            team.contacttypes.forEach((spc, s) => {
              if (spc.id === ctID) {
                if (data.value.toLowerCase() === 'up' && s > 0) {
                  const tsort = team.contacttypes[s-1].sort;
                  team.contacttypes[s-1].sort = spc.sort;
                  team.contacttypes[s].sort = tsort;
                } else if (data.value.toLowerCase() !== 'up' 
                  && s < team.contacttypes.length - 1) {
                  const tsort = team.contacttypes[s+1].sort;
                  team.contacttypes[s+1].sort = spc.sort;
                  team.contacttypes[s].sort = tsort;
                }
              }
            });
            break;
          case "removecontact":
          case "removecontacttype":
            // find the identifier for the specialty in the specialty list, then
            // delete it.
            ifound = -1;
            let cID = -1;
            if (data.optid) {
              cID = Number(data.optid);
            } else {
              cID = Number(data.value);
            }
            team.contacttypes.forEach((spc, s) => {
              if (spc.id === cID) {
                ifound = s;
              }
            });
            if (ifound >= 0) {
              team.contacttypes.splice(ifound, 1);
            }
            break;
        }
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('No team identifier provided')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `team: Delete: Put: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will remove a team based on its identifier from the database.
 * STEPS:
 * 1) Determine the team identifier from the request.
 * 2) Find the team in the database.
 * 3) if found, remove it from the database
 * 4) Respond with an empty team object.
 */
router.delete('/team/:team', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const teamService = new TeamService();
    if (teamid !== '') {
      const iTeam = await teamService.getTeam(teamid);
      if (iTeam) {
        await teamService.deleteTeam(teamid);
        res.status(200).json(new Team());
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('No team identifier given');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('team', `team: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});