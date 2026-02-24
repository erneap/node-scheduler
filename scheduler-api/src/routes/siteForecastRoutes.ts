import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection, collections } from "scheduler-node-models/config";
import { Forecast, NewSiteForecast, NewSiteForecastChargeNumber, UpdateSiteForecastChargeNumber } from 'scheduler-node-models/scheduler/sites/reports';
import { ObjectId } from "mongodb";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";
import { getAllDatabaseInfo } from "./initialRoutes";
import { LaborCode } from "scheduler-node-models/scheduler/labor";

const router = Router();
export default router;

/**
 * This method will add a new forecast report to a site. 
 * STEPS:
 * 1) Pull team and get the site to update.
 * 2) Check for the forecast already in site, based on name, company, start and end dates.
 * 3) if not present, add it to the list of forecast reports.  it will contain no 
 *  charge numbers to associated work.
 * 4) Next, save the updated site to the team.
 * 5) Replace the team data in the database
 * 6) Return the updated site in the response.
 */
router.post('/site/forecast', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewSiteForecast;

    if (collections.teams) {
      const query = { _id: new ObjectId(data.team) };
      const iTeam = await collections.teams.findOne<ITeam>(query);
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach((site, s) => {
          if (site.id.toLowerCase() === data.site.toLowerCase()) {
            // check for report in list
            let found = false;
            let max = -1;
            site.forecasts.forEach(fcst => {
              if (fcst.name.toLowerCase() === data.name.toLowerCase()
                && fcst.companyid.toLowerCase() === data.company.toLowerCase()
                && fcst.startDate.getTime() === data.start.getTime()
                && fcst.endDate.getTime() === data.end.getTime()) {
                found = true;
              } else if (fcst.id > max) {
                max = fcst.id;
              }
            });
            if (!found) {
              const fsct = new Forecast({
                id: max + 1,
                name: data.name,
                startDate: new Date(data.start),
                endDate: new Date(data.end),
                companyid: data.company,
                sortfirst: data.sortFirst
              });
              fsct.changePeriodsStart(data.period);
              site.forecasts.push(fsct);
              site.forecasts.sort((a,b) => a.compareTo(b));
            } else {
              throw new Error('Team site forecast found');
            }
            team.sites[s] = site;
          }
        });
        await collections.teams.replaceOne(query, team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('No Teams Collection');
    }
    const now = new Date();
    const begin = new Date(Date.UTC(now.getFullYear() - 1, 1, 1));
    const initial = await getAllDatabaseInfo(data.team, data.site, begin, now);
    res.status(200).json(initial.site);
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to add a new labor code to the forecast report.
 * STEPS:
 * 1) Pull the team, get the site and forecast report to update.
 * 2) Check for the labor code being already present, by charge number and extension
 * 3) If not found, add labor code with all data to the forecast report at the end of the
 * list.
 * 4) Update the forecast report in the site.
 * 5) Update the site in the team.
 * 6) Replace the team in the database
 * 7) Response with the update site.
 */
router.post('/site/forecast/labor', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewSiteForecastChargeNumber;

    if (collections.teams) {
      const query = { _id: new ObjectId(data.team) };
      const iTeam = await collections.teams.findOne<ITeam>(query);
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach((site, s) => {
          if (site.id.toLowerCase() === data.site.toLowerCase()) {
            site.forecasts.forEach((fcst, f) => {
              if (fcst.id === data.forecast) {
                let found = false;
                let max = -1;
                fcst.laborCodes.forEach(lc => {
                  if (lc.chargeNumber.toLowerCase() === data.chargeNumber.toLowerCase()
                    && lc.extension.toLowerCase() === data.extension.toLowerCase()) {
                    found = true;
                  } else if (max < lc.sort) {
                    max = lc.sort;
                  }
                });
                if (!found) {
                  fcst.laborCodes.push(new LaborCode({
                    chargeNumber: data.chargeNumber,
                    extension: data.extension,
                    clin: data.clin,
                    slin: data.slin,
                    location: data.location,
                    wbs: data.wbs,
                    minimumEmployees: data.minimum,
                    notAssignedName: data.vacantName,
                    hoursPerEmployee: data.hoursPerEmployee,
                    exercise: data.exercise,
                    startDate: data.start,
                    endDate: data.end,
                    sort: max + 1
                  }));
                  fcst.laborCodes.sort((a,b) => a.compareTo(b));
                }
                site.forecasts[f] = fcst;
              }
            })
            team.sites[s] = site;
          }
        });
        await collections.teams.replaceOne(query, team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Teams collection not found')
    }
    const now = new Date();
    const begin = new Date(Date.UTC(now.getFullYear() - 1, 1, 1));
    const initial = await getAllDatabaseInfo(data.team, data.site, begin, now);
    res.status(200).json(initial.site);
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is the only update method for forecast reports, to include moving and 
 * deleting labor codes.
 * STEPS:
 * 1) Pull the team from the database and find the site.
 * 2) Find the forecast report from the site.
 * 3) if the data includes a charge number and extension
 */
