import { Component, signal } from '@angular/core';
import { Item } from '../../../../general/list/list.model';

@Component({
  selector: 'app-team-editor-companies-modtime',
  imports: [],
  templateUrl: './team-editor-companies-modtime.html',
  styleUrl: './team-editor-companies-modtime.scss',
})
export class TeamEditorCompaniesModtime {
  list = signal<Item[]>([]);
  
}
