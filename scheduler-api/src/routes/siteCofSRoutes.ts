import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { Team } from "scheduler-models/scheduler/teams";
import { LaborCode } from "scheduler-models/scheduler/labor";
import { getDateFromString } from "./employeeAssignmentRoutes";
import { Site } from "scheduler-models/scheduler/sites";
import { CofSReport, NewSiteCofSReport, NewSiteCofSReportSection, Section, 
  UpdateSiteCofSReport } from "scheduler-models/scheduler/sites/reports";
import { logConnection, postLogEntry, TeamService } from "scheduler-services";

const router = Router();
export default router;

/**
 * This method will be used to create a new CofS report in the site's cofs report list.
 * STEPS:
 * 1) Get the new CofS Report data from the request
 * 2) Pull the team from the database, then find the site.
 * 3) Check to see if the CofS Report is already in the list.
 * 4) If not found, add a CofS Report to the list.
 * 5) Update the team with the updated site
 * 6) Update the database with the updated team.
 * 7) Pull the team/site information again with employees for the site.
 * 8) Respond with the site information.
 */
router.post('/site/cofs', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewSiteCofSReport;
    const teamService = new TeamService();
    const iTeam = await teamService.getTeam(data.team);
    if (iTeam) {
      const team = new Team(iTeam);
      let answer = new Site();
      team.sites.forEach((site, s) => {
        if (site.id.toLowerCase() === data.site.toLowerCase()) {
          let found = false;
          let max = -1;
          site.cofs.forEach(cofs => {
            if (cofs.name.toLowerCase() === data.name.toLowerCase()
              && cofs.startdate.getTime() === new Date(data.start).getTime()
              && cofs.enddate.getTime() === new Date(data.end).getTime()) {
              found = true;
            } else if (max < cofs.id) {
              max = cofs.id;
            }
          });
          if (!found) {
            site.cofs.push(new CofSReport({
              id: max+1,
              name: data.name,
              shortname: data.shortname,
              unit: data.unit,
              startdate: new Date(data.start),
              enddate: new Date(data.end)
            }));
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
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `siteCofS: Post: Error: ${error.message}`);
    if (logConnection.log) {
      logConnection.log.log(`siteCofS: Post: Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to add a new CofS Section to a CofS Report.
 * STEPS:
 * 1) Get the required data from the request
 * 2) Pull the team from the database.
 * 3) Find the site and CofS report from the team and site, respectively.
 * 4) Check to see if the section is already in the list, based on label and company.
 * 5) if not found, add the new section without labor codes
 * 6) update the cofs report with the new section, then update the site
 * 7) update the site in the team.
 * 8) Update the team in the database.
 * 9) Respond with the site information
 */
router.post('/site/cofs/section', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewSiteCofSReportSection;
    const teamService = new TeamService();
    const iTeam = await teamService.getTeam(data.team);
    let answer = new Site();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach((site, s) => {
        if (site.id.toLowerCase() === data.site.toLowerCase()) {
          site.cofs.forEach((cofs, c) => {
            if (cofs.id === data.reportid) {
              let found = false;
              let max = -1;
              cofs.sections.forEach(section => {
                if (section.label.toLowerCase() === data.label.toLowerCase()
                  && section.company.toLowerCase() === data.company.toLowerCase()) {
                  found = true;
                } else if (max < section.id) {
                  max = section.id;
                }
              });
              if (!found) {
                cofs.sections.push(new Section({
                  id: max+1,
                  label: data.label,
                  company: data.company,
                  signature: data.signature,
                  showunit: data.showunit
                }));
              }
              cofs.sections.sort((a,b) => a.compareTo(b));
              site.cofs[c] = cofs;
            }
          })
          answer = new Site(site);
          team.sites[s] = site;
        }
      });
      await teamService.replaceTeam(team);
      res.status(200).json(answer);
    } else {
      throw new Error('Team not found');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `siteCofS: Section: Post: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to update a cofs report and/or its section.
 * STEPS:
 * 1) Get the update information from the request.
 * 2) Get the team from the database and find the site.
 * 3) Find the report from the CofS List.
 * 4) If the update information contains a section id, find the section.
 * 5) Update the field in either the cofs report or section
 * 6) Update the cofs report in the site.
 * 7) Update the team with the updated site.
 * 8) Update the team in the database.
 * 9) Respond with the update site information.
 */
