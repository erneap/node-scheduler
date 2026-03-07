import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { ISite, Site } from 'scheduler-node-models/scheduler/sites';

@Injectable({
  providedIn: 'root',
})
export class SiteService extends CacheService {
  constructor() {
    super();
  }

  getSite(): Site| undefined {
    const iSite = this.getItem<ISite>('current-site');
    if (iSite) {
      return new Site(iSite);
    }
    return undefined;
  }

  clearSite(): void {
    this.removeItem('current-site');
  }

  setSite(isite: ISite): void {
    const site = new Site(isite);
    this.setItem('current-site', site);
  }
}
