import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpClient } from '@angular/common/http';

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
}
