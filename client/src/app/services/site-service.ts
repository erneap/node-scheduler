import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule'

@Injectable({
  providedIn: 'root',
})
export class SiteService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;

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
}
