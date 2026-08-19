import { FormGroup } from "@angular/forms";

export class UtilService {
  public static indexname = 0;


  public static getControlName() {
    this.indexname++;
    return `name-${new Date().getTime()}${new Date().getMilliseconds()}-${this.indexname}`;
  }

  public static updateControlValitor(groupForm: FormGroup, controlName: any) {
    setTimeout(() =>{
      if(groupForm && groupForm.get(controlName)) {
        groupForm.controls[controlName].updateValueAndValidity();
      }
    });
  }

}


