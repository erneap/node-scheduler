import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-wait-dialog',
    imports: [
        MatProgressSpinnerModule
    ],
    templateUrl: './wait-dialog.component.html',
    styleUrls: ['./wait-dialog.component.scss']
})
export class WaitDialogComponent {

}
