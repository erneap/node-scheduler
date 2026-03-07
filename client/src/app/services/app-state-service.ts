import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  public viewHeight: number;
  public viewWidth: number;

  constructor() {
    this.viewHeight = window.innerHeight - 82;
    this.viewWidth = window.innerWidth;
  }
}
