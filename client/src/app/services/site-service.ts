import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { Site } from 'scheduler-node-models/scheduler/sites';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SiteService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;
  site = signal(new Site())

  constructor(
    private http: HttpClient
  ) {
    super();
  }
}
