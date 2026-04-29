import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { SiteUpdate, NewSite, NewSitePersonnel } from 'scheduler-models/scheduler/sites/web';
import { Site } from "scheduler-models/scheduler/sites";
import { Team } from "scheduler-models/scheduler/teams";
import { BuildInitial, collections, EmployeeService, postLogEntry, TeamService, UserService } from "scheduler-services";
import { IUser, Permission, User } from "scheduler-models/users";
import { Assignment, Employee } from "scheduler-models/scheduler/employees";
import { genSaltSync, hashSync } from "bcrypt-ts";

const router = Router();
export default router;

/**
 * This method will be used to get the current site information for the account logged
 * in as.  This is part of the user's information, so it will be obtained from the user's
 * identifier.
 */
router.get('/site/:id', auth, async(req: Request, res: Response) => {
  try {
    const userid = req.params.id as string;
    if (userid) {
      const build = new BuildInitial(userid);
      const initial = await build.build();
      if (initial.site) {
        res.status(200).json(initial.site)
      } else {
        throw new Error('Site not provided')
      }
    } else {
      throw new Error('No User ID provided');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `site: Get: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will create a new site and fill in the basic information to the team
 * so that the new site will be included with the team in the database.
 */
router.post('/site', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewSite;
    const teamService = new TeamService();
    if (data.teamid && data.id) {
      const iTeam = await teamService.getTeam(data.teamid);
      let answer = new Site();
      if (iTeam) {
        const team = new Team(iTeam);
        // check for site with the new site identifier, if present throw error
        team.sites.forEach(s => {
          if (s.id.toLowerCase() === data.id.toLowerCase()) {
            throw new Error("Duplicate: Can't create new site with this identifier.")
          }
        });

        // not present, so add to team, update the team in the database and return 
        // new site to the requestor
        // first check attached personnel and add them.
        // Check to see if the people are in the authentication tables (users), if not 
        // add them and get their key id and use in employee table. first to check, then
        // to update for add.
        const siteEmployees: Employee[] = [];
        if (data.personnel && data.personnel.length > 0 ) {
          // check users for the person by email address.
          const pesonnelPromises = data.personnel.map(async(person) => {
            const emp = await addUser(person, data.teamid, data.id);
            siteEmployees.push(emp);
          });
          await Promise.allSettled(pesonnelPromises)
        }
        answer = new Site({
          id: data.id.toLowerCase(),
          name: data.name,
          utcOffset: data.utcoffset,
          showMids: data.showMids
        });
        answer.employees = siteEmployees;
        team.sites.push(answer);
        team.sites.sort((a,b) => a.compareTo(b));
        await teamService.replaceTeam(team);
        res.status(200).json(team);
      } else {
        throw new Error('Team not found');
      }
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `site: Post: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

async function addUser(person: NewSitePersonnel, team: string, site: string)
  : Promise<Employee> {
  try {
    let emp = new Employee();
    const empService = new EmployeeService();
    let user = new User();
    user.emailAddress = person.email;
    user.lastName = person.last;
    user.middleName = person.middle;
    user.firstName = person.first;
    if (!user.hasPermission('scheduler', 'employee')) {
      user.permissions.push(new Permission({
        application: 'scheduler',
        job: 'employee'
      }));
    }
    if (!user.hasPermission('scheduler', person.position)) {
      user.permissions.push(new Permission({
        application: 'scheduler',
        job: person.position,
      }));
    }
    const salt = genSaltSync(12)
    const hash = hashSync((person.password) 
      ? person.password : '', salt);
    user.password = hash;
    user.passwordExpires = new Date();
    user.badAttempts = 0;
    // the employee service insert method checks to see if there is already an employee
    // with this first, middle and last name.  If so, it updates the employee, if not
    // it inserts the employee in the employee collections.  It also checks for a user
    // with this first, last and middle names and creates an authentication record
    // if not present.
    emp = new Employee();
    emp.team = team;
    emp.site = site.toLowerCase();
    emp.email = person.email;
    emp.name.lastname = person.last;
    emp.name.firstname = person.first;
    emp.name.middlename = person.middle;
    const now = new Date();
    const asgmt = new Assignment();
    asgmt.id = 0;
    asgmt.startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    asgmt.endDate = new Date(Date.UTC(9998, 11, 31));
    asgmt.site = emp.site;
    asgmt.addSchedule(7);
    for ( let i=1; i < 6; i++) {
      asgmt.changeWorkday(0, i, 'staff', 'D', 8);
    }
    if (!emp.assignments) {
      emp.assignments = [];
    }
    emp.assignments.push(asgmt);
    emp.user = new User(user);
    await empService.insert(emp);
    return emp;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * This method will be used to update the basic information for the site, record the 
 * changes in the database and return the site to the requestor.
 */
router.put('/site', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as SiteUpdate;
    const teamService = new TeamService();
    if (data && data.team && data.site) {
      const iTeam = await teamService.getTeam(data.team);
      let answer = new Site();
      // update the basic site fields
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach((site, s) => {
          if (site.id.toLowerCase() === data.site.toLowerCase()) {
            switch (data.field.toLowerCase()) {
              case "id":
                site.id = data.value.toLowerCase();
                break;
              case "name":
                site.name = data.value;
                break;
              case "utc":
              case "utcoffset":
              case "offset":
                site.utcOffset = Number(data.value);
                break;
              case 'showmids':
              case "mids":
                site.showMids = (data.value.toLowerCase() === 'true');
                break;
            }
            answer = new Site(site);
            team.sites[s] = site;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(answer);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Update data not provided')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `site: Put: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will remove a site from the team and database.  Additionally, we need to
 * remove all the employees associated with the site.
 * STEPS:
 * 1) Get the team and site identifier to be deleted from the request.
 * 2) Get the team the site is associated with from the database.
 * 3) Find the site and delete if present.
 * 4) if site was present, delele all the employees associated with this team and site 
 * from the database.
 * 5) Update the team in the database.
 * 6) Check employee database for employees assigned to this site. 
 * 7) For each employee assigned, delete it, then check for a corresponding user in the
 * authentication collection.  If the user only has scheduler permissions, delete it, if
 * not, remove the scheduler permissions and replace the user.
 * 8) Respond with an empty site.
 */
router.delete('/site/:team/:site', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    if (teamid !== '' && siteid !== '') {
      const teamService = new TeamService();
      const empService = new EmployeeService();
      const userService = new UserService();
      const iTeam = await teamService.getTeam(teamid);
      if (iTeam) {
        const team = new Team(iTeam);
        // get the site to delete based on the id.
        let sitepos = -1;
        team.sites.forEach((site, s) => {
          if (site.id.toLowerCase() === siteid.toLowerCase()) {
            sitepos = s;
          }
        });
        if (sitepos >= 0) {
          await postLogEntry('site', `site: Delete: Site Deleted: ${siteid}`)
          team.sites.splice(sitepos, 1);
        }

        // update the database with the team
        await teamService.replaceTeam(team);

        // check for employees at this site.
        const employees = await empService.getBySite(siteid);
        if (employees.length > 0) {
          const empPromises = employees.map(async(iemp) => {
            const emp = new Employee(iemp);
            if (emp.user) {
              let otherPerms = false;
              emp.user.permissions.forEach(perm => {
                if (perm.application.toLowerCase() !== 'scheduler') {
                  otherPerms = true;
                }
              });
              if (!otherPerms) {
                await userService.remove(emp.user.id)
              } else {
                for (let i = emp.user.permissions.length - 1; i >= 0; i--) {
                  if (emp.user.permissions[i].application.toLowerCase() === 'scheduler') {
                    emp.user.permissions.splice(i, 1);
                  }
                }
                await userService.replace(emp.user);
              }
            }
            await empService.remove(emp.id);
          });
          await Promise.allSettled(empPromises);
        }
        res.status(200).json(team);
      } else {
        throw new Error('Team not found')
      }
    } else {
      if (!teamid) {
        throw new Error('Team identifier not provided.');
      }
      if (!siteid) {
        throw new Error('Site identifier not provided.');
      }
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `site: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});