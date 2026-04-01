import { Component, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { IMidListItem, MidListItem } from 'scheduler-models/scheduler/sites/schedule';
import { AuthService } from '../../../services/auth-service';
import { SiteService } from '../../../services/site-service';
import { User } from 'scheduler-models/users';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-site-mids-listing',
  imports: [
    MatCardModule
  ],
  templateUrl: './site-mids-listing.html',
  styleUrl: './site-mids-listing.scss',
})
export class SiteMidsListing {
  list = signal<MidListItem[]>([]);
  year = signal<number>(0);
  userid = signal<string>('');

  constructor(
    private authService: AuthService,
    private siteService: SiteService
  ) {
    const iUser = this.authService.getUser();
    if (iUser) {
      const user = new User(iUser);
      this.userid.set(user.id);
    }
    const now = new Date();
    this.year.set(now.getUTCFullYear());
    this.setYear();
  }

  setYear() {
    if (this.userid() !== '') {
      this.siteService.getSiteMids(this.userid(), this.year()).subscribe({
        next: (res) => {
          const list = res.body as IMidListItem[];
          if (list.length > 0) {
            const answer: MidListItem[] = [];
            list.forEach(item => {
              answer.push(new MidListItem(item));
            });
            answer.sort((a,b) => a.compareTo(b));
            this.list.set(answer);
          }
        },
        error: (err) => {
          console.log(err);
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      })
    }
  }

  updateYear(direction: string) {
    if (direction.toLowerCase().substring(0,1) === 'u') {
      this.year.set(this.year() + 1);
    } else {
      this.year.set(this.year() - 1);
    }
    this.setYear();
  }

  dateString(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-US',
      { year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      }
    );
    return formatter.format(date);
  }
}
