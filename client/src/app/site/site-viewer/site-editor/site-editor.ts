import { Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { SiteService } from '../../../services/site-service';
import { MatButtonModule } from '@angular/material/button';

interface SiteData {
  name: string;
  offset: number;
}

@Component({
  selector: 'app-site-editor',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatButtonModule,
    RouterOutlet
  ],
  templateUrl: './site-editor.html',
  styleUrl: './site-editor.scss',
})
export class SiteEditor {
  siteEditModel = signal<SiteData>({
    name: '',
    offset: 0,
  });

  siteEditForm = form(this.siteEditModel, schema => {
    required(schema.name);
    required(schema.offset);
  })

  constructor(
    private siteService: SiteService,
    private router: Router
  ) {
    this.siteEditForm.name().value.set(this.siteService.selectedSite().name);
    this.siteEditForm.offset().value.set(this.siteService.selectedSite().utcOffset);
  }

  editorStyle(): string {
    const width = window.innerWidth - 100;
    return `width: ${width}px;`;
  }
}
