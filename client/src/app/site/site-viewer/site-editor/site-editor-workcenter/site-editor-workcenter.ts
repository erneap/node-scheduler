import { Component, signal } from '@angular/core';
import { List } from '../../../../general/list/list';
import { Item } from '../../../../general/list/list.model';
import { SiteService } from '../../../../services/site-service';
import { Router, RouterOutlet } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';

interface SiteWorkcenterData {
  id: string;
  name: string;
}

@Component({
  selector: 'app-site-editor-workcenter',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltip,
    MatToolbarModule,
    RouterOutlet
],
  templateUrl: './site-editor-workcenter.html',
  styleUrl: './site-editor-workcenter.scss',
})
export class SiteEditorWorkcenter {
  siteWorkcenterModel = signal<SiteWorkcenterData>({
    id: '',
    name: '',
  });
  wkctrForm = form(this.siteWorkcenterModel, schema => {
    required(schema.id);
    required(schema.name);
  });
  workcenterPos = signal<number>(-1)
  workcentersLength = signal<number>(0);

  constructor(
    public siteService: SiteService,
    private router: Router
  ) {
    this.setWorkcenters();
  }

  setWorkcenters() {
    const wcList: Item[] = [];
    wcList.push({
      id: 'new',
      value: 'Add New Workcenter',
    });
    this.siteService.selectedSite().workcenters.sort((a,b) => a.compareTo(b));
    this.siteService.selectedSite().workcenters.forEach(wc => {
      wcList.push({
        id: wc.id,
        value: wc.name.toUpperCase()
      });
    });
    this.siteService.siteWorkcenterList.set(wcList);
  }

  selectWorkcenter(id: string) {
    this.siteService.selectedWorkcenter.set(id);
    if (id !== 'new') {
      this.workcentersLength.set(this.siteService.selectedSite().workcenters.length);
      this.siteService.selectedSite().workcenters.forEach((wc, w) => {
        if (wc.id === id) {
          this.wkctrForm.id().value.set(wc.id);
          this.wkctrForm.name().value.set(wc.name);
          this.workcenterPos.set(w);
          if (wc.positions && wc.positions.length > 0) {
            this.router.navigate(['/site/edit/edit/workcenter/positions'])
          } else {
            this.router.navigate(['/site/edit/edit/workcenter/shifts'])
          }
        }
      });
    } else {
      this.wkctrForm.id().value.set('');
      this.wkctrForm.name().value.set('');
      this.workcenterPos.set(-1);
    }
  }
}
