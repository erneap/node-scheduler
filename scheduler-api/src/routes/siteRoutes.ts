import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { SiteUpdate, NewSite } from 'scheduler-models/scheduler/sites/web';
import { Site } from "scheduler-models/scheduler/sites";
import { ObjectId } from "mongodb";
import { Employee } from "scheduler-models/scheduler/employees";
import { ITeam, Team } from "scheduler-models/scheduler/teams";
import { BuildInitial, collections, postLogEntry, TeamService } from "scheduler-services";

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
        answer = new Site({
          id: data.id,
          name: data.name,
          utcOffset: data.utcoffset,
          showMids: data.showMids
        });
        team.sites.push(answer);
        team.sites.sort((a,b) => a.compareTo(b));
        await teamService.replaceTeam(team);
        res.status(200).json(answer);
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
 * 6) Respond with an empty site.
 */
router.delete('/site/:team/:site', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    if (teamid !== '' && siteid !== '') {
      const teamService = new TeamService();
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
        res.status(200).json({ message: 'site deleted'});
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