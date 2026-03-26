import { Component, inject, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
  title: string;
  message: string;
  negativeButtonTitle?: string;
  affirmativeButtonTitle?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss',
})
export class ConfirmationDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmationDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  answer = model<string>('no');

  getNoButtonTitle(): string {
    if (this.data.negativeButtonTitle && this.data.negativeButtonTitle !== '') {
      return this.data.negativeButtonTitle;
    }
    return 'Cancel';
  }

  getYesButtonTitle(): string {
    if (this.data.affirmativeButtonTitle && this.data.affirmativeButtonTitle !== '') {
      return this.data.affirmativeButtonTitle;
    }
    return 'Ok';
  }
}
