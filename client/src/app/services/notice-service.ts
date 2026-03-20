import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { INotice, Notice } from 'scheduler-models/general';
import { environment } from '../../environments/environment';
import { IUser, User } from 'scheduler-models/users';

@Injectable({
  providedIn: 'root',
})
export class NoticeService extends CacheService {
  private generalApi = `${environment.generalUrl}`;
  notices = signal<Notice[]>([]);
  interval: any;
  showAlerts = signal<boolean>(false);
  userid = '';

  constructor(
    private http: HttpClient
  ) {
    super();
  }

  startNotices() {
    this.getNotices();
    const minutes = 1;
    if (this.interval && this.interval !== null) {
      clearInterval(this.interval)
    }
    this.interval = setInterval(() => {
      this.getNotices()
    }, minutes * 60000);
  }

  stopNotices() {
    this.notices.set([]);
    this.showAlerts.set(false);
    if (this.interval && this.interval !== null) {
      clearInterval(this.interval);
    }
  }

  getNotices() {
    const iUser = this.getItem<IUser>('user');
    let userid = '';
    if (iUser) {
      const user = new User(iUser);
      userid = user.id;
    }
    const url = `${this.generalApi}/notices/${userid}`;
    this.http.get<INotice[]>(url, {observe: 'response'}).subscribe({
      next: (res) => {
        const iNotes = (res.body as INotice[]);
        const notices: Notice[] = [];
        iNotes.forEach(note => {
          notices.push(new Notice(note));
        });
        this.showAlerts.set(this.notices().length > 0);
        notices.sort((a,b) => a.compareTo(b));
        this.notices.set(notices)
      },
      error: (err) => {
        console.log(err);
      }
    });
  }
}
