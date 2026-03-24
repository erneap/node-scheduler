import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
    selector: '[appPasswordStrengthValidator]',
    providers: [{
            provide: NG_VALIDATORS,
            useExisting: PasswordStrengthValidator,
            multi: true
        }],
    standalone: false
})
export class PasswordStrengthValidator implements Validator {
  validate(control: AbstractControl) : {[key: string]: any} | null {
    const value: string = (control.value && control.value !== null) 
      ? control.value : '';
    if (value === '' || value === null) {
      return null;
    }
    const hasMinimum = (value.length >= 10);
    let upper = 0;
    let lower = 0;
    let numeric = 0;
    let special = 0;
    let upperRE = new RegExp("[A-Z]");
    let lowerRE = new RegExp("[a-z]");
    let numericRE = new RegExp("[0-9]");
    let password = value;
    for (var i=0; i < password.length; i++) {
        let ch = password.substring(i, i+1);
        if (upperRE.test(ch)) {
            upper++;
        } else if (lowerRE.test(ch)) {
            lower++;
        } else if (numericRE.test(ch)) {
            numeric++;
        } else {
            special++;
        }
    }
    var answer = upper > 1 && lower > 1 && numeric > 1 && special > 1 
      && hasMinimum;
    return answer ? null : { passwordStrength: true };
  }
}
