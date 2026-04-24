import { Component } from '@angular/core';

interface NewSiteData {
  siteid: string;
  name: string;
  offset: number;
  email: string;
  first: string;
  middle: string;
  last: string;
  passwd1: string;
  passwd2: string;
  scheduler: boolean;
}
interface NewSchedulerData {
  email: string;
  first: string;
  middle: string;
  last: string;
  passwd1: string;
  passwd2: string;
}
interface ErrorMessage {
  field: string;
  message: string;
}
@Component({
  selector: 'app-team-editor-site-new',
  imports: [],
  templateUrl: './team-editor-site-new.html',
  styleUrl: './team-editor-site-new.scss',
})
export class TeamEditorSiteNew {}
