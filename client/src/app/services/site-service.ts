import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { MidListItem, ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule'
import { Item } from '../general/list/list.model';
import { NewSite, NewSiteWorkcenter, SiteUpdate, WorkcenterUpdate } from 'scheduler-models/scheduler/sites/web';
import { Team } from 'scheduler-models/scheduler/teams';
import { NewSiteForecast, NewSiteForecastChargeNumber, UpdateSiteForecastChargeNumber } from 'scheduler-models/scheduler/sites/reports';

@Injectable({
  providedIn: 'root',
})
export class SiteService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;
  public selectedEmployee = signal<string>('new');
  public siteEmployeeList = signal<Item[]>([]);
  public showAllEmployees = signal<boolean>(false);
  public selectedSite = signal<Site>(new Site());
  public selectedWorkcenter = signal<string>('new')
  public selectedForecast = signal<string>('new');

  constructor(
    private http: HttpClient
  ) {
    super();
  }

  setSite(iSite: ISite) {
    this.setItem('site', iSite);
  }

  getSite(): Site | undefined {
    const iSite = this.getItem<ISite>('site');
    if (iSite) {
      return new Site(iSite);
    }
    return undefined;
  }

  removeSite() {
    this.removeItem('site');
  }

  getSiteSchedule(userid: string, date: Date)
    : Observable<HttpResponse<ScheduleWorkcenter[]>> {
    const url = `${this.schedulerUrl}/site/schedule/schedule/${userid}/`
      + `${date.getTime()}`;
    return this.http.get<ScheduleWorkcenter[]>(url, { observe: 'response'});
  }

  getSiteMids(userid: string, year: number) : Observable<HttpResponse<MidListItem[]>> {
    const url = `${this.schedulerUrl}/site/schedule/mids/${userid}/${year}`;
    return this.http.get<MidListItem[]>(url, { observe: 'response' });
  }

  setSelectedEmployee(id: string) {
    this.setItem('selectedemployee', id);
  }

  removeSelectedEmployee() {
    this.removeItem('selectedemployee');
  }

  getSelectedEmployee(): string {
    const eid = this.getItem<string>('selectedemployee');
    if (eid) {
      return eid;
    }
    return 'new';
  }

  addSite(team: string, siteid: string, name: string, offset: number, 
    mids: boolean) : Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site`;
    const data: NewSite = {
      teamid: team,
      id: siteid,
      name: name,
      utcoffset: offset,
      showMids: mids
    };
    return this.http.post<Site>(url, data, {observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }

  updateSite(team: string, siteid: string, field: string, value: string)
    : Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site`;
    const data: SiteUpdate = {
      team: team,
      site: siteid,
      field: field,
      value: value,
    };
    return this.http.put<Site>(url, data, {observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }

  deleteSite(team: string, site: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/site/${team}/${site}`;
    return this.http.delete<Team>(url, {observe: 'response'});
  }

  addWorkcenter(team: string, site: string, id: string, name: string) 
    : Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site/workcenter`;
    const data: NewSiteWorkcenter = {
      teamid: team,
      siteid: site,
      id: id,
      name: name
    };
    return this.http.post<Site>(url, data, {observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }

  updateWorkcenter(team: string, site: string, wkctr: string, field: string, 
    value: string, shiftOrPosition?: string, sid?: string) 
    : Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site/workcenter`;
    const data: WorkcenterUpdate = {
      teamid: team,
      siteid: site,
      workcenterid: wkctr,
      field: field,
      value: value,
      shiftPos: shiftOrPosition,
      shiftPosid: sid
    };
    return this.http.put<Site>(url, data, {observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }

  deleteWorkcenter(team: string, site: string, wkctr: string) 
    : Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site/workcenter/${team}/${site}/${wkctr}`;
    return this.http.delete<Site>(url, {observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }

  addForecast(team: string, site: string, name: string, company: string, start: Date, 
    end: Date, period: number, sortFirst: boolean): Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site/forecast`;
    const data: NewSiteForecast = {
      team: team,
      site: site,
      name: name,
      company: company,
      start: start,
      end: end,
      period: period,
      sortFirst: sortFirst
    };
    return this.http.post<Site>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }

  addSiteForecastLaborcode(team: string, site: string, forecast: number, 
    chargeNumber: string, extension: string, minimum: number, vacant: string, 
    hoursPer: number, exercise: boolean, location?: string, clin?: string, slin?: string,
    wbs?: string, start?: Date, end?: Date): Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site/forecast/labor`
    const data: NewSiteForecastChargeNumber = {
      team: team,
      site: site,
      forecast: forecast,
      chargeNumber: chargeNumber,
      extension: extension,
      location: location,
      minimum: minimum,
      vacantName: vacant,
      hoursPerEmployee: hoursPer,
      exercise: exercise,
      clin: clin,
      slin: slin,
      wbs: wbs,
      start: start,
      end: end,
    };
    return this.http.post<Site>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }

  updateForecast(team: string, site: string, forecast: number, chargeNumber: string, 
    extension: string, field: string, value: string): Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site/forecast`
    const data: UpdateSiteForecastChargeNumber = {
      team: team,
      site: site,
      forecast: forecast,
      chargeNumber: chargeNumber,
      extension: extension,
      field: field,
      value: value,
    };
    return this.http.put<Site>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }

  deleteForecast(team: string, site: string, forecast: number)
    : Observable<HttpResponse<Site>> {
    const url = `${this.schedulerUrl}/site/forecast/${team}/${site}/${forecast}`
    return this.http.delete<Site>(url, { observe: 'response'}).pipe(
      map(res => {
        const iSite = (res.body as ISite );
        if (iSite) {
          const site = new Site(iSite);
          const tSite = this.getSite();
          if (tSite && tSite.id === site.id) {
            this.setSite(site);
          }
        }
        return res;
      })
    );
  }
}
