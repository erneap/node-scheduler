import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { ITeam, NewCompany, NewCompanyHoliday, NewModPeriod, NewWorkcode, Team, UpdateTeam } from 'scheduler-models/scheduler/teams';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SecurityQuestion } from 'scheduler-models/users';
import { map, Observable } from 'rxjs';
import { Employee } from 'scheduler-models/scheduler/employees';
import { Item } from '../general/list/list.model';
import { HolidayType } from 'scheduler-models/scheduler/teams/company';

@Injectable({
  providedIn: 'root',
})
export class TeamService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;
  questions: SecurityQuestion[] = [];
  selectedSite = signal<string>('');
  teamSiteList = signal<Item[]>([]);
  sites = signal<Item[]>([]);

  constructor(
    private http: HttpClient
  ) {
    super();
  }

  /**
   * This method will place the pulled team object into storage/cache to be used later.
   * @param iTeam The team object to be stored
   */
  setTeam(iTeam: ITeam) {
    const sList: Item[] = [];
    sList.push({
      id: 'new',
      value: 'Add New Site',
    })
    const team = new Team(iTeam);
    team.sites.forEach(site => {
      sList.push({
        id: site.id,
        value: site.name.toUpperCase(),
      });
    });
    this.teamSiteList.set(sList);
    this.setItem('team', iTeam);
  }

  /**
   * This method is used to pull the team object from storage/cache for use by the app.
   * @returns The team object in storage.
   */
  getTeam(): Team | undefined {
    const iTeam = this.getItem<ITeam>('team');
    if (iTeam) {
      return new Team(iTeam);
    }
    return undefined;
  }

  /**
   * This method removes the team object from storage/cache.
   */
  removeTeam() {
    this.removeItem('team');
  }

  /**
   * This method places the list of security questions into storage/cache
   * @param questions The list of security questions.
   */
  setQuestions(questions: SecurityQuestion[]) {
    this.setItem('questions', questions);
  }

  /**
   * This method will pull the list of security questions from storage/cache to provide
   * to the app.
   * @returns A list of security questions.
   */
  getQuestions(): SecurityQuestion[] {
    const answer: SecurityQuestion[] = [];
    const questions = this.getItem<SecurityQuestion[]>('questions');
    if (questions) {
      questions.forEach(quest => {
        answer.push(new SecurityQuestion(quest));
      });
    }
    return answer;
  }

  /**
   * This method clears the storage/cache of the list of security quesitons.
   */
  removeQuestions() {
    this.removeItem('questions');
  }

  /**
   * This method is used to perform a simple query of those working on the team at this
   * time.
   * @param teamid The string value for the team's identifier.
   * @returns A list of employees that are working at the time of the request.
   */
  getSimpleQuery(teamid: string): Observable<HttpResponse<Employee[]>> {
    const url = `${this.schedulerUrl}/team/query/${teamid}`;
    return this.http.get<Employee[]>(url, { observe: 'response'});
  }

  /**
   * This method is used to prepare and send a request to update a team in the database.
   * The request is sent to the API process on the server
   * @param team The string value for the team's identifier for the team to be updated
   * @param field The field name, as string, to be updated
   * @param value The string value to update the field to.
   * @returns The updated team object for storage in a HTTP response object, which is 
   * handled by this service.
   */
  updateTeam(team: string, field: string, value: string, optid?: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team`;
    const data: UpdateTeam = {
      team: team,
      field: field,
      value: value,
      optid: optid
    };
    return this.http.put<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This method is used to add a team work/leave code to the team's workcode list.
   * @param team The string identifier for the team to be updated
   * @param id The new id/code to used for this new work/leave code
   * @param title A short string value to use as a title for the work/leave code.
   * @param start A numeric value for the start time for work codes
   * @param shiftcode A string/numeric value for any premimum code a company may assign.
   * @param altcode An alternate code/identifier that may be used in reports
   * @param search (optional) a short search string to use when parsing leave codes during
   * ingest of timecard data.
   * @param isleave A boolean value for whether this code is leave or work
   * @param text A string value for the six-digit hexidecimal number for the text color.
   * @param back A string value for the six-digit hexidecimal number for the background
   * color.
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  addWorkcode(team: string, id: string, title: string, start: number, shiftcode: string, 
    altcode: string, search: string, isleave: boolean, text: string, back: string)
    : Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/workcode`;
    const data: NewWorkcode = {
      team: team,
      id: id,
      title: title,
      start: start,
      shiftCode: shiftcode,
      altcode: altcode,
      search: search,
      isLeave: isleave,
      textcolor: text,
      backcolor: back
    };
    return this.http.post<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This method will be used to update a leave/work code, by field.
   * @param team The string identifier for the team whose work/leave code is to be updated.
   * @param id The string identifier for the work/leave code to be updated
   * @param field The string value for the field within the code to be update.
   * @param value The string value to update the field with.  These will be converted by
   * the API into their needed data type.
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  updateWorkcode(team: string, id: string, field: string, value: string)
    : Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/workcode`;
    const data: UpdateTeam = {
      team: team,
      optid: id,
      field: field,
      value: value
    };
    return this.http.put<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This method will be used to prepare an API call to remove a work/leave code from the
   * team object.
   * @param team The string identifier for the team the code will be delete from.
   * @param id The string identifier of the work/leave code to delete
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  deleteWorkcode(team: string, id: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/workcode/${team}/${id}`;
    return this.http.delete<Team>(url, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This method will be used to add a new team-company mod period year.
   * @param team the string identifier for the team to be updated.
   * @param company the string identifier for the team-company to be updated.
   * @param year The numeric value for the new mod period
   * @param start The date object for the start of the new mod period.
   * @param end The date object for the end of the new mod period.
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  addModPeriod(team: string, company: string, year: number, start: Date, end: Date)
    : Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company/mod`;
    const data: NewModPeriod = {
      team: team,
      companyid: company,
      year: year,
      start: start,
      end: end
    }
    return this.http.post<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This method is used to update a field in a team-company mod period year.
   * @param team the string identifier for the team to be updated.
   * @param company the string identifier for the team-company to be updated.
   * @param year The numeric value for the new mod period
   * @param field The string field value used to identify which field to update (start or 
   * end dates only)
   * @param value The string value, which will be converted to a date, to update the field 
   * with.
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  updateModPeriod(team: string, company: string, year: number, field: string, 
    value: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company/mod`;
    const data: UpdateTeam = {
      team: team,
      companyid: company,
      optid: `${year}`,
      field: field,
      value: value
    }
    return this.http.put<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This method will be used to call the API to delete a mod period from the team-company's
   * mod period list.
   * @param team the string identifier for the team to be updated.
   * @param company the string identifier for the team-company to be updated.
   * @param year The numeric value for the new mod period
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  deleteModPeriod(team: string, company: string, year: number): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company/mod/${team}/${company}/${year}`;
    return this.http.delete<Team>(url, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This method is used to add a new holiday to a company's holiday list.
   * @param team The string identifier for the team.
   * @param id The string identifier for the company to add to.
   * @param name The string value for the name of the holiday
   * @param holType The string value for the type of holiday, h = holiday, f = float
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  addHoliday(team: string, id: string, name: string, holType: string)
    : Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company/holiday`;
    let type: HolidayType = HolidayType.holiday;
    if (holType.toLowerCase() === 'f') {
      type = HolidayType.floating;
    }
    const data: NewCompanyHoliday = {
      team: team,
      company: id,
      name: name,
      holidayType: type,
      sort: 0
    };
    return this.http.post<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This service method is used to make the call to the API to update a team-company's
   * holiday, by field and with a string value that will be converted to the data type 
   * needed by the application interface
   * @param team The string identifier value for the team to update
   * @param company The string identifier value for the team's company to update
   * @param holid The string value containing the holiday type (h or f), plus the sort 
   * identifier that together form an identifier for the holiday to update
   * @param field The string value that identifies which data member of the holiday to 
   * update.
   * @param value The string value for the change.
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  updateHoliday(team: string, company: string, holid: string, field: string, 
    value: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company/holiday`;
    const data: UpdateTeam = {
      team: team,
      companyid: company,
      optid: holid,
      field: field,
      value: value
    };
    return this.http.put<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This service method will send a remove request for a holiday, based on its holiday 
   * type and sort identifier from the team-company's holiday list.
   * @param team The string identifier value for the team to delete from
   * @param company The string identifier value for the team's company
   * @param holid The string value containing the holiday type (h or f), plus the sort 
   * identifier that together form an identifier for the holiday to delete
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  deleteHoliday(team: string, company: string, holid: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company/holiday/${team}/${company}/${holid}`;
    return this.http.delete<Team>(url, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This service method will be used to initiate/respond to a request for a new company 
   * within a team.  It must contain all the required data for the team.
   * @param team The string identifier for the team to attach the company to.
   * @param id The string identifer for the new company.
   * @param name The string name for the new company.
   * @param ingest The string value for the ingest type (either SAP Timecard Ingest or a 
   * monthly manual excel)
   * @param period The numeric value for the number of days normally in a ingest excel 
   * product.
   * @param start The numeric value for the day of the week (0=Sunday, etc) that the 
   * company's timecard system considers the beginning of the week, for weekly ingests.
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  addCompany(team: string, id: string, name: string, ingest: string, period: number, 
    start: number): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company`;
    const data: NewCompany = {
      team: team,
      id: id,
      name: name,
      ingest: ingest,
      ingestPeriod: period,
      startDay: start
    };
    return this.http.post<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This service method will be used to initiate an update request for a company field, 
   * based on the field value with the value string given
   * @param team The string identifier for the team.
   * @param id The string identifier for the company to update
   * @param field The string to identify which data member/field to update
   * @param value The string value to put in the data member/field.  It will be converted
   * by the API to the correct data type.
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  updateCompany(team: string, id: string, field: string, value: string)
    : Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company`;
    const data: UpdateTeam = {
      team: team,
      companyid: id,
      field: field,
      value: value
    };
    return this.http.put<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  /**
   * This service method will be used to send a delete request to delete a team's company
   * from the team object.
   * @param team The string identifier for the team
   * @param company The string identifier for the company to delete
   * @returns The new team object for storage in a HTTP response object, which is handled
   * by this method.
   */
  deleteCompany(team: string, company: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/company/${team}/${company}`;
    return this.http.delete<Team>(url, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }
}
