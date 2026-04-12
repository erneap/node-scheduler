import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { MidListItem, ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule'
import { Item } from '../general/list/list.model';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters';
import { NewSiteWorkcenter, WorkcenterUpdate } from 'scheduler-models/scheduler/sites/web';

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
}
