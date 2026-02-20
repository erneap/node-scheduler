import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection, collections } from "scheduler-node-models/config";
import { getAllDatabaseInfo, getEmployee } from "./initialRoutes";
import { SiteUpdate, NewSite } from 'scheduler-node-models/scheduler/sites/web';
import { Site } from "scheduler-node-models/scheduler/sites";
import { ObjectId } from "mongodb";
import { Employee } from "scheduler-node-models/scheduler/employees";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";

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
      const now = new Date();
      const begin = new Date(Date.UTC(now.getFullYear() - 1, 1, 1));
      const employee = await getEmployee(userid);
      const initial = await getAllDatabaseInfo(employee.team, employee.site, begin, now);
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
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
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
    if (data.teamid && data.id) {
      if (collections.teams) {
        const query = { _id: new ObjectId(data.teamid)};
        const iTeam = await collections.teams.findOne<ITeam>(query);
        if (iTeam) {
          const team = new Team(iTeam);
          // check for site with the new site identifier, if present throw error
          team.sites.forEach(s => {
            if (s.id.toLowerCase() === data.id.toLowerCase()) {
              throw new Error("Can't create new site with this identifier.")
            }
          });

          // not present, so add to team, update the team in the database and return 
          // new site to the requestor
          const nSite = new Site({
            id: data.id,
            name: data.name,
            utcOffset: data.utcoffset,
            showMids: data.showMids
          });
          team.sites.push(nSite);
          team.sites.sort((a,b) => a.compareTo(b));
          await collections.teams.replaceOne(query, team);
          res.status(200).json(nSite);
        } else {
          throw new Error('No team for given identifier.');
        }
      } else {
        throw new Error('No team collection provided.');
      }
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
 * This method will be used to update the basic information for the site, record the 
 * changes in the database and return the site to the requestor.
 */
router.put('/site', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as SiteUpdate;
    if (data && data.team && data.site) {
      // Get the site and team information
      const now = new Date();
      const begin = new Date(Date.UTC(now.getFullYear() - 1, 1, 1));
      const initial = await getAllDatabaseInfo(data.team, data.site, begin, now);

      // update the basic site fields
      if (initial.site) {
        const site = new Site(initial.site);
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

        // update the team, then update the team in the database
        initial.team.sites.forEach((s, pos) => {
          if (s.id === initial.site.id) {
            initial.team.sites[pos] = site;
          }
        });
        if (collections.teams) {
          const teamQuery = { _id: new ObjectId(initial.team.id)};
          const result = await collections.teams.replaceOne(teamQuery, initial.team);
          if (result.matchedCount <= 0) {
            throw new Error('Team not updated');
          }
          site.employees = [];
          if (initial.site.employees && site.employees) {
            initial.site.employees.forEach(emp => {
              if (site.employees) {
                site.employees.push(new Employee(emp));
              }
            });
            site.employees.sort((a,b) => a.compareTo(b));
          }
          res.status(200).json(site);
        } else {
          throw new Error('Team Collection not found');
        }
      }
    } else {
      throw new Error('Update data not provided')
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
 * This method will remove a site from the team and database.
 */
router.delete('/site/:team/:site', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    if (teamid && siteid) {
      if (collections.teams) {
        const query = { _id: new ObjectId(teamid)};
        const iTeam = await collections.teams.findOne<ITeam>(query);
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
            team.sites.splice(sitepos, 1);
          }

          // update the database with the team
          await collections.teams.replaceOne(query, team);
          res.status(200).json(new Site());
        } else {
          throw new Error('No Team to update for identifier')
        }
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
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});