router.put('/site/forecast', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateSiteForecastChargeNumber
    if (collections.teams) {
      const query = { _id: new ObjectId(data.team) };
      const iTeam = await collections.teams.findOne<ITeam>(query);
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach((site, s) => {
          if (site.id.toLowerCase() === data.site.toLowerCase()) {
            site.forecasts.forEach((fcst, f) => {
              if (fcst.id === data.forecast) {
                // if the data provided includes a charge number and extension then the
                // update is for a labor code, else its for the forecast itself.
                if (data.chargeNumber !== '' && data.extension !== '') {
                  if (data.field.toLowerCase() !== 'remove') {
                    fcst.laborCodes.sort((a,b) => a.compareTo(b));
                    fcst.laborCodes.forEach((lc, l) => {
                      if (lc.chargeNumber.toLowerCase() === data.chargeNumber.toLowerCase()
                        && lc.extension.toLowerCase() === data.extension.toLowerCase()) {
                        switch (data.field.toLowerCase()) {
                          case "chargenumber":
                          case "cn":
                            lc.chargeNumber = data.value;
                            break;
                          case "extension":
                          case "ext":
                            lc.extension = data.value;
                            break;
                          case "clin":
                            lc.clin = data.value;
                            break;
                          case "slin":
                            lc.slin = data.value;
                            break;
                          case "location":
                            lc.location = data.value;
                            break;
                          case "wbs":
                            lc.wbs = data.value;
                            break;
                          case "minimums":
                          case "minimumemployees":
                            lc.minimumEmployees = Number(data.value);
                            break;
                          case "vacantname":
                          case "notassigned":
                          case "notassignedname":
                            lc.notAssignedName = data.value;
                            break;
                          case "hours":
                          case "hoursperemployee":
                            lc.hoursPerEmployee = Number(data.value);
                            break;
                          case "exercise":
                            lc.exercise = (data.value.toLowerCase() === 'true');
                            break;
                          case "start":
                          case "startdate":
                            lc.startDate = getDateFromString(data.value);
                            break;
                          case "end":
                          case "enddate":
                            lc.endDate = getDateFromString(data.value);
                            break;
                          case "move":
                            if (data.value.toLowerCase() === 'up') {
                              if (l > 0) {
                                const tSort = fcst.laborCodes[l-1].sort;
                                fcst.laborCodes[l-1].sort = lc.sort;
                                lc.sort = tSort;
                              }
                            } else {
                              if (l < fcst.laborCodes.length - 1) {
                                const tSort = fcst.laborCodes[l+1].sort;
                                fcst.laborCodes[l+1].sort = lc.sort;
                                lc.sort = tSort;
                              }
                            }
                            break;
                        }
                        fcst.laborCodes[l] = lc;
                        fcst.laborCodes.sort((a,b) => a.compareTo(b));
                      }
                    });
                  } else {
                    let found = -1;
                    fcst.laborCodes.forEach((lc, l) => {
                      if (lc.chargeNumber.toLowerCase() === data.chargeNumber.toLowerCase()
                        && lc.extension.toLowerCase() === data.extension.toLowerCase()) {
                        found = l;
                      }
                    });
                    if (found >= 0) {
                      fcst.laborCodes.splice(found, 1);
                    }
                  }
                } else {
                  switch (data.field.toLowerCase()) {
                    case "name":
                      fcst.name = data.value;
                      break;
                    case "company":
                    case "companyid":
                      fcst.companyid = data.value;
                      break;
                    case "sortfirst":
                      fcst.sortfirst = (data.value.toLowerCase() === 'true');
                      break;
                    case "start":
                    case "startdate":
                      fcst.startDate = getDateFromString(data.value);
                      break;
                    case "end":
                    case "enddate":
                      fcst.endDate = getDateFromString(data.value);
                      break;
                    case "period":
                      fcst.changePeriodsStart(Number(data.value));
                      break;
                    case "move":
                    case "moveperiod":
                      const parts = data.value.split('|');
                      const fromDate = getDateFromString(parts[0]);
                      const toDate = getDateFromString(parts[1]);
                      fcst.movePeriodBetweenMonths(fromDate, toDate);
                      break;
                    case "addperiod":
                      const newPrd = getDateFromString(data.value);
                      fcst.addOutofCycleSubPeriod(newPrd);
                      break;
                  }
                }
                site.forecasts[f] = fcst;
              }
            });
            team.sites[s] = site;
          }
        });
        await collections.teams.replaceOne(query, team);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Teams Collection not found');
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
 * This method will be used to convert a date string in the format of 2006-01-02 to 
 * a Date object with that date.
 * @param date A string value in the correct format
 * @returns 
 */
export function getDateFromString(date: string): Date {
  const reDateFormat = new RegExp('^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$');
  if (reDateFormat.test(date)) {
    const parts = date.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);

    const result = new Date(Date.UTC(year, month - 1, day));
    return result;
  } else {
    throw new Error('Date not in correct format (yyyy-mm-dd)');
  }
}

router.delete('/site/forecast/:team/:site/:id', auth, async(req: Request, res: Response) => {
  try {

  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});