import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
    selector: '[appMustMatchValidator]',
    providers: [{
            provide: NG_VALIDATORS,
            useExisting: MustMatchValidator,
            multi: true
        }],
    standalone: false
})
export class MustMatchValidator implements Validator {
  validate(control: AbstractControl) : {[key: string]: any} | null {
    const formGroup = control.parent;
    if (formGroup) {
        const passwd1 = formGroup.get('password');
        const passwd2 = formGroup.get('password2');
        if (passwd1 && passwd2){
            return passwd1.value === passwd2.value 
                ? null : { matching: true };
        }
    }
    return null;
  }

}
