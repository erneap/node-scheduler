import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { INotice, Notice } from 'scheduler-node-models/general';
import { environment } from '../../environments/environment';
import { IUser, User } from 'scheduler-node-models/users';

@Injectable({
  providedIn: 'root',
})
export class NoticeService extends CacheService {
  private generalApi = `${environment.generalUrl}`;
  notices = signal<Notice[]>([]);

  constructor(
    private http: HttpClient
  ) {
    super();
  }

  getNotices(): Observable<HttpResponse<INotice[]>> {
    const iUser = this.getItem<IUser>('user');
    let userid = '';
    if (iUser) {
      const user = new User(iUser);
      userid = user.id;
    }
    const url = `${this.generalApi}/notices/${userid}`;
    return this.http.get<INotice[]>(url, {observe: 'response'}).pipe(
      map(res => {
        const iNotes = (res.body as INotice[]);
        const notices: Notice[] = [];
        iNotes.forEach(note => {
          notices.push(new Notice(note));
        });
        notices.sort((a,b) => a.compareTo(b));
        this.notices.set(notices)
        return res;
      })
    );
  }
}
