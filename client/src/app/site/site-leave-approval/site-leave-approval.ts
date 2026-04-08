import { Component, signal } from '@angular/core';
import { SiteService } from '../../services/site-service';
import { SiteLeaveApprovalViewer } from './site-leave-approval-viewer/site-leave-approval-viewer';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-site-leave-approval',
  imports: [
    MatCardModule,
    SiteLeaveApprovalViewer
  ],
  templateUrl: './site-leave-approval.html',
  styleUrl: './site-leave-approval.scss',
})
export class SiteLeaveApproval {
  site = signal<string>('');

  constructor(
    private siteService: SiteService
  ) {
    if (this.site() === '') {
      const iSite = this.siteService.getSite();
      if (iSite) {
        this.site.set(iSite.id);
      }
    }
  }
}
