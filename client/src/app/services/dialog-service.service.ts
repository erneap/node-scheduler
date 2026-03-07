import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { WaitDialogComponent } from '../generic/wait-dialog/wait-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  waitDialogRef?: MatDialogRef<WaitDialogComponent> = undefined;
  constructor(
    private dialog: MatDialog
  ) { }

  showSpinner() {
    if (this.waitDialogRef) {
      this.waitDialogRef.close();
      this.waitDialogRef = undefined;
    }
    this.waitDialogRef = this.dialog.open(WaitDialogComponent, {
      height: '32px',
      width: '32px',
      panelClass: 'spinner-dialog',
    })
  }

  closeSpinner() {
    if (this.waitDialogRef) {
      this.waitDialogRef.close();
      this.waitDialogRef = undefined;
    }
  }
}