router.put('/site/cofs', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateSiteCofSReport;
    const teamService = new TeamService();
    const iTeam = await teamService.getTeam(data.team);
    let answer = new Site();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach((site, s) => {
        if (site.id.toLowerCase() === data.site.toLowerCase()) {
          site.cofs.forEach((cofs, c) => {
            if (cofs.id === data.reportid) {
              if (data.sectionid >= 0) {
                // this section allows for the updating of a CofS Section data
                cofs.sections.forEach((section, n) => {
                  if (section.id === data.sectionid) {
                    switch (data.field.toLowerCase()) {
                      case "label":
                        section.label = data.value;
                        break;
                      case "company":
                        section.company = data.value;
                        break;
                      case "signature":
                        section.signature = data.value;
                        break;
                      case "showunit":
                        section.showunit = (data.value.toLowerCase() === 'true');
                        break;
                      case "laborcodes":
                        const codes = data.value.split(',');
                        const laborcodes: LaborCode[] = [];
                        codes.forEach(code => {
                          const parts = code.split('|');
                          console.log(parts);
                          laborcodes.push(new LaborCode({
                            chargeNumber: parts[0], 
                            extension: parts[1]
                          }));
                        });
                        section.laborcodes = laborcodes;
                        break;
                      case "addlaborcode":
                      case "addlabor":
                      case "add":
                        const aparts = data.value.split('|');
                        let found = false;
                        section.laborcodes.forEach(lc => {
                          if (aparts[0].toLowerCase() === lc.chargeNumber.toLowerCase()
                            && aparts[1].toLowerCase() === lc.extension.toLowerCase()) {
                            found = true;
                          }
                        });
                        if (!found) {
                          section.laborcodes.push(new LaborCode({
                            chargeNumber: aparts[0],
                            extension: aparts[1]
                          }));
                          section.laborcodes.sort((a,b) => a.compareTo(b));
                        }
                        break;
                      case "removelaborcode":
                      case "removelabor":
                      case "remove":
                        const rparts = data.value.split('|');
                        let pos = -1;
                        section.laborcodes.forEach((lc, l) => {
                          if (rparts[0].toLowerCase() === lc.chargeNumber.toLowerCase()
                            && rparts[1].toLowerCase() === lc.extension.toLowerCase()) {
                            pos = l;
                          }
                        });
                        if (pos >= 0) {
                          section.laborcodes.splice(pos, 1);
                        }
                        break;
                      case "move":
                        if (data.value.toLowerCase() === 'up') {
                          if (n > 0) {
                            const tsort = cofs.sections[n-1].id;
                            cofs.sections[n-1].id = section.id;
                            section.id = tsort;
                          }
                        } else {
                          if (n < cofs.sections.length - 1) {
                            const tsort = cofs.sections[n+1].id;
                            cofs.sections[n+1].id = section.id;
                            section.id = tsort;
                          }
                        }
                        break;
                    }
                    cofs.sections[n] = section;
                  }
                });
              } else {
                // this section allows for the updating of the CofS Main data
                switch(data.field.toLowerCase()) {
                  case "name":
                    cofs.name = data.value;
                    break;
                  case "short":
                  case "shortname":
                    cofs.shortname = data.value;
                    break;
                  case "unit":
                    cofs.unit = data.value;
                    break;
                  case "start":
                  case "startdate":
                    const sdate = getDateFromString(data.value);
                    cofs.startdate = new Date(sdate);
                    break;
                  case "end":
                  case "enddate":
                    const edate = getDateFromString(data.value);
                    cofs.enddate = new Date(edate);
                    break;
                  case "remove":
                  case "removesection":
                    const sid = Number(data.value);
                    let found = -1;
                    cofs.sections.forEach((section, n) => {
                      if (section.id === sid) {
                        found = n;
                      }
                    });
                    if (found >= 0) {
                      cofs.sections.splice(found,1);
                    }
                    break;
                }
              }
              cofs.sections.sort((a,b) => a.compareTo(b));
              site.cofs[c] = cofs;
            }
          })
          answer = new Site(site);
          team.sites[s] = site;
        }
      });
      await teamService.replaceTeam(team);
      res.status(200).json(answer);
    } else {
      throw new Error('Team not found');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `siteCofS: Put: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to remove a cofs report from the site.
 * STEPS:
 * 1) Get the team, site, and report identifiers
 * 2) Get the team and site from the data given.
 * 3) Find the CofS report in the site's list to determine which is to be deleted.
 * 4) If found, remove it from the list.
 * 5) Update the site in the team record.
 * 6) Update the team in the database.
 * 7) Respond with the updated site.
 */
router.delete('/site/cofs/:team/:site/:id', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    const srptId = req.params.id as string;
    const teamService = new TeamService();
    if (teamid !== '' && siteid !== '' && srptId !== '') {
      const rptID = Number(srptId);
      const iTeam = await teamService.getTeam(teamid);
      let answer = new Site();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach((site, s) => {
          if (site.id.toLowerCase() === siteid.toLowerCase()) {
            let found = -1;
            site.cofs.forEach((cofs, f) => {
              if (cofs.id === rptID) {
                found = f;
              }
            })
            if (found >= 0) {
              site.cofs.splice(found, 1);
            }
            answer = new Site(site);
            team.sites[s] = site;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(answer);
      } else {
        throw new Error('Team No found')
      }
    } else {
      throw new Error('Missing Information: Team, site and/or CofS report id');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `siteCofS: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});