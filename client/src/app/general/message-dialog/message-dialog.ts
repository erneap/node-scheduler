import { Component, inject, model } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '../confirmation-dialog/confirmation-dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-message-dialog',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './message-dialog.html',
  styleUrl: './message-dialog.scss',
})
export class MessageDialog {
  readonly dialogRef = inject(MatDialogRef<MessageDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly answer = model<string>('');

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
