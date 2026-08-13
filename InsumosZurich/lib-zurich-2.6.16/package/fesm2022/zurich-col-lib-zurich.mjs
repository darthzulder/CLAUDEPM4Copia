import * as i0 from '@angular/core';
import { Attribute, Directive, EventEmitter, Input, Output, Component, ContentChildren, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, Pipe, PLATFORM_ID, Inject, Injectable, ChangeDetectionStrategy, TemplateRef } from '@angular/core';
import { ZaTextInput, ZaButton, ZaAccordion, ZaAvatar, ZaTimeInput, ZaDateInput, ZaPasswordInput, ZaSelect, ZaMultiselect, ZaNavigation, ZaCheckbox, ZaTag, ZaTable, ZaPagination, ZaCard, ZaIcon, ZaAlert, ZaStage, ZaPictogram, ZaTabs, ZaTextarea, ZaTooltip, ZaLoader, ZaTile, ZaShape } from '@zurich/angular-components';
import * as i1 from '@angular/forms';
import { FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as i1$1 from '@angular/common';
import { CommonModule, isPlatformBrowser, DatePipe, CurrencyPipe, UpperCasePipe, NgTemplateOutlet } from '@angular/common';
import { BehaviorSubject, Subscription } from 'rxjs';

class ZTemplate {
    template;
    id;
    constructor(template, id) {
        this.template = template;
        this.id = id;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: ZTemplate, deps: [{ token: i0.TemplateRef }, { token: 'id', attribute: true }], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "21.2.14", type: ZTemplate, isStandalone: true, selector: "ng-template[libZTemplate]", ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: ZTemplate, decorators: [{
            type: Directive,
            args: [{
                    selector: 'ng-template[libZTemplate]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }, { type: undefined, decorators: [{
                    type: Attribute,
                    args: ['id']
                }] }] });

class UtilService {
    static indexname = 0;
    static getControlName() {
        this.indexname++;
        return `name-${new Date().getTime()}${new Date().getMilliseconds()}-${this.indexname}`;
    }
    static updateControlValitor(groupForm, controlName) {
        setTimeout(() => {
            if (groupForm && groupForm.get(controlName)) {
                groupForm.controls[controlName].updateValueAndValidity();
            }
        });
    }
}

class InputTextZ {
    fb;
    label = '';
    icon;
    inputType = 'text';
    lineType = false;
    name = '';
    model;
    modelChange = new EventEmitter();
    group = new FormGroup({});
    helpText = '';
    valid = false;
    validChange = new EventEmitter();
    required = false;
    readonly = false;
    maxLength = false;
    maxNumber = 0;
    manualValidation = false;
    constructor(fb) {
        this.fb = fb;
    }
    ngOnInit() {
        this.generateGroup();
        this.generateControl();
    }
    generateGroup() {
        if (!this.group) {
            this.group = this.fb.group({});
        }
    }
    ngOnChanges(changes) {
        if (changes.model) {
            setTimeout(() => {
                this.updateControl();
            });
        }
        if (!this.manualValidation && this.group.status == 'INVALID') {
            this.valid = true;
            this.validChange.emit(this.valid);
        }
    }
    generateControl() {
        if (this.group) {
            if (!this.group.get(this.name)) {
                this.name = UtilService.getControlName();
                this.group.addControl(this.name, this.fb.control({}));
            }
            this.group
                .get(this.name)
                ?.setValidators(Validators.compose([
                this.group.get(this.name)?.validator,
                () => this.generateValidation(),
            ]));
            UtilService.updateControlValitor(this.group, this.name);
        }
    }
    generateValidation() {
        if (this.validateRequired()) {
            return { errorRequired: true };
        }
        return null;
    }
    validateRequired() {
        return this.required && !String(this.model || '').trim();
    }
    // validateLenght(): boolean{
    //   return this.maxLength &&
    // }
    updateControl() {
        if (this.group && this.group.get(this.name)) {
            this.group.get(this.name)?.setValue(this.model);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputTextZ, deps: [{ token: i1.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: InputTextZ, isStandalone: true, selector: "lib-input-text-z", inputs: { label: "label", icon: "icon", inputType: "inputType", lineType: "lineType", name: "name", model: "model", group: "group", helpText: "helpText", valid: "valid", required: "required", readonly: "readonly", maxLength: "maxLength", maxNumber: "maxNumber", manualValidation: "manualValidation" }, outputs: { modelChange: "modelChange", validChange: "validChange" }, usesOnChanges: true, ngImport: i0, template: "<za-text-input\r\n  [id]=\"name\"\r\n  [name]=\"name\"\r\n  label=\"{{label}}\"\r\n  [config]=\"lineType? 'line': ''\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [input-type]=\"inputType == 'text'? 'text': inputType == 'tel'? 'tel': inputType == 'email'? 'email': inputType == 'url'? 'url': 'text'\"\r\n  help-text=\"{{helpText}}\"\r\n  [invalid]=\"valid\"\r\n  [required]=\"required\"\r\n  [readonly]=\"readonly\"\r\n  [icon]=\"icon\"\r\n></za-text-input>\r\n", styles: [""], dependencies: [{ kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "ngmodule", type: ReactiveFormsModule }, { kind: "component", type: ZaTextInput, selector: "za-text-input", inputs: ["input-type", "max-length", "data-list", "align-right", "placeholder", "pattern", "icon", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputTextZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-input-text-z', standalone: true, imports: [FormsModule, ReactiveFormsModule, ZaTextInput], template: "<za-text-input\r\n  [id]=\"name\"\r\n  [name]=\"name\"\r\n  label=\"{{label}}\"\r\n  [config]=\"lineType? 'line': ''\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [input-type]=\"inputType == 'text'? 'text': inputType == 'tel'? 'tel': inputType == 'email'? 'email': inputType == 'url'? 'url': 'text'\"\r\n  help-text=\"{{helpText}}\"\r\n  [invalid]=\"valid\"\r\n  [required]=\"required\"\r\n  [readonly]=\"readonly\"\r\n  [icon]=\"icon\"\r\n></za-text-input>\r\n" }]
        }], ctorParameters: () => [{ type: i1.FormBuilder }], propDecorators: { label: [{
                type: Input
            }], icon: [{
                type: Input
            }], inputType: [{
                type: Input
            }], lineType: [{
                type: Input
            }], name: [{
                type: Input
            }], model: [{
                type: Input
            }], modelChange: [{
                type: Output
            }], group: [{
                type: Input
            }], helpText: [{
                type: Input
            }], valid: [{
                type: Input
            }], validChange: [{
                type: Output
            }], required: [{
                type: Input
            }], readonly: [{
                type: Input
            }], maxLength: [{
                type: Input
            }], maxNumber: [{
                type: Input
            }], manualValidation: [{
                type: Input
            }] } });

class ButtonZ {
    label = '';
    type = 'primary';
    icon;
    iconRight = false;
    disabled = true;
    wide = false;
    loading = false;
    custom_str = '';
    eventClick = new EventEmitter();
    constructor() { }
    ngOnInit() { }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: ButtonZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: ButtonZ, isStandalone: true, selector: "lib-button-z", inputs: { label: "label", type: "type", icon: "icon", iconRight: "iconRight", disabled: "disabled", wide: "wide", loading: "loading", custom_str: "custom_str" }, outputs: { eventClick: "eventClick" }, ngImport: i0, template: "<za-button\r\n  [icon-right]=\"iconRight\"\r\n  [config]=\"type\"\r\n  [icon]=\"icon\"\r\n  [disabled]=\"disabled\"\r\n  (click)=\"eventClick.emit($event)\"\r\n  [wide]=\"wide\"\r\n  [loading]=\"loading\"\r\n  [custom-str]=\"custom_str\"\r\n>\r\n  {{label}}\r\n</za-button>\r\n", styles: [""], dependencies: [{ kind: "component", type: ZaButton, selector: "za-button", inputs: ["config", "icon", "icon-right", "disabled", "loading", "wide", "custom", "target", "href"], outputs: ["click"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: ButtonZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-button-z', standalone: true, imports: [ZaButton], template: "<za-button\r\n  [icon-right]=\"iconRight\"\r\n  [config]=\"type\"\r\n  [icon]=\"icon\"\r\n  [disabled]=\"disabled\"\r\n  (click)=\"eventClick.emit($event)\"\r\n  [wide]=\"wide\"\r\n  [loading]=\"loading\"\r\n  [custom-str]=\"custom_str\"\r\n>\r\n  {{label}}\r\n</za-button>\r\n" }]
        }], ctorParameters: () => [], propDecorators: { label: [{
                type: Input
            }], type: [{
                type: Input
            }], icon: [{
                type: Input
            }], iconRight: [{
                type: Input
            }], disabled: [{
                type: Input
            }], wide: [{
                type: Input
            }], loading: [{
                type: Input
            }], custom_str: [{
                type: Input
            }], eventClick: [{
                type: Output
            }] } });

class AccordionZ {
    titleLabel = '';
    titleInput = false;
    readonlyInput = true;
    modelInput;
    modelInputChange = new EventEmitter();
    groupInput = new FormGroup({});
    validInput = false;
    summaryMargin = '2';
    label = 'Ingrese un valor';
    template;
    content;
    constructor() { }
    ngAfterContentInit() {
        this.content = this.template.first.template;
    }
    changeRead() {
        if (this.readonlyInput) {
            this.readonlyInput = false;
        }
        else {
            this.readonlyInput = true;
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AccordionZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: AccordionZ, isStandalone: true, selector: "lib-accordion-z", inputs: { titleLabel: "titleLabel", titleInput: "titleInput", readonlyInput: "readonlyInput", modelInput: "modelInput", groupInput: "groupInput", validInput: "validInput", summaryMargin: "summaryMargin", label: "label" }, outputs: { modelInputChange: "modelInputChange" }, queries: [{ propertyName: "template", predicate: ZTemplate }], ngImport: i0, template: "<za-accordion custom-str=\"outline:0px;summary-margin:{{summaryMargin}}rem\">\r\n  <div slot=\"summary\">\r\n    @if(titleInput) {\r\n    <div class=\"grid\">\r\n      <div class=\"col-6\">\r\n        <lib-input-text-z\r\n          label=\"{{modelInput == '' || modelInput == undefined ? label: ''}}\"\r\n          [lineType]=\"true\"\r\n          [readonly]=\"readonlyInput\"\r\n          [(model)]=\"modelInput\"\r\n          [group]=\"groupInput\"\r\n          (modelChange)=\"modelInputChange.emit(modelInput)\"\r\n          [manualValidation]=\"true\"\r\n          [valid]=\"validInput\"\r\n        ></lib-input-text-z>\r\n      </div>\r\n      <div class=\"col-6\">\r\n        <lib-button-z\r\n          [type]=\"'link'\"\r\n          [icon]=\"'edit:line'\"\r\n          [disabled]=\"false\"\r\n          (eventClick)=\"changeRead()\"\r\n        ></lib-button-z>\r\n      </div>\r\n    </div>\r\n\r\n    } @else { {{titleLabel}} }\r\n  </div>\r\n  <div class=\"grid\">\r\n    <div class=\"col-12\">\r\n      <ng-template [ngTemplateOutlet]=\"content\"></ng-template>\r\n    </div>\r\n  </div>\r\n</za-accordion>\r\n", styles: [""], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1$1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: ZaAccordion, selector: "za-accordion", inputs: ["open", "content", "summary", "config", "borderless", "custom"] }, { kind: "ngmodule", type: FormsModule }, { kind: "ngmodule", type: ReactiveFormsModule }, { kind: "component", type: InputTextZ, selector: "lib-input-text-z", inputs: ["label", "icon", "inputType", "lineType", "name", "model", "group", "helpText", "valid", "required", "readonly", "maxLength", "maxNumber", "manualValidation"], outputs: ["modelChange", "validChange"] }, { kind: "component", type: ButtonZ, selector: "lib-button-z", inputs: ["label", "type", "icon", "iconRight", "disabled", "wide", "loading", "custom_str"], outputs: ["eventClick"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AccordionZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-accordion-z', imports: [
                        CommonModule,
                        ZaAccordion,
                        FormsModule,
                        ReactiveFormsModule,
                        InputTextZ,
                        ButtonZ,
                    ], schemas: [CUSTOM_ELEMENTS_SCHEMA], template: "<za-accordion custom-str=\"outline:0px;summary-margin:{{summaryMargin}}rem\">\r\n  <div slot=\"summary\">\r\n    @if(titleInput) {\r\n    <div class=\"grid\">\r\n      <div class=\"col-6\">\r\n        <lib-input-text-z\r\n          label=\"{{modelInput == '' || modelInput == undefined ? label: ''}}\"\r\n          [lineType]=\"true\"\r\n          [readonly]=\"readonlyInput\"\r\n          [(model)]=\"modelInput\"\r\n          [group]=\"groupInput\"\r\n          (modelChange)=\"modelInputChange.emit(modelInput)\"\r\n          [manualValidation]=\"true\"\r\n          [valid]=\"validInput\"\r\n        ></lib-input-text-z>\r\n      </div>\r\n      <div class=\"col-6\">\r\n        <lib-button-z\r\n          [type]=\"'link'\"\r\n          [icon]=\"'edit:line'\"\r\n          [disabled]=\"false\"\r\n          (eventClick)=\"changeRead()\"\r\n        ></lib-button-z>\r\n      </div>\r\n    </div>\r\n\r\n    } @else { {{titleLabel}} }\r\n  </div>\r\n  <div class=\"grid\">\r\n    <div class=\"col-12\">\r\n      <ng-template [ngTemplateOutlet]=\"content\"></ng-template>\r\n    </div>\r\n  </div>\r\n</za-accordion>\r\n" }]
        }], ctorParameters: () => [], propDecorators: { titleLabel: [{
                type: Input
            }], titleInput: [{
                type: Input
            }], readonlyInput: [{
                type: Input
            }], modelInput: [{
                type: Input
            }], modelInputChange: [{
                type: Output
            }], groupInput: [{
                type: Input
            }], validInput: [{
                type: Input
            }], summaryMargin: [{
                type: Input
            }], label: [{
                type: Input
            }], template: [{
                type: ContentChildren,
                args: [ZTemplate]
            }] } });

class AvatarZ {
    name = '';
    content = '';
    /**
     * @param {status} status - identifica si el avatar cambia de estado de conectado, valores permitidos [absent, occupied, online, offline]
     */
    status = 'offline';
    /**
     * @param {config} config - Permite configurar el componente para identificar la orientación}
     * del nombre.
     */
    config = 'horizontal';
    img = '';
    initials = '';
    constructor() { }
    ngOnInit() {
        let arrayName = this.name.split(' ');
        this.initials = arrayName[0][0].concat(arrayName[1][0]);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AvatarZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: AvatarZ, isStandalone: true, selector: "lib-avatar-z", inputs: { name: "name", content: "content", status: "status", config: "config", img: "img" }, ngImport: i0, template: "@if (this.img != '') {\r\n<div class=\"grid\">\r\n  <div class=\"col-12\">\r\n    <za-avatar\r\n      [config]=\"this.config\"\r\n      [content]=\"this.content\"\r\n      [image-src]=\"this.img\"\r\n      [name]=\"this.name\"\r\n      [status]=\"this.status\"\r\n    ></za-avatar>\r\n  </div>\r\n</div>\r\n} @else {\r\n<div class=\"grid\">\r\n  <div class=\"col-12\">\r\n    <za-avatar\r\n      [config]=\"this.config\"\r\n      [content]=\"this.content\"\r\n      [initials]=\"this.initials\"\r\n      [name]=\"this.name\"\r\n      [status]=\"this.status\"\r\n    ></za-avatar>\r\n  </div>\r\n</div>\r\n}\r\n", styles: [""], dependencies: [{ kind: "component", type: ZaAvatar, selector: "za-avatar", inputs: ["name", "content", "config", "initials", "status", "badge", "profile-config", "dropdown-elements", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AvatarZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-avatar-z', imports: [ZaAvatar], template: "@if (this.img != '') {\r\n<div class=\"grid\">\r\n  <div class=\"col-12\">\r\n    <za-avatar\r\n      [config]=\"this.config\"\r\n      [content]=\"this.content\"\r\n      [image-src]=\"this.img\"\r\n      [name]=\"this.name\"\r\n      [status]=\"this.status\"\r\n    ></za-avatar>\r\n  </div>\r\n</div>\r\n} @else {\r\n<div class=\"grid\">\r\n  <div class=\"col-12\">\r\n    <za-avatar\r\n      [config]=\"this.config\"\r\n      [content]=\"this.content\"\r\n      [initials]=\"this.initials\"\r\n      [name]=\"this.name\"\r\n      [status]=\"this.status\"\r\n    ></za-avatar>\r\n  </div>\r\n</div>\r\n}\r\n" }]
        }], ctorParameters: () => [], propDecorators: { name: [{
                type: Input
            }], content: [{
                type: Input
            }], status: [{
                type: Input
            }], config: [{
                type: Input
            }], img: [{
                type: Input
            }] } });

class InputTimeZ {
    fb;
    timeInputRef;
    label = '';
    name = '';
    model;
    modelChange = new EventEmitter();
    group = new FormGroup({});
    required = false;
    valid = false;
    validChange = new EventEmitter();
    disabled = false;
    helpText = 'Ingrese un valor';
    typeInput = '';
    readonly = false;
    range = ['00:00', '23:00'];
    manualValidation = false;
    constructor(fb) {
        this.fb = fb;
    }
    ngAfterViewInit() {
        setTimeout(() => {
            this.updateReadOnly();
        });
    }
    ngOnInit() {
        this.generateGroup();
        this.generateControl();
    }
    generateGroup() {
        if (!this.group) {
            this.group = this.fb.group({});
        }
    }
    ngOnChanges(changes) {
        if (changes['readonly']) {
            setTimeout(() => {
                this.updateReadOnly();
            });
        }
        if (changes['model']) {
            setTimeout(() => {
                this.updateControl();
            });
        }
        if (!this.manualValidation && this.group.status == 'INVALID') {
            this.valid = true;
            this.validChange.emit(this.valid);
        }
    }
    updateReadOnly() {
        if (this.timeInputRef?.nativeElement) {
            const el = this.timeInputRef.nativeElement;
            // Aplicar al wrapper za-time-input
            el.readonly = this.readonly;
            // Aplicar directamente al z-time-input interno
            setTimeout(() => {
                const zTimeInput = el.querySelector('z-time-input');
                if (zTimeInput) {
                    if (this.readonly) {
                        zTimeInput.setAttribute('readonly', '');
                    }
                    else {
                        zTimeInput.removeAttribute('readonly');
                    }
                    zTimeInput.readonly = this.readonly;
                }
            }, 1);
        }
    }
    generateControl() {
        if (this.group) {
            if (!this.group.get(this.name)) {
                this.name = UtilService.getControlName();
                this.group.addControl(this.name, this.fb.control({}));
            }
            this.group
                .get(this.name)
                ?.setValidators(Validators.compose([
                this.group.get(this.name)?.validator,
                () => this.generateValidation(),
            ]));
            UtilService.updateControlValitor(this.group, this.name);
        }
    }
    generateValidation() {
        if (this.validateRequired()) {
            return { errorRequired: true };
        }
        return null;
    }
    validateRequired() {
        return this.required && !String(this.model || '').trim();
    }
    // validateLenght(): boolean{
    //   return this.maxLength &&
    // }
    updateControl() {
        this.group?.get(this.name)?.setValue(this.model);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputTimeZ, deps: [{ token: i1.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: InputTimeZ, isStandalone: true, selector: "lib-input-time-z", inputs: { label: "label", name: "name", model: "model", group: "group", required: "required", valid: "valid", disabled: "disabled", helpText: "helpText", typeInput: "typeInput", readonly: "readonly", range: "range", manualValidation: "manualValidation" }, outputs: { modelChange: "modelChange", validChange: "validChange" }, viewQueries: [{ propertyName: "timeInputRef", first: true, predicate: ["timeInput"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<za-time-input\r\n  #timeInput\r\n  name=\"{{name}}\"\r\n  [config]=\"typeInput\"\r\n  label=\"{{label}}\"\r\n  help-text=\"{{helpText}}\"\r\n  locale=\"es\"\r\n  model=\"00:05\"\r\n  [required]=\"required\"\r\n  [invalid]=\"valid\"\r\n  [disabled]=\"disabled\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [readonly]=\"readonly\"\r\n  [range]=\"range\"\r\n/>\r\n", styles: [""], dependencies: [{ kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "ngmodule", type: ReactiveFormsModule }, { kind: "component", type: ZaTimeInput, selector: "za-time-input", inputs: ["range", "min", "max", "placeholder", "step", "with-seconds", "custom-ui", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputTimeZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-input-time-z', imports: [FormsModule, ReactiveFormsModule, ZaTimeInput], template: "<za-time-input\r\n  #timeInput\r\n  name=\"{{name}}\"\r\n  [config]=\"typeInput\"\r\n  label=\"{{label}}\"\r\n  help-text=\"{{helpText}}\"\r\n  locale=\"es\"\r\n  model=\"00:05\"\r\n  [required]=\"required\"\r\n  [invalid]=\"valid\"\r\n  [disabled]=\"disabled\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [readonly]=\"readonly\"\r\n  [range]=\"range\"\r\n/>\r\n" }]
        }], ctorParameters: () => [{ type: i1.FormBuilder }], propDecorators: { timeInputRef: [{
                type: ViewChild,
                args: ['timeInput', { read: ElementRef }]
            }], label: [{
                type: Input
            }], name: [{
                type: Input
            }], model: [{
                type: Input
            }], modelChange: [{
                type: Output
            }], group: [{
                type: Input
            }], required: [{
                type: Input
            }], valid: [{
                type: Input
            }], validChange: [{
                type: Output
            }], disabled: [{
                type: Input
            }], helpText: [{
                type: Input
            }], typeInput: [{
                type: Input
            }], readonly: [{
                type: Input
            }], range: [{
                type: Input
            }], manualValidation: [{
                type: Input
            }] } });

class InputDateZ {
    fb;
    dateInputRef;
    label = '';
    inputType = 'date';
    name = '';
    model;
    lineType;
    modelChange = new EventEmitter();
    group = new FormGroup({});
    valid = false;
    validChange = new EventEmitter();
    disabled = false;
    readonly = false;
    max = '';
    min = '';
    required = false;
    manualValidation = false;
    constructor(fb) {
        this.fb = fb;
    }
    ngAfterViewInit() {
        this.updateInvalidState();
    }
    ngOnInit() {
        this.generateGroup();
        this.generateControl();
    }
    generateGroup() {
        if (!this.group) {
            this.group = this.fb.group({});
        }
    }
    ngOnChanges(changes) {
        if (changes['valid']) {
            this.updateInvalidState();
        }
        if (changes['model']) {
            setTimeout(() => {
                this.updateControl();
            });
        }
        if (!this.manualValidation && this.group.status == 'INVALID') {
            this.valid = true;
            this.validChange.emit(this.valid);
            this.updateInvalidState();
        }
    }
    updateInvalidState() {
        if (this.dateInputRef?.nativeElement) {
            this.dateInputRef.nativeElement.invalid = this.valid;
        }
    }
    generateControl() {
        if (this.group) {
            if (!this.group.get(this.name)) {
                this.name = UtilService.getControlName();
                this.group.addControl(this.name, this.fb.control({}));
            }
            this.group
                .get(this.name)
                ?.setValidators(Validators.compose([
                this.group.get(this.name)?.validator,
                () => this.generateValidation(),
            ]));
            UtilService.updateControlValitor(this.group, this.name);
        }
    }
    generateValidation() {
        if (this.validateRequired()) {
            return { errorRequired: true };
        }
        return null;
    }
    validateRequired() {
        return this.required && !String(this.model || '').trim();
    }
    // validateLenght(): boolean{
    //   return this.maxLength &&
    // }
    updateControl() {
        if (this.group && this.group.get(this.name)) {
            this.group.get(this.name)?.setValue(this.model);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputDateZ, deps: [{ token: i1.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: InputDateZ, isStandalone: true, selector: "lib-input-date-z", inputs: { label: "label", inputType: "inputType", name: "name", model: "model", lineType: "lineType", group: "group", valid: "valid", disabled: "disabled", readonly: "readonly", max: "max", min: "min", required: "required", manualValidation: "manualValidation" }, outputs: { modelChange: "modelChange", validChange: "validChange" }, viewQueries: [{ propertyName: "dateInputRef", first: true, predicate: ["dateInput"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<za-date-input\r\n  #dateInput\r\n  [config]=\"lineType\"\r\n  label=\"{{label}}\"\r\n  [input-type]=\"\r\n    inputType == 'date'?\r\n    'date': inputType == 'month'?\r\n    'month': inputType == 'datetime-local'?\r\n    'datetime-local': inputType == 'week'?\r\n    'week': 'date'\"\r\n  [max]=\"max\"\r\n  [min]=\"min\"\r\n  [required]=\"required\"\r\n  [readonly]=\"readonly\"\r\n  [invalid]=\"valid\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [custom-ui]=\"false\"\r\n  [today-nav]=\"true\"\r\n  name=\"{{name}}\"\r\n/>\r\n", styles: [""], dependencies: [{ kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "ngmodule", type: ReactiveFormsModule }, { kind: "component", type: ZaDateInput, selector: "za-date-input", inputs: ["range", "min", "max", "placeholder", "input-type", "custom-ui", "today-nav", "selected-nav", "calendar-type", "first-weekday", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputDateZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-input-date-z', standalone: true, imports: [FormsModule, ReactiveFormsModule, ZaDateInput], schemas: [CUSTOM_ELEMENTS_SCHEMA], template: "<za-date-input\r\n  #dateInput\r\n  [config]=\"lineType\"\r\n  label=\"{{label}}\"\r\n  [input-type]=\"\r\n    inputType == 'date'?\r\n    'date': inputType == 'month'?\r\n    'month': inputType == 'datetime-local'?\r\n    'datetime-local': inputType == 'week'?\r\n    'week': 'date'\"\r\n  [max]=\"max\"\r\n  [min]=\"min\"\r\n  [required]=\"required\"\r\n  [readonly]=\"readonly\"\r\n  [invalid]=\"valid\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [custom-ui]=\"false\"\r\n  [today-nav]=\"true\"\r\n  name=\"{{name}}\"\r\n/>\r\n" }]
        }], ctorParameters: () => [{ type: i1.FormBuilder }], propDecorators: { dateInputRef: [{
                type: ViewChild,
                args: ['dateInput', { read: ElementRef }]
            }], label: [{
                type: Input
            }], inputType: [{
                type: Input
            }], name: [{
                type: Input
            }], model: [{
                type: Input
            }], lineType: [{
                type: Input
            }], modelChange: [{
                type: Output
            }], group: [{
                type: Input
            }], valid: [{
                type: Input
            }], validChange: [{
                type: Output
            }], disabled: [{
                type: Input
            }], readonly: [{
                type: Input
            }], max: [{
                type: Input
            }], min: [{
                type: Input
            }], required: [{
                type: Input
            }], manualValidation: [{
                type: Input
            }] } });

class InputPasswordZ {
    fb;
    name = '';
    model;
    modelChange = new EventEmitter();
    label = '';
    lineType = false;
    helpText = '';
    invalid = false;
    invalidChange = new EventEmitter();
    required = false;
    disabled = false;
    readonly = false;
    group = new FormGroup({});
    constructor(fb) {
        this.fb = fb;
    }
    ngOnInit() {
        this.generateGroup();
        this.generateControl();
    }
    generateGroup() {
        if (!this.group) {
            this.group = this.fb.group({});
        }
    }
    ngOnChanges(changes) {
        if (changes.model) {
            setTimeout(() => {
                this.updateControl();
            });
        }
        if (this.group.status == 'INVALID') {
            this.invalid = true;
            this.invalidChange.emit(this.invalid);
        }
    }
    generateControl() {
        if (this.group) {
            if (!this.group.get(this.name)) {
                this.name = UtilService.getControlName();
                this.group.addControl(this.name, this.fb.control({}));
            }
            this.group
                .get(this.name)
                ?.setValidators(Validators.compose([
                this.group.get(this.name)?.validator,
                () => this.generateValidation(),
            ]));
            UtilService.updateControlValitor(this.group, this.name);
        }
    }
    generateValidation() {
        if (this.validateRequired()) {
            return { errorRequired: true };
        }
        return null;
    }
    validateRequired() {
        return this.required && !String(this.model || '').trim();
    }
    updateControl() {
        if (this.group && this.group.get(this.name)) {
            this.group.get(this.name)?.setValue(this.model);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputPasswordZ, deps: [{ token: i1.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: InputPasswordZ, isStandalone: true, selector: "lib-input-password-z", inputs: { name: "name", model: "model", label: "label", lineType: "lineType", helpText: "helpText", invalid: "invalid", required: "required", disabled: "disabled", readonly: "readonly", group: "group" }, outputs: { modelChange: "modelChange", invalidChange: "invalidChange" }, usesOnChanges: true, ngImport: i0, template: "<za-password-input\r\n  label=\"{{label}}\"\r\n  [config]=\"lineType? 'line': ''\"\r\n  [required]=\"required\"\r\n  [readonly]=\"readonly\"\r\n  [disabled]=\"disabled\"\r\n  [invalid]=\"invalid\"\r\n  help-text=\"{{helpText}}\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [id]=\"name\"\r\n  [name]=\"name\"\r\n/>\r\n", styles: [""], dependencies: [{ kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "ngmodule", type: ReactiveFormsModule }, { kind: "component", type: ZaPasswordInput, selector: "za-password-input", inputs: ["custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputPasswordZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-input-password-z', standalone: true, imports: [FormsModule, ReactiveFormsModule, ZaPasswordInput], template: "<za-password-input\r\n  label=\"{{label}}\"\r\n  [config]=\"lineType? 'line': ''\"\r\n  [required]=\"required\"\r\n  [readonly]=\"readonly\"\r\n  [disabled]=\"disabled\"\r\n  [invalid]=\"invalid\"\r\n  help-text=\"{{helpText}}\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [id]=\"name\"\r\n  [name]=\"name\"\r\n/>\r\n" }]
        }], ctorParameters: () => [{ type: i1.FormBuilder }], propDecorators: { name: [{
                type: Input
            }], model: [{
                type: Input
            }], modelChange: [{
                type: Output
            }], label: [{
                type: Input
            }], lineType: [{
                type: Input
            }], helpText: [{
                type: Input
            }], invalid: [{
                type: Input
            }], invalidChange: [{
                type: Output
            }], required: [{
                type: Input
            }], disabled: [{
                type: Input
            }], readonly: [{
                type: Input
            }], group: [{
                type: Input
            }] } });

class InputSelectZ {
    fb;
    selectInputRef;
    name = '';
    options = [];
    model;
    modelChange = new EventEmitter();
    multiSelect = false;
    group = new FormGroup({});
    label = 'Select';
    typeLine = false;
    required = false;
    invalid = false;
    invalidChange = new EventEmitter();
    disable = false;
    iconType = false;
    icon = 'bookmark';
    helpText = '';
    manualValidation = false;
    constructor(fb) {
        this.fb = fb;
    }
    ngOnInit() {
        this.generateGroup();
        this.generateControl();
    }
    generateGroup() {
        if (!this.group) {
            this.group = this.fb.group({});
        }
    }
    ngOnChanges(changes) {
        if (changes['invalid']) {
            this.updateInvalidState();
        }
        if (changes.model) {
            setTimeout(() => {
                this.updateControl();
            });
        }
        if (!this.manualValidation && this.group.status == 'INVALID') {
            this.invalid = true;
            this.invalidChange.emit(this.invalid);
            this.updateInvalidState();
        }
    }
    generateControl() {
        if (this.group) {
            if (!this.group.get(this.name)) {
                this.name = UtilService.getControlName();
                this.group.addControl(this.name, this.fb.control({}));
            }
            this.group
                .get(this.name)
                ?.setValidators(Validators.compose([
                this.group.get(this.name)?.validator,
                () => this.generateValidation(),
            ]));
            UtilService.updateControlValitor(this.group, this.name);
        }
    }
    generateValidation() {
        if (this.validateRequired()) {
            return { errorRequired: true };
        }
        return null;
    }
    validateRequired() {
        if (this.multiSelect) {
            //Queda pendiente por ajustar la validación.
            return this.required && this.model;
        }
        else {
            return this.required && !String(this.model || '').trim();
        }
    }
    updateControl() {
        if (this.group && this.group.get(this.name)) {
            this.group.get(this.name)?.setValue(this.model);
        }
    }
    updateInvalidState() {
        if (this.selectInputRef?.nativeElement) {
            this.selectInputRef.nativeElement.invalid = this.invalid;
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputSelectZ, deps: [{ token: i1.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: InputSelectZ, isStandalone: true, selector: "lib-input-select-z", inputs: { name: "name", options: "options", model: "model", multiSelect: "multiSelect", group: "group", label: "label", typeLine: "typeLine", required: "required", invalid: "invalid", disable: "disable", iconType: "iconType", icon: "icon", helpText: "helpText", manualValidation: "manualValidation" }, outputs: { modelChange: "modelChange", invalidChange: "invalidChange" }, viewQueries: [{ propertyName: "selectInputRef", first: true, predicate: ["selectInput"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "@if (multiSelect) {\r\n<za-multiselect\r\n  #selectInput\r\n  label=\"{{label}}\"\r\n  [name]=\"name\"\r\n  [id]=\"name\"\r\n  [label]=\"label\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [config]=\"typeLine? 'line': ''\"\r\n  [required]=\"required\"\r\n  [invalid]=\"invalid\"\r\n>\r\n  @for (item of options; track $index) {\r\n  <option [value]=\"item.value\">{{item.description}}</option>\r\n  }\r\n</za-multiselect>\r\n} @else {\r\n<div class=\"select-wrapper\">\r\n  <za-select\r\n    #selectInput\r\n    class=\"select-absolute\"\r\n    label=\"{{label}}\"\r\n    [name]=\"name\"\r\n    [id]=\"name\"\r\n    [(ngModel)]=\"model\"\r\n    (ngModelChange)=\"modelChange.emit(model)\"\r\n    [config]=\"typeLine? 'line': ''\"\r\n    [required]=\"required\"\r\n    [invalid]=\"invalid\"\r\n    help-text=\"{{helpText}}\"\r\n  >\r\n    @for (item of options; track $index) {\r\n    <option [value]=\"item.value\">{{item.description}}</option>\r\n    }\r\n  </za-select>\r\n</div>\r\n}\r\n", styles: [".select-wrapper{position:relative;padding-bottom:70px}.select-absolute{position:absolute;width:100%;left:0;top:0}\n"], dependencies: [{ kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgSelectOption, selector: "option", inputs: ["ngValue", "value"] }, { kind: "directive", type: i1.ɵNgSelectMultipleOption, selector: "option", inputs: ["ngValue", "value"] }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "ngmodule", type: ReactiveFormsModule }, { kind: "component", type: ZaSelect, selector: "za-select", inputs: ["options", "search-in-options-text", "options-not-found-text", "with-search", "search-autofocus", "custom"], outputs: ["search"] }, { kind: "component", type: ZaMultiselect, selector: "za-multiselect", inputs: ["options", "search-in-options-text", "options-not-found-text", "with-search", "search-autofocus", "custom"], outputs: ["search"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: InputSelectZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-input-select-z', standalone: true, imports: [FormsModule, ReactiveFormsModule, ZaSelect, ZaMultiselect], schemas: [CUSTOM_ELEMENTS_SCHEMA], template: "@if (multiSelect) {\r\n<za-multiselect\r\n  #selectInput\r\n  label=\"{{label}}\"\r\n  [name]=\"name\"\r\n  [id]=\"name\"\r\n  [label]=\"label\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [config]=\"typeLine? 'line': ''\"\r\n  [required]=\"required\"\r\n  [invalid]=\"invalid\"\r\n>\r\n  @for (item of options; track $index) {\r\n  <option [value]=\"item.value\">{{item.description}}</option>\r\n  }\r\n</za-multiselect>\r\n} @else {\r\n<div class=\"select-wrapper\">\r\n  <za-select\r\n    #selectInput\r\n    class=\"select-absolute\"\r\n    label=\"{{label}}\"\r\n    [name]=\"name\"\r\n    [id]=\"name\"\r\n    [(ngModel)]=\"model\"\r\n    (ngModelChange)=\"modelChange.emit(model)\"\r\n    [config]=\"typeLine? 'line': ''\"\r\n    [required]=\"required\"\r\n    [invalid]=\"invalid\"\r\n    help-text=\"{{helpText}}\"\r\n  >\r\n    @for (item of options; track $index) {\r\n    <option [value]=\"item.value\">{{item.description}}</option>\r\n    }\r\n  </za-select>\r\n</div>\r\n}\r\n", styles: [".select-wrapper{position:relative;padding-bottom:70px}.select-absolute{position:absolute;width:100%;left:0;top:0}\n"] }]
        }], ctorParameters: () => [{ type: i1.FormBuilder }], propDecorators: { selectInputRef: [{
                type: ViewChild,
                args: ['selectInput', { read: ElementRef }]
            }], name: [{
                type: Input
            }], options: [{
                type: Input
            }], model: [{
                type: Input
            }], modelChange: [{
                type: Output
            }], multiSelect: [{
                type: Input
            }], group: [{
                type: Input
            }], label: [{
                type: Input
            }], typeLine: [{
                type: Input
            }], required: [{
                type: Input
            }], invalid: [{
                type: Input
            }], invalidChange: [{
                type: Output
            }], disable: [{
                type: Input
            }], iconType: [{
                type: Input
            }], icon: [{
                type: Input
            }], helpText: [{
                type: Input
            }], manualValidation: [{
                type: Input
            }] } });

class NavigationZ {
    routes;
    social;
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: NavigationZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: NavigationZ, isStandalone: true, selector: "lib-navigation-z", inputs: { routes: "routes", social: "social" }, ngImport: i0, template: "<za-navigation\r\n  config=\"\"\r\n  [routes]=\"routes\"\r\n  [social]=\"social\"\r\n></za-navigation>\r\n", styles: [""], dependencies: [{ kind: "component", type: ZaNavigation, selector: "za-navigation", inputs: ["config", "isotype", "social", "footer", "with-top", "menu", "routes", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: NavigationZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-navigation-z', standalone: true, imports: [ZaNavigation], template: "<za-navigation\r\n  config=\"\"\r\n  [routes]=\"routes\"\r\n  [social]=\"social\"\r\n></za-navigation>\r\n" }]
        }], propDecorators: { routes: [{
                type: Input
            }], social: [{
                type: Input
            }] } });

class FooterZ {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: FooterZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: FooterZ, isStandalone: true, selector: "lib-footer-z", ngImport: i0, template: "<footer class=\"custom-footer\">\r\n  <div class=\"footer-content\">\r\n    <div class=\"footer-links\">\r\n      <a href=\"#\" class=\"footer-link\">Privacy</a>\r\n      <span class=\"footer-divider\">|</span>\r\n      <a href=\"#\" class=\"footer-link\">Terms of use</a>\r\n      <span class=\"footer-divider\">|</span>\r\n      <a href=\"#\" class=\"footer-link\">Cookies</a>\r\n    </div>\r\n    <div class=\"footer-social\">\r\n      <a href=\"#\" aria-label=\"Facebook\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/facebook--w.svg\" alt=\"Facebook\" />\r\n        </span>\r\n      </a>\r\n      <a href=\"#\" aria-label=\"LinkedIn\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/linkedin--w.svg\" alt=\"LinkedIn\" />\r\n        </span>\r\n      </a>\r\n      <a href=\"#\" aria-label=\"X\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/twitter--w.svg\" alt=\"X\" />\r\n        </span>\r\n      </a>\r\n      <a href=\"#\" aria-label=\"Instagram\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/instagram--w.svg\" alt=\"Instagram\" />\r\n        </span>\r\n      </a>\r\n      <a href=\"#\" aria-label=\"YouTube\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/youtube--w.svg\" alt=\"YouTube\" />\r\n        </span>\r\n      </a>\r\n    </div>\r\n    \r\n  </div>\r\n</footer>\r\n", styles: [".custom-footer{background:#f2f4f6;width:100%}.custom-footer .footer-content{display:flex;justify-content:space-between;align-items:center;padding:17px 40px}@media(max-width:1024px){.custom-footer .footer-content{padding:20px}}@media(max-width:768px){.custom-footer .footer-content{flex-direction:column;align-items:center;gap:16px;padding:18px 12px;min-height:120px}}.custom-footer .footer-links{display:flex;align-items:center;gap:8px}@media(max-width:768px){.custom-footer .footer-links{justify-content:center;width:100%;gap:12px;margin-bottom:8px}}.custom-footer .footer-link{color:#146eb4;text-decoration:none;font-size:.85rem;font-weight:400;transition:color .2s;padding:4px 2px;border-radius:4px}.custom-footer .footer-link:hover,.custom-footer .footer-link:focus{color:#11538c;text-decoration:underline;background:#e4edf6}.custom-footer .footer-divider{color:#146eb4;font-size:1rem;margin:0 6px;-webkit-user-select:none;user-select:none}.custom-footer .footer-link:first-child{margin-left:0}.custom-footer .footer-social{display:flex;align-items:center;gap:28px}.custom-footer .social-icon{display:flex;align-items:center;justify-content:center}.custom-footer .icon-circle{width:22px;height:22px;background:#146eb4;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .2s,box-shadow .2s}.custom-footer .icon-circle img{width:18px;height:18px;filter:none;opacity:1}.custom-footer .icon-circle:hover,.custom-footer .icon-circle:focus{background:#11538c;box-shadow:0 2px 8px #146eb41f}@media(max-width:768px){.custom-footer .footer-social{gap:16px;justify-content:center;width:100%;margin-bottom:0}.custom-footer .icon-circle{width:26px;height:26px}.custom-footer .icon-circle img{width:13px;height:13px}}@media(max-width:450px){.custom-footer .footer-content{padding:14px 4px;gap:10px}.custom-footer .footer-links{gap:6px;font-size:.95rem}.custom-footer .footer-social{gap:10px}.custom-footer .icon-circle{width:22px;height:22px}.custom-footer .icon-circle img{width:10px;height:10px}}\n"] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: FooterZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-footer-z', standalone: true, template: "<footer class=\"custom-footer\">\r\n  <div class=\"footer-content\">\r\n    <div class=\"footer-links\">\r\n      <a href=\"#\" class=\"footer-link\">Privacy</a>\r\n      <span class=\"footer-divider\">|</span>\r\n      <a href=\"#\" class=\"footer-link\">Terms of use</a>\r\n      <span class=\"footer-divider\">|</span>\r\n      <a href=\"#\" class=\"footer-link\">Cookies</a>\r\n    </div>\r\n    <div class=\"footer-social\">\r\n      <a href=\"#\" aria-label=\"Facebook\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/facebook--w.svg\" alt=\"Facebook\" />\r\n        </span>\r\n      </a>\r\n      <a href=\"#\" aria-label=\"LinkedIn\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/linkedin--w.svg\" alt=\"LinkedIn\" />\r\n        </span>\r\n      </a>\r\n      <a href=\"#\" aria-label=\"X\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/twitter--w.svg\" alt=\"X\" />\r\n        </span>\r\n      </a>\r\n      <a href=\"#\" aria-label=\"Instagram\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/instagram--w.svg\" alt=\"Instagram\" />\r\n        </span>\r\n      </a>\r\n      <a href=\"#\" aria-label=\"YouTube\" class=\"social-icon\">\r\n        <span class=\"icon-circle\">\r\n          <img src=\"https://zds.zurich.com/0.7.0/social/youtube--w.svg\" alt=\"YouTube\" />\r\n        </span>\r\n      </a>\r\n    </div>\r\n    \r\n  </div>\r\n</footer>\r\n", styles: [".custom-footer{background:#f2f4f6;width:100%}.custom-footer .footer-content{display:flex;justify-content:space-between;align-items:center;padding:17px 40px}@media(max-width:1024px){.custom-footer .footer-content{padding:20px}}@media(max-width:768px){.custom-footer .footer-content{flex-direction:column;align-items:center;gap:16px;padding:18px 12px;min-height:120px}}.custom-footer .footer-links{display:flex;align-items:center;gap:8px}@media(max-width:768px){.custom-footer .footer-links{justify-content:center;width:100%;gap:12px;margin-bottom:8px}}.custom-footer .footer-link{color:#146eb4;text-decoration:none;font-size:.85rem;font-weight:400;transition:color .2s;padding:4px 2px;border-radius:4px}.custom-footer .footer-link:hover,.custom-footer .footer-link:focus{color:#11538c;text-decoration:underline;background:#e4edf6}.custom-footer .footer-divider{color:#146eb4;font-size:1rem;margin:0 6px;-webkit-user-select:none;user-select:none}.custom-footer .footer-link:first-child{margin-left:0}.custom-footer .footer-social{display:flex;align-items:center;gap:28px}.custom-footer .social-icon{display:flex;align-items:center;justify-content:center}.custom-footer .icon-circle{width:22px;height:22px;background:#146eb4;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .2s,box-shadow .2s}.custom-footer .icon-circle img{width:18px;height:18px;filter:none;opacity:1}.custom-footer .icon-circle:hover,.custom-footer .icon-circle:focus{background:#11538c;box-shadow:0 2px 8px #146eb41f}@media(max-width:768px){.custom-footer .footer-social{gap:16px;justify-content:center;width:100%;margin-bottom:0}.custom-footer .icon-circle{width:26px;height:26px}.custom-footer .icon-circle img{width:13px;height:13px}}@media(max-width:450px){.custom-footer .footer-content{padding:14px 4px;gap:10px}.custom-footer .footer-links{gap:6px;font-size:.95rem}.custom-footer .footer-social{gap:10px}.custom-footer .icon-circle{width:22px;height:22px}.custom-footer .icon-circle img{width:10px;height:10px}}\n"] }]
        }] });

class CheckboxZ {
    fb;
    name = '';
    label = '';
    group = new FormGroup({});
    model;
    modelChange = new EventEmitter();
    required = false;
    disabled = false;
    valid = false;
    validChange = new EventEmitter();
    helpText = '';
    showHelpText = false;
    eventChange = new EventEmitter();
    constructor(fb) {
        this.fb = fb;
    }
    ngOnInit() {
        this.generateGroup();
        this.generateControl();
        if (this.group && this.group.get(this.name)) {
            this.group.get(this.name).statusChanges.subscribe((status) => {
                this.valid = status === 'INVALID' ? false : true;
                this.validChange.emit(this.valid);
            });
        }
    }
    ngOnChanges(changes) {
        if (changes.model) {
            setTimeout(() => {
                this.updateControl();
            });
        }
    }
    generateGroup() {
        if (!this.group) {
            this.group = this.fb.group({});
        }
    }
    generateControl() {
        if (this.group) {
            if (!this.group.get(this.name)) {
                this.name = UtilService.getControlName();
                this.group.addControl(this.name, this.fb.control({}));
            }
            this.group
                .get(this.name)
                ?.setValidators(Validators.compose([
                this.group.get(this.name)?.validator,
                () => this.generateValidation(),
            ]));
            UtilService.updateControlValitor(this.group, this.name);
        }
    }
    generateValidation() {
        if (this.validRequired()) {
            return { errorRequired: true };
        }
        return null;
    }
    validRequired() {
        return this.required && this.model;
    }
    updateControl() {
        if (this.group && this.group.get(this.name)) {
            this.group.get(this.name)?.setValue(this.model);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: CheckboxZ, deps: [{ token: i1.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: CheckboxZ, isStandalone: true, selector: "lib-checkbox-z", inputs: { name: "name", label: "label", group: "group", model: "model", required: "required", disabled: "disabled", valid: "valid", helpText: "helpText", showHelpText: "showHelpText" }, outputs: { modelChange: "modelChange", validChange: "validChange", eventChange: "eventChange" }, usesOnChanges: true, ngImport: i0, template: "<za-checkbox\r\n  id=\"{{name}}\"\r\n  name=\"{{name}}\"\r\n  label=\"{{label}}\"\r\n  [help-text]=\"helpText\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [required]=\"required\"\r\n  (change)=\"eventChange.emit($event)\"\r\n/>\r\n", styles: [".checkbox-group{display:flex;flex-direction:column;align-items:center}.bottom-label{font-size:12px;color:#666;margin-top:4px;text-align:center;max-width:120px}.bottom-label .error{color:red}input[type=checkbox]{appearance:none;-webkit-appearance:none;width:24px;height:24px;border:2px solid #23366f;border-radius:6px;background-color:#fff;position:relative;transition:background-color .3s,border-color .3s}input[type=checkbox]:hover{border-color:#1fb1e6}input[type=checkbox]:checked{background-color:#23366f;border-color:#23366f}input[type=checkbox]:after{content:\"\";position:absolute;top:2px;left:6px;width:6px;height:12px;border:solid white;border-width:0 2px 2px 0;transform:rotate(45deg) scale(0);transition:transform .2s ease-in-out;opacity:0}input[type=checkbox]:checked:after{transform:rotate(45deg) scale(1);opacity:1}input[type=checkbox]:disabled{opacity:.4}input[aria-invalid=true]:hover{outline:2px solid red;border-color:red}input[aria-invalid=false]:hover{outline:2px solid #1fb1e6;background-color:#23366f;border-color:#23366f}\n"], dependencies: [{ kind: "component", type: ZaCheckbox, selector: "za-checkbox", inputs: ["indeterminate", "custom"] }, { kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: CheckboxZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-checkbox-z', standalone: true, imports: [ZaCheckbox, FormsModule], template: "<za-checkbox\r\n  id=\"{{name}}\"\r\n  name=\"{{name}}\"\r\n  label=\"{{label}}\"\r\n  [help-text]=\"helpText\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  [required]=\"required\"\r\n  (change)=\"eventChange.emit($event)\"\r\n/>\r\n", styles: [".checkbox-group{display:flex;flex-direction:column;align-items:center}.bottom-label{font-size:12px;color:#666;margin-top:4px;text-align:center;max-width:120px}.bottom-label .error{color:red}input[type=checkbox]{appearance:none;-webkit-appearance:none;width:24px;height:24px;border:2px solid #23366f;border-radius:6px;background-color:#fff;position:relative;transition:background-color .3s,border-color .3s}input[type=checkbox]:hover{border-color:#1fb1e6}input[type=checkbox]:checked{background-color:#23366f;border-color:#23366f}input[type=checkbox]:after{content:\"\";position:absolute;top:2px;left:6px;width:6px;height:12px;border:solid white;border-width:0 2px 2px 0;transform:rotate(45deg) scale(0);transition:transform .2s ease-in-out;opacity:0}input[type=checkbox]:checked:after{transform:rotate(45deg) scale(1);opacity:1}input[type=checkbox]:disabled{opacity:.4}input[aria-invalid=true]:hover{outline:2px solid red;border-color:red}input[aria-invalid=false]:hover{outline:2px solid #1fb1e6;background-color:#23366f;border-color:#23366f}\n"] }]
        }], ctorParameters: () => [{ type: i1.FormBuilder }], propDecorators: { name: [{
                type: Input
            }], label: [{
                type: Input
            }], group: [{
                type: Input
            }], model: [{
                type: Input
            }], modelChange: [{
                type: Output
            }], required: [{
                type: Input
            }], disabled: [{
                type: Input
            }], valid: [{
                type: Input
            }], validChange: [{
                type: Output
            }], helpText: [{
                type: Input
            }], showHelpText: [{
                type: Input
            }], eventChange: [{
                type: Output
            }] } });

class TagZ {
    label = '';
    colorTag = '#000000';
    icon;
    iconRight = false;
    fill;
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TagZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: TagZ, isStandalone: true, selector: "lib-tag-z", inputs: { label: "label", colorTag: "colorTag", icon: "icon", iconRight: "iconRight", fill: "fill" }, ngImport: i0, template: "<za-tag\r\n  [fill]=\"fill\"\r\n  custom-str=\"bg:{{colorTag}}\"\r\n  [icon]=\"icon\"\r\n  [icon-right]=\"iconRight\"\r\n>\r\n  {{label}}\r\n</za-tag>\r\n", styles: [""], dependencies: [{ kind: "component", type: ZaTag, selector: "za-tag", inputs: ["fill", "custom", "icon", "icon-right"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TagZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-tag-z', imports: [ZaTag], schemas: [CUSTOM_ELEMENTS_SCHEMA], template: "<za-tag\r\n  [fill]=\"fill\"\r\n  custom-str=\"bg:{{colorTag}}\"\r\n  [icon]=\"icon\"\r\n  [icon-right]=\"iconRight\"\r\n>\r\n  {{label}}\r\n</za-tag>\r\n" }]
        }], propDecorators: { label: [{
                type: Input
            }], colorTag: [{
                type: Input
            }], icon: [{
                type: Input
            }], iconRight: [{
                type: Input
            }], fill: [{
                type: Input
            }] } });

const TABLE_CONSTANTS = {
    TAG_ERROR: ['Error', 'No disponible', 'Deshabilitado'],
    TAG_WARNING: ['Warning', 'En mantenimiento'],
    TAG_OK: ['OK', 'Disponible', 'Activo', 'ACTIVO'],
    TAG_ARCHIVATE: ['Archivado'],
};

class DynamicPipe {
    datePipe;
    currencyPipe;
    upperCasePipe;
    constructor(datePipe, currencyPipe, upperCasePipe) {
        this.datePipe = datePipe;
        this.currencyPipe = currencyPipe;
        this.upperCasePipe = upperCasePipe;
    }
    transform(value, pipeName) {
        if (!pipeName) {
            return value;
        }
        switch (pipeName) {
            case 'date':
                return this.datePipe.transform(value, 'dd/MM/yyyy');
            case 'currency':
                return this.currencyPipe.transform(value);
            case 'uppercase':
                return this.upperCasePipe.transform(value);
            case 'strong':
                return `<strong>${value}</strong>`;
            default:
                return value;
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: DynamicPipe, deps: [{ token: i1$1.DatePipe }, { token: i1$1.CurrencyPipe }, { token: i1$1.UpperCasePipe }], target: i0.ɵɵFactoryTarget.Pipe });
    static ɵpipe = i0.ɵɵngDeclarePipe({ minVersion: "14.0.0", version: "21.2.14", ngImport: i0, type: DynamicPipe, isStandalone: true, name: "dynamicPipe" });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: DynamicPipe, decorators: [{
            type: Pipe,
            args: [{
                    name: 'dynamicPipe',
                }]
        }], ctorParameters: () => [{ type: i1$1.DatePipe }, { type: i1$1.CurrencyPipe }, { type: i1$1.UpperCasePipe }] });

class TableZ {
    platformId;
    headers = new Array();
    data = new Array();
    typeStyle = '';
    pages = 0;
    disablePage = false;
    showGenericStart = false;
    genericStartName = '';
    showGenericEnd = false;
    generciEndName = '';
    hideHeader = false;
    eventChangePages = new EventEmitter();
    tableCheck = false;
    selectedItemsList = new EventEmitter();
    template;
    checkAll;
    genericStartT;
    genericEndT;
    page = 1;
    selectedItems = [];
    selectAllItems = false;
    checkAllItem;
    columnTemplates = {};
    viewData = [];
    TABLE_CONSTANTS = TABLE_CONSTANTS;
    constructor(platformId) {
        this.platformId = platformId;
    }
    ngOnChanges(changes) {
        if (changes.data) {
            this.orderData();
        }
    }
    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            const allITems = document.querySelector('.checkAll');
            setTimeout(() => {
                if (allITems) {
                    this.checkAllItem =
                        allITems.children[0].children[0].shadowRoot?.querySelector('input');
                }
            });
        }
    }
    ngAfterContentInit() {
        this.template.forEach((item) => {
            switch (item.id) {
                case 'start':
                    this.genericStartT = item.template;
                    break;
                case 'end':
                    this.genericEndT = item.template;
                    break;
                default:
                    this.columnTemplates[item.id] = item.template;
                    break;
            }
        });
    }
    ngOnInit() {
        this.orderData();
    }
    orderData() {
        const groupHeader = this.headers.find((h) => h.groupLabel);
        if (!groupHeader || !groupHeader.key) {
            // Si no hay columna marcada para agrupar, usa la data tal cual
            this.viewData = [...this.data];
            return;
        }
        const key = groupHeader.key;
        // 1) Ordenar por la clave de agrupación (si es string, usa localeCompare)
        this.viewData = [...this.data].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            if (typeof av === 'string' && typeof bv === 'string') {
                return av.localeCompare(bv);
            }
            // fallback numérico / genérico
            if (av < bv)
                return -1;
            if (av > bv)
                return 1;
            return 0;
        });
        // 2) Calcular metadatos de grupo: _showGroup y _rowspan
        this.buildGroupingMeta(this.viewData, key);
    }
    buildGroupingMeta(rows, key) {
        if (!rows.length)
            return;
        let currentValue = rows[0][key];
        let startIndex = 0;
        let count = 1;
        // Inicializa la primera fila como potencial inicio de grupo
        rows[0]._showGroup = true;
        rows[0]._groupValue = currentValue;
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const value = row[key];
            if (value === currentValue) {
                // Misma agrupación
                row._showGroup = false; // Estas filas no pintan la celda de grupo
                row._groupValue = currentValue;
                count++;
            }
            else {
                // Cerramos el grupo anterior
                rows[startIndex]._rowspan = count;
                // Abrimos nuevo grupo
                currentValue = value;
                startIndex = i;
                count = 1;
                row._showGroup = true;
                row._groupValue = currentValue;
            }
        }
        // Cerrar el último grupo
        rows[startIndex]._rowspan = count;
    }
    eventChangePage(event) {
        this.page = event.detail;
        this.eventChangePages.emit(this.page);
    }
    simpleCheck(event, dt, index) {
        if (!this.selectAllItems) {
            let id = this.getIdItem();
            if (event.detail) {
                this.selectedItems.push(dt);
            }
            else {
                this.selectedItems = this.selectedItems.filter((item) => {
                    return item[id[0].key] !== dt[id[0].key];
                });
            }
            this.selectedItemsList.emit(this.selectedItems);
        }
        this.validIsCheck(index);
    }
    selectAll(event) {
        this.selectAllItems = event.detail;
        setTimeout(() => {
            let sC;
            let listItems = document.querySelectorAll('.singleCheck');
            listItems.forEach((item) => {
                item.childNodes.forEach((subI) => {
                    let s = subI.childNodes[0];
                    sC = s.shadowRoot?.querySelector('input');
                    if (sC) {
                        if (!sC.checked && this.selectAllItems) {
                            sC.checked = true;
                        }
                        else if (sC.checked && !this.selectAllItems) {
                            sC.checked = false;
                        }
                    }
                });
            });
            this.selectedItemsList.emit(this.selectAllItems ? this.data : []);
        }, 20);
    }
    validIsCheck(index) {
        this.checkAllItem = this.checkAllItem;
        if (this.checkAllItem.checked) {
            this.checkAllItem.checked = false;
            this.selectAllItems = false;
            let d = this.data[index];
            let id = this.getIdItem();
            this.selectedItems = this.data.filter((item) => {
                return item[id[0].key] !== d[id[0].key];
            });
            this.selectedItemsList.emit(this.selectedItems);
        }
    }
    getIdItem() {
        return this.headers.filter((item) => {
            return item.id;
        });
    }
    validColorByCoincidencia(status) {
        let color = '#000000';
        if (TABLE_CONSTANTS.TAG_WARNING.includes(status)) {
            color = '#F9E547';
        }
        if (TABLE_CONSTANTS.TAG_ERROR.includes(status)) {
            color = '#BA4538';
        }
        if (TABLE_CONSTANTS.TAG_OK.includes(status)) {
            color = '#3A8367';
        }
        if (TABLE_CONSTANTS.TAG_ARCHIVATE.includes(status)) {
            color = '#DDE4E3';
        }
        return color;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TableZ, deps: [{ token: PLATFORM_ID }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: TableZ, isStandalone: true, selector: "lib-table-z", inputs: { headers: "headers", data: "data", typeStyle: "typeStyle", pages: "pages", disablePage: "disablePage", showGenericStart: "showGenericStart", genericStartName: "genericStartName", showGenericEnd: "showGenericEnd", generciEndName: "generciEndName", hideHeader: "hideHeader", tableCheck: "tableCheck" }, outputs: { eventChangePages: "eventChangePages", selectedItemsList: "selectedItemsList" }, providers: [DatePipe, CurrencyPipe, UpperCasePipe], queries: [{ propertyName: "template", predicate: ZTemplate }], viewQueries: [{ propertyName: "checkAll", first: true, predicate: ["checkAll"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"grid\">\r\n  <div class=\"col\">\r\n    <za-table [zebra]=\"typeStyle == 'odd'? 'odd': true\">\r\n      <table>\r\n        @if (!hideHeader) {\r\n        <thead>\r\n          <tr>\r\n            @if (showGenericStart) {\r\n            <th>{{ genericStartName }}</th>\r\n            } @for (head of headers; track $index) {\r\n            <th>{{ head.title }}</th>\r\n            } @if (showGenericEnd) {\r\n            <th>{{ generciEndName }}</th>\r\n            } @if (tableCheck) {\r\n            <th class=\"align-item-center\">\r\n              <lib-checkbox-z\r\n                #checkAll\r\n                class=\"checkAll\"\r\n                (eventChange)=\"selectAll($event)\"\r\n              ></lib-checkbox-z>\r\n              <samp> Action</samp>\r\n            </th>\r\n            }\r\n          </tr>\r\n        </thead>\r\n        }\r\n        <tbody>\r\n          @for (row of viewData; track $index) {\r\n          <tr>\r\n            @if(showGenericStart) {\r\n            <td>\r\n              <ng-template\r\n                [ngTemplateOutlet]=\"genericStartT\"\r\n                [ngTemplateOutletContext]=\"{value: row}\"\r\n              ></ng-template>\r\n            </td>\r\n            } @for (itemH of headers; track $index) { @if(itemH.groupLabel) {\r\n            @if (row._showGroup) {\r\n            <td class=\"group-label\" [attr.rowspan]=\"row._rowspan ?? null\">\r\n              {{ row[itemH.key!] }}\r\n            </td>\r\n            } }@else { @if (itemH.isSubGroup) { @if (itemH.isTag) {\r\n\r\n            <td>\r\n              <lib-tag-z\r\n                colorTag=\"{{ validColorByCoincidencia(row[itemH.key!][itemH.subGroupIndice!][itemH.subGroupkey!]) }}\"\r\n                [icon]=\"itemH.iconTag\"\r\n                [iconRight]=\"itemH.iconRight\"\r\n                label=\"{{row[itemH.key!][itemH.subGroupIndice!][itemH.subGroupkey!] | dynamicPipe: itemH.pipe}}\"\r\n              ></lib-tag-z>\r\n            </td>\r\n            } @else {\r\n            <td>\r\n              {{row[itemH.key!][itemH.subGroupIndice!][itemH.subGroupkey!] |\r\n              dynamicPipe: itemH.pipe}}\r\n            </td>\r\n            } } @else { @if (itemH.isTag) {\r\n            <td>\r\n              <lib-tag-z\r\n                colorTag=\"{{validColorByCoincidencia(row[itemH.key!])}}\"\r\n                [icon]=\"itemH.iconTag\"\r\n                [iconRight]=\"itemH.iconRight\"\r\n                [label]=\" row[itemH.key!] | dynamicPipe: itemH.pipe\"\r\n              ></lib-tag-z>\r\n            </td>\r\n            } @else {\r\n            <td>{{ row[itemH.key!] | dynamicPipe: itemH.pipe }}</td>\r\n            } } } } @if(showGenericEnd) {\r\n            <td>\r\n              <ng-template\r\n                [ngTemplateOutlet]=\"genericEndT\"\r\n                [ngTemplateOutletContext]=\"{value: row}\"\r\n              ></ng-template>\r\n            </td>\r\n            } @if (tableCheck) {\r\n            <td class=\"align-item-center\">\r\n              <lib-checkbox-z\r\n                class=\"singleCheck\"\r\n                (eventChange)=\"simpleCheck($event, row, $index)\"\r\n              ></lib-checkbox-z>\r\n            </td>\r\n            }\r\n          </tr>\r\n          }\r\n        </tbody>\r\n      </table>\r\n    </za-table>\r\n  </div>\r\n</div>\r\n@if (pages > 1) {\r\n<div class=\"grid\">\r\n  <div class=\"col\">\r\n    <div class=\"flex justify-content-center flex-wrap\">\r\n      <za-pagination\r\n        [disabled]=\"disablePage\"\r\n        [pages]=\"pages\"\r\n        model=\"{{page}}\"\r\n        (change)=\"eventChangePage($event)\"\r\n      ></za-pagination>\r\n    </div>\r\n  </div>\r\n</div>\r\n}\r\n", styles: [".align-item-center{text-align:center}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1$1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: ZaTable, selector: "za-table", inputs: ["headers", "rows", "zebra", "caption", "custom"] }, { kind: "component", type: ZaPagination, selector: "za-pagination", inputs: ["pages", "disabled", "show-edges", "custom"] }, { kind: "component", type: CheckboxZ, selector: "lib-checkbox-z", inputs: ["name", "label", "group", "model", "required", "disabled", "valid", "helpText", "showHelpText"], outputs: ["modelChange", "validChange", "eventChange"] }, { kind: "component", type: TagZ, selector: "lib-tag-z", inputs: ["label", "colorTag", "icon", "iconRight", "fill"] }, { kind: "pipe", type: DynamicPipe, name: "dynamicPipe" }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TableZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-table-z', standalone: true, imports: [
                        CommonModule,
                        ZaTable,
                        ZaPagination,
                        CheckboxZ,
                        ZTemplate,
                        TagZ,
                        DynamicPipe,
                    ], schemas: [CUSTOM_ELEMENTS_SCHEMA], providers: [DatePipe, CurrencyPipe, UpperCasePipe], template: "<div class=\"grid\">\r\n  <div class=\"col\">\r\n    <za-table [zebra]=\"typeStyle == 'odd'? 'odd': true\">\r\n      <table>\r\n        @if (!hideHeader) {\r\n        <thead>\r\n          <tr>\r\n            @if (showGenericStart) {\r\n            <th>{{ genericStartName }}</th>\r\n            } @for (head of headers; track $index) {\r\n            <th>{{ head.title }}</th>\r\n            } @if (showGenericEnd) {\r\n            <th>{{ generciEndName }}</th>\r\n            } @if (tableCheck) {\r\n            <th class=\"align-item-center\">\r\n              <lib-checkbox-z\r\n                #checkAll\r\n                class=\"checkAll\"\r\n                (eventChange)=\"selectAll($event)\"\r\n              ></lib-checkbox-z>\r\n              <samp> Action</samp>\r\n            </th>\r\n            }\r\n          </tr>\r\n        </thead>\r\n        }\r\n        <tbody>\r\n          @for (row of viewData; track $index) {\r\n          <tr>\r\n            @if(showGenericStart) {\r\n            <td>\r\n              <ng-template\r\n                [ngTemplateOutlet]=\"genericStartT\"\r\n                [ngTemplateOutletContext]=\"{value: row}\"\r\n              ></ng-template>\r\n            </td>\r\n            } @for (itemH of headers; track $index) { @if(itemH.groupLabel) {\r\n            @if (row._showGroup) {\r\n            <td class=\"group-label\" [attr.rowspan]=\"row._rowspan ?? null\">\r\n              {{ row[itemH.key!] }}\r\n            </td>\r\n            } }@else { @if (itemH.isSubGroup) { @if (itemH.isTag) {\r\n\r\n            <td>\r\n              <lib-tag-z\r\n                colorTag=\"{{ validColorByCoincidencia(row[itemH.key!][itemH.subGroupIndice!][itemH.subGroupkey!]) }}\"\r\n                [icon]=\"itemH.iconTag\"\r\n                [iconRight]=\"itemH.iconRight\"\r\n                label=\"{{row[itemH.key!][itemH.subGroupIndice!][itemH.subGroupkey!] | dynamicPipe: itemH.pipe}}\"\r\n              ></lib-tag-z>\r\n            </td>\r\n            } @else {\r\n            <td>\r\n              {{row[itemH.key!][itemH.subGroupIndice!][itemH.subGroupkey!] |\r\n              dynamicPipe: itemH.pipe}}\r\n            </td>\r\n            } } @else { @if (itemH.isTag) {\r\n            <td>\r\n              <lib-tag-z\r\n                colorTag=\"{{validColorByCoincidencia(row[itemH.key!])}}\"\r\n                [icon]=\"itemH.iconTag\"\r\n                [iconRight]=\"itemH.iconRight\"\r\n                [label]=\" row[itemH.key!] | dynamicPipe: itemH.pipe\"\r\n              ></lib-tag-z>\r\n            </td>\r\n            } @else {\r\n            <td>{{ row[itemH.key!] | dynamicPipe: itemH.pipe }}</td>\r\n            } } } } @if(showGenericEnd) {\r\n            <td>\r\n              <ng-template\r\n                [ngTemplateOutlet]=\"genericEndT\"\r\n                [ngTemplateOutletContext]=\"{value: row}\"\r\n              ></ng-template>\r\n            </td>\r\n            } @if (tableCheck) {\r\n            <td class=\"align-item-center\">\r\n              <lib-checkbox-z\r\n                class=\"singleCheck\"\r\n                (eventChange)=\"simpleCheck($event, row, $index)\"\r\n              ></lib-checkbox-z>\r\n            </td>\r\n            }\r\n          </tr>\r\n          }\r\n        </tbody>\r\n      </table>\r\n    </za-table>\r\n  </div>\r\n</div>\r\n@if (pages > 1) {\r\n<div class=\"grid\">\r\n  <div class=\"col\">\r\n    <div class=\"flex justify-content-center flex-wrap\">\r\n      <za-pagination\r\n        [disabled]=\"disablePage\"\r\n        [pages]=\"pages\"\r\n        model=\"{{page}}\"\r\n        (change)=\"eventChangePage($event)\"\r\n      ></za-pagination>\r\n    </div>\r\n  </div>\r\n</div>\r\n}\r\n", styles: [".align-item-center{text-align:center}\n"] }]
        }], ctorParameters: () => [{ type: Object, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }], propDecorators: { headers: [{
                type: Input
            }], data: [{
                type: Input
            }], typeStyle: [{
                type: Input
            }], pages: [{
                type: Input
            }], disablePage: [{
                type: Input
            }], showGenericStart: [{
                type: Input
            }], genericStartName: [{
                type: Input
            }], showGenericEnd: [{
                type: Input
            }], generciEndName: [{
                type: Input
            }], hideHeader: [{
                type: Input
            }], eventChangePages: [{
                type: Output
            }], tableCheck: [{
                type: Input
            }], selectedItemsList: [{
                type: Output
            }], template: [{
                type: ContentChildren,
                args: [ZTemplate]
            }], checkAll: [{
                type: ViewChild,
                args: ['checkAll']
            }] } });

class CardZ {
    showHeader = true;
    showFooter = true;
    bgColor = '';
    colorTxt = '';
    template;
    header;
    content;
    footer;
    customStr = '';
    constructor() { }
    ngAfterContentInit() {
        this.buildCustomStr();
        this.template.forEach((item) => {
            switch (item.id) {
                case 'header':
                    this.header = item.template;
                    break;
                case 'content':
                    this.content = item.template;
                    break;
                case 'footer':
                    this.footer = item.template;
            }
        });
    }
    ngOnInit() { }
    buildCustomStr() {
        const parts = [];
        const bg = this.bgColor?.trim();
        if (bg)
            parts.push(`bg:${bg}`);
        const color = this.colorTxt?.trim();
        if (color)
            parts.push(`color:${color}`);
        const result = parts.join(';');
        this.customStr = result;
        return result || undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: CardZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: CardZ, isStandalone: true, selector: "lib-card-z", inputs: { showHeader: "showHeader", showFooter: "showFooter", bgColor: "bgColor", colorTxt: "colorTxt" }, queries: [{ propertyName: "template", predicate: ZTemplate }], ngImport: i0, template: "<za-card config=\"grid\" [custom-str]=\"customStr\">\r\n  <!-- <za-card config=\"grid\" style=\"background-color: rgb(21, 76, 195)\"> -->\r\n  @if (showHeader) {\r\n  <div class=\"grid\">\r\n    <div class=\"col\">\r\n      <ng-template [ngTemplateOutlet]=\"header\"></ng-template>\r\n    </div>\r\n  </div>\r\n  }\r\n  <div class=\"grid\">\r\n    <div class=\"col\">\r\n      <ng-template [ngTemplateOutlet]=\"content\"></ng-template>\r\n    </div>\r\n  </div>\r\n  @if (showFooter) {\r\n  <div class=\"grid\">\r\n    <div class=\"col\">\r\n      <ng-template [ngTemplateOutlet]=\"footer\"></ng-template>\r\n    </div>\r\n  </div>\r\n  }\r\n</za-card>\r\n", styles: [".grid-mar{margin-top:.2rem!important;margin-bottom:.2rem!important}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1$1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: ZaCard, selector: "za-card", inputs: ["content", "level", "size", "config", "clickable", "custom"], outputs: ["onClick"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: CardZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-card-z', standalone: true, imports: [CommonModule, ZaCard], template: "<za-card config=\"grid\" [custom-str]=\"customStr\">\r\n  <!-- <za-card config=\"grid\" style=\"background-color: rgb(21, 76, 195)\"> -->\r\n  @if (showHeader) {\r\n  <div class=\"grid\">\r\n    <div class=\"col\">\r\n      <ng-template [ngTemplateOutlet]=\"header\"></ng-template>\r\n    </div>\r\n  </div>\r\n  }\r\n  <div class=\"grid\">\r\n    <div class=\"col\">\r\n      <ng-template [ngTemplateOutlet]=\"content\"></ng-template>\r\n    </div>\r\n  </div>\r\n  @if (showFooter) {\r\n  <div class=\"grid\">\r\n    <div class=\"col\">\r\n      <ng-template [ngTemplateOutlet]=\"footer\"></ng-template>\r\n    </div>\r\n  </div>\r\n  }\r\n</za-card>\r\n", styles: [".grid-mar{margin-top:.2rem!important;margin-bottom:.2rem!important}\n"] }]
        }], ctorParameters: () => [], propDecorators: { showHeader: [{
                type: Input
            }], showFooter: [{
                type: Input
            }], bgColor: [{
                type: Input
            }], colorTxt: [{
                type: Input
            }], template: [{
                type: ContentChildren,
                args: [ZTemplate]
            }] } });

class ModalZ {
    open = false;
    close = new EventEmitter();
    tamanio = '';
    ShowBackdrop = true;
    template;
    title;
    content;
    buttons;
    constructor() { }
    ngAfterContentInit() {
        this.template.forEach((item) => {
            switch (item.id) {
                case 'title':
                    this.title = item.template;
                    break;
                case 'content':
                    this.content = item.template;
                    break;
                case 'buttons':
                    this.buttons = item.template;
                    break;
            }
        });
    }
    ngOnInit() { }
    change(event) {
        this.open = false;
        this.close.emit(false);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: ModalZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: ModalZ, isStandalone: true, selector: "lib-modal-z", inputs: { open: "open", tamanio: "tamanio", ShowBackdrop: "ShowBackdrop" }, outputs: { close: "close" }, queries: [{ propertyName: "template", predicate: ZTemplate }], ngImport: i0, template: "@if (ShowBackdrop){ @if (open) {\n<div class=\"modal-backdrop\" (click)=\"change($event)\"></div>\n} } @if (open) {\n<div\n  class=\"modal-window\"\n  tabindex=\"-1\"\n  role=\"dialog\"\n  aria-modal=\"true\"\n  [ngClass]=\"[\n    tamanio == 'l'?\n    'modal-window--l': tamanio == 'm'?\n    'modal-window--m': tamanio == 's'?\n    'modal-window--s': tamanio == 'xs'?\n    'modal-window--xs': 'modal-window--xs']\"\n>\n  <div class=\"grid\">\n    <div class=\"col\">\n      <ng-template [ngTemplateOutlet]=\"title\"></ng-template>\n    </div>\n    <div class=\"col\">\n      <za-icon\n        icon=\"close:line\"\n        class=\"modal-close\"\n        (click)=\"change($event)\"\n      ></za-icon>\n    </div>\n  </div>\n  <div class=\"grid overflow_content mb-3\">\n    <div class=\"col\">\n      <ng-template [ngTemplateOutlet]=\"content\"></ng-template>\n    </div>\n  </div>\n  <div class=\"grid\">\n    <div class=\"col\">\n      <ng-template [ngTemplateOutlet]=\"buttons\"></ng-template>\n    </div>\n  </div>\n</div>\n}\n", styles: [".modal-backdrop{position:fixed;inset:0;background:#00000080;z-index:1000}.modal-window{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:1.5rem;z-index:1001;min-width:300px;max-width:90vw;box-shadow:0 2px 8px #0003}.modal-window--l{width:60vw}.modal-window--m{width:50vw}.modal-window--s{width:40vw}.modal-window--xs{width:30vw}.modal-close{position:absolute;top:1.75rem;right:1.8rem;background:transparent;color:#2167ae;border:none;font-size:2rem;cursor:pointer}.overflow_content{max-height:53vh;overflow-y:auto}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1$1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i1$1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: ZaIcon, selector: "za-icon", inputs: ["icon", "config", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: ModalZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-modal-z', standalone: true, imports: [CommonModule, ZaIcon], template: "@if (ShowBackdrop){ @if (open) {\n<div class=\"modal-backdrop\" (click)=\"change($event)\"></div>\n} } @if (open) {\n<div\n  class=\"modal-window\"\n  tabindex=\"-1\"\n  role=\"dialog\"\n  aria-modal=\"true\"\n  [ngClass]=\"[\n    tamanio == 'l'?\n    'modal-window--l': tamanio == 'm'?\n    'modal-window--m': tamanio == 's'?\n    'modal-window--s': tamanio == 'xs'?\n    'modal-window--xs': 'modal-window--xs']\"\n>\n  <div class=\"grid\">\n    <div class=\"col\">\n      <ng-template [ngTemplateOutlet]=\"title\"></ng-template>\n    </div>\n    <div class=\"col\">\n      <za-icon\n        icon=\"close:line\"\n        class=\"modal-close\"\n        (click)=\"change($event)\"\n      ></za-icon>\n    </div>\n  </div>\n  <div class=\"grid overflow_content mb-3\">\n    <div class=\"col\">\n      <ng-template [ngTemplateOutlet]=\"content\"></ng-template>\n    </div>\n  </div>\n  <div class=\"grid\">\n    <div class=\"col\">\n      <ng-template [ngTemplateOutlet]=\"buttons\"></ng-template>\n    </div>\n  </div>\n</div>\n}\n", styles: [".modal-backdrop{position:fixed;inset:0;background:#00000080;z-index:1000}.modal-window{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:1.5rem;z-index:1001;min-width:300px;max-width:90vw;box-shadow:0 2px 8px #0003}.modal-window--l{width:60vw}.modal-window--m{width:50vw}.modal-window--s{width:40vw}.modal-window--xs{width:30vw}.modal-close{position:absolute;top:1.75rem;right:1.8rem;background:transparent;color:#2167ae;border:none;font-size:2rem;cursor:pointer}.overflow_content{max-height:53vh;overflow-y:auto}\n"] }]
        }], ctorParameters: () => [], propDecorators: { open: [{
                type: Input
            }], close: [{
                type: Output
            }], tamanio: [{
                type: Input
            }], ShowBackdrop: [{
                type: Input
            }], template: [{
                type: ContentChildren,
                args: [ZTemplate]
            }] } });

class AlertZService {
    alertsSubject = new BehaviorSubject([]);
    alerts$ = this.alertsSubject.asObservable();
    genId() {
        return Math.random().toString(36).substr(2, 9);
    }
    /** Métodos rápidos para mostrar alertas */
    info(message, opts = {}) {
        this.show({ ...opts, message, config: 'info' });
    }
    positive(message, opts = {}) {
        this.show({ ...opts, message, config: 'positive' });
    }
    negative(message, opts = {}) {
        this.show({ ...opts, message, config: 'negative' });
    }
    alert(message, opts = {}) {
        this.show({ ...opts, message, config: 'alert' });
    }
    /** Método genérico */
    show(alert) {
        alert.id = alert.id ?? this.genId();
        const current = this.alertsSubject.value;
        this.alertsSubject.next([...current, alert]);
    }
    /** Remover alerta (por id) */
    remove(id) {
        this.alertsSubject.next(this.alertsSubject.value.filter(a => a.id !== id));
    }
    /** Limpiar todas */
    clear() {
        this.alertsSubject.next([]);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AlertZService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AlertZService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AlertZService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

class AlertZ {
    alertService;
    cdr;
    alerts = [];
    autoCloseTimers = new Map();
    closing = new Set(); // ids en animación de cierre
    // private readonly cdr = inject(ChangeDetectorRef);
    sub = new Subscription();
    //duracion animaciones
    animationDurations = {
        'fade-out': 250,
        'slide-out': 300,
        'shrink-out': 280,
        __default__: 300,
    };
    constructor(alertService, cdr) {
        this.alertService = alertService;
        this.cdr = cdr;
        this.sub.add(this.alertService.alerts$.subscribe((alerts) => {
            this.scheduleAutoCloseForNew(alerts);
            this.cleanupTimersForRemoved(alerts);
            this.alerts = alerts;
            this.cdr.markForCheck();
        }));
    }
    ngOnDestroy() {
        this.autoCloseTimers.forEach((id) => window.clearTimeout(id));
        this.autoCloseTimers.clear();
        this.sub.unsubscribe();
    }
    close(id) {
        if (!id)
            return;
        if (this.closing.has(id))
            return;
        const alert = this.alerts.find((a) => a.id === id);
        const onCloseClass = alert?.onCloseAnimation;
        if (onCloseClass) {
            this.closing.add(id);
            this.cdr.markForCheck();
            const duration = this.getAnimationDuration(onCloseClass);
            window.setTimeout(() => {
                this.alertService.remove(id);
                this.closing.delete(id);
                this.cdr.markForCheck();
            }, duration);
        }
        else {
            this.alertService.remove(id);
        }
    }
    /** Clases por ítem para show/close */
    getItemClasses(alert) {
        return {
            [alert.onShowAnimation ?? '']: !this.closing.has(alert.id) && !!alert.onShowAnimation,
            [alert.onCloseAnimation ?? '']: this.closing.has(alert.id) && !!alert.onCloseAnimation,
        };
    }
    // ---- Helpers privados ----
    scheduleAutoCloseForNew(alerts) {
        for (const a of alerts) {
            if (!a.id)
                continue;
            if (a.autoCloseAfter &&
                a.autoCloseAfter > 0 &&
                !this.autoCloseTimers.has(a.id)) {
                const tId = window.setTimeout(() => this.close(a.id), a.autoCloseAfter);
                this.autoCloseTimers.set(a.id, tId);
            }
        }
    }
    cleanupTimersForRemoved(alerts) {
        const currentIds = new Set(alerts.map((a) => a.id).filter(Boolean));
        for (const [id, tId] of this.autoCloseTimers) {
            if (!currentIds.has(id)) {
                window.clearTimeout(tId);
                this.autoCloseTimers.delete(id);
            }
        }
    }
    getAnimationDuration(name) {
        return (this.animationDurations[name] ?? this.animationDurations['__default__']);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AlertZ, deps: [{ token: AlertZService }, { token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: AlertZ, isStandalone: true, selector: "lib-alert-z", ngImport: i0, template: "<div class=\"alert-z-container\">\r\n  @for (alert of alerts; track alert.id) {\r\n    <div\r\n      [ngClass]=\"getItemClasses(alert)\"\r\n      [ngStyle]=\"{ width: (alert.widthPercent ?? 100) + '%'}\"\r\n    >\r\n      <za-alert\r\n        [config]=\"alert.config || 'info'\"\r\n        (close)=\"close(alert.id)\"\r\n      >\r\n        @if (alert.title) {\r\n          <strong>{{ alert.title }}</strong>\r\n        }\r\n        {{ alert.message }}\r\n      </za-alert>\r\n    </div>\r\n  }\r\n</div>", styles: [".fade-in{animation:fadeIn .2s ease-out forwards}.zoom-in{animation:zoomIn .22s ease-out forwards}.fade-out{animation:fadeOut .25s ease-in forwards}.slide-out{animation:slideOut .3s ease-in forwards}.shrink-out{animation:shrinkOut .28s ease-in forwards}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}@keyframes fadeOut{0%{opacity:1}to{opacity:0}}@keyframes zoomIn{0%{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}@keyframes slideOut{0%{transform:translateY(0);opacity:1}to{transform:translateY(-10px);opacity:0}}@keyframes shrinkOut{0%{transform:scale(1);opacity:1}to{transform:scale(.96);opacity:0}}@media(prefers-reduced-motion:reduce){.fade-in,.zoom-in,.fade-out,.slide-out,.shrink-out{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important}}.alert-z-container{position:fixed;top:1rem;right:1rem;z-index:2000;width:380px;max-width:100vw}\n"], dependencies: [{ kind: "component", type: ZaAlert, selector: "za-alert", inputs: ["config", "icon", "hide-close", "confirm-text", "custom"], outputs: ["close", "confirm"] }, { kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1$1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i1$1.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: AlertZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-alert-z', standalone: true, imports: [ZaAlert, CommonModule], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"alert-z-container\">\r\n  @for (alert of alerts; track alert.id) {\r\n    <div\r\n      [ngClass]=\"getItemClasses(alert)\"\r\n      [ngStyle]=\"{ width: (alert.widthPercent ?? 100) + '%'}\"\r\n    >\r\n      <za-alert\r\n        [config]=\"alert.config || 'info'\"\r\n        (close)=\"close(alert.id)\"\r\n      >\r\n        @if (alert.title) {\r\n          <strong>{{ alert.title }}</strong>\r\n        }\r\n        {{ alert.message }}\r\n      </za-alert>\r\n    </div>\r\n  }\r\n</div>", styles: [".fade-in{animation:fadeIn .2s ease-out forwards}.zoom-in{animation:zoomIn .22s ease-out forwards}.fade-out{animation:fadeOut .25s ease-in forwards}.slide-out{animation:slideOut .3s ease-in forwards}.shrink-out{animation:shrinkOut .28s ease-in forwards}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}@keyframes fadeOut{0%{opacity:1}to{opacity:0}}@keyframes zoomIn{0%{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}@keyframes slideOut{0%{transform:translateY(0);opacity:1}to{transform:translateY(-10px);opacity:0}}@keyframes shrinkOut{0%{transform:scale(1);opacity:1}to{transform:scale(.96);opacity:0}}@media(prefers-reduced-motion:reduce){.fade-in,.zoom-in,.fade-out,.slide-out,.shrink-out{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important}}.alert-z-container{position:fixed;top:1rem;right:1rem;z-index:2000;width:380px;max-width:100vw}\n"] }]
        }], ctorParameters: () => [{ type: AlertZService }, { type: i0.ChangeDetectorRef }] });

class StageZ {
    cdr;
    customStr = '';
    imageSrc = '';
    header = '';
    contentContext = {};
    contentTpl;
    // private readonly cdr = inject(ChangeDetectorRef);
    templatesSub;
    constructor(cdr) {
        this.cdr = cdr;
    }
    ngOnDestroy() {
        this.templatesSub?.unsubscribe?.();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: StageZ, deps: [{ token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: StageZ, isStandalone: true, selector: "lib-stage-z", inputs: { customStr: ["custom-str", "customStr"], imageSrc: ["image-src", "imageSrc"], header: "header", contentContext: "contentContext" }, host: { classAttribute: "lib-stage-z" }, ngImport: i0, template: "<za-stage [custom-str]=\"customStr\" [header]=\"header\" [image-src]=\"imageSrc\">\r\n  @if (contentTpl) {\r\n  <ng-container\r\n    *ngTemplateOutlet=\"contentTpl; context: contentContext\"\r\n  ></ng-container>\r\n  } @else {\r\n  <ng-content></ng-content>\r\n  }\r\n</za-stage>\r\n", styles: [":host{display:block}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1$1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: ZaStage, selector: "za-stage", inputs: ["content", "header", "config", "shape", "no-safe-space", "custom"], outputs: ["click"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: StageZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-stage-z', standalone: true, imports: [CommonModule, ZaStage], changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'lib-stage-z' }, template: "<za-stage [custom-str]=\"customStr\" [header]=\"header\" [image-src]=\"imageSrc\">\r\n  @if (contentTpl) {\r\n  <ng-container\r\n    *ngTemplateOutlet=\"contentTpl; context: contentContext\"\r\n  ></ng-container>\r\n  } @else {\r\n  <ng-content></ng-content>\r\n  }\r\n</za-stage>\r\n", styles: [":host{display:block}\n"] }]
        }], ctorParameters: () => [{ type: i0.ChangeDetectorRef }], propDecorators: { customStr: [{
                type: Input,
                args: [{ alias: 'custom-str' }]
            }], imageSrc: [{
                type: Input,
                args: [{ alias: 'image-src' }]
            }], header: [{
                type: Input
            }], contentContext: [{
                type: Input
            }] } });

class StageBannerZ {
    /* These lines of code are defining input properties for the `StageBannerZ` component in Angular. */
    /* The `@Input() category: string = 'Category Header';` line of code is defining an input property
    named `category` for the `StageBannerZ` component in Angular. This input property allows external
    components to pass a value to the `category` property when using the `StageBannerZ` component in
    their templates. */
    category = 'Category Header';
    /* The `@Input() customStr: string = 'bg: #73DCE6; color: #000;'` line of code is defining an input
    property named `customStr` for the `StageBannerZ` component in Angular. This input property allows
    external components to pass a value to the `customStr` property when using the `StageBannerZ`
    component in their templates. */
    customStr = '';
    addImage = false;
    imageSrc = '';
    content = 'CONTENT';
    /* The `@Input() config: string = '';` line of code is defining an input property named `config` for
    the `StageBannerZ` component in Angular. This input property allows external components to pass a
    value to the `config` property when using the `StageBannerZ` component in their templates. */
    config = '';
    /* The `@Input() shape: string = '1';` line of code is defining an input property named `shape` for
    the `StageBannerZ` component in Angular. This input property allows external components to pass a
    value to the `shape` property when using the `StageBannerZ` component in their templates. */
    shape = '';
    roundedBanner = false;
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: StageBannerZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: StageBannerZ, isStandalone: true, selector: "lib-stage-banner-z", inputs: { category: "category", customStr: "customStr", addImage: "addImage", imageSrc: "imageSrc", content: "content", config: "config", shape: "shape", roundedBanner: "roundedBanner" }, ngImport: i0, template: "<div [ngClass]=\"roundedBanner? 'banner-redondeado': ''\">\r\n  @if(!addImage) {\r\n  <z-stage-banner\r\n    [category]=\"category\"\r\n    [custom-str]=\"customStr\"\r\n    [config]=\"config\"\r\n    [shape]=\"shape? shape : undefined\"\r\n  >\r\n    {{ content }}\r\n  </z-stage-banner>\r\n  } @else {\r\n  <z-stage-banner\r\n    [category]=\"category\"\r\n    [custom-str]=\"customStr\"\r\n    [config]=\"config\"\r\n    [shape]=\"shape? shape : undefined\"\r\n    [image-src]=\"imageSrc\"\r\n  >\r\n    {{ content }}\r\n  </z-stage-banner>\r\n  }\r\n</div>\r\n", styles: [".banner-redondeado z-stage-banner::part(stage-banner){border-radius:12px}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1$1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: StageBannerZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-stage-banner-z', standalone: true, imports: [CommonModule], schemas: [CUSTOM_ELEMENTS_SCHEMA], template: "<div [ngClass]=\"roundedBanner? 'banner-redondeado': ''\">\r\n  @if(!addImage) {\r\n  <z-stage-banner\r\n    [category]=\"category\"\r\n    [custom-str]=\"customStr\"\r\n    [config]=\"config\"\r\n    [shape]=\"shape? shape : undefined\"\r\n  >\r\n    {{ content }}\r\n  </z-stage-banner>\r\n  } @else {\r\n  <z-stage-banner\r\n    [category]=\"category\"\r\n    [custom-str]=\"customStr\"\r\n    [config]=\"config\"\r\n    [shape]=\"shape? shape : undefined\"\r\n    [image-src]=\"imageSrc\"\r\n  >\r\n    {{ content }}\r\n  </z-stage-banner>\r\n  }\r\n</div>\r\n", styles: [".banner-redondeado z-stage-banner::part(stage-banner){border-radius:12px}\n"] }]
        }], propDecorators: { category: [{
                type: Input
            }], customStr: [{
                type: Input
            }], addImage: [{
                type: Input
            }], imageSrc: [{
                type: Input
            }], content: [{
                type: Input
            }], config: [{
                type: Input
            }], shape: [{
                type: Input
            }], roundedBanner: [{
                type: Input
            }] } });

class RangeDateZ {
    label = 'content';
    config = 'teal';
    helpText = 'Rango de fechas de filtro';
    min = 'date';
    required = false;
    ztheme = 'dark';
    modelo = [null, null];
    modeloChange = new EventEmitter();
    onModeloChange(event) {
        const customEvent = event;
        if (Array.isArray(customEvent.detail) && customEvent.detail.length === 2) {
            const [start, end] = customEvent.detail;
            if ((typeof start === 'string' || start === null) &&
                (typeof end === 'string' || end === null)) {
                this.modelo = [start, end];
                console.log('Fechas seleccionadas:', this.modelo);
                // Emitimos el cambio para que el componente padre lo reciba
                this.modeloChange.emit(this.modelo);
            }
            else {
                console.warn('Valores no válidos en el rango:', customEvent.detail);
            }
        }
        else {
            console.warn('Formato inesperado del evento:', event);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: RangeDateZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: RangeDateZ, isStandalone: true, selector: "lib-range-date-z", inputs: { label: "label", config: "config", helpText: "helpText", min: "min", required: "required", ztheme: "ztheme", modelo: "modelo" }, outputs: { modeloChange: "modeloChange" }, ngImport: i0, template: "<z-range-date-input\r\n  [model]=\"modelo\"\r\n  [label]=\"label\"\r\n  [config]=\"config\"\r\n  [help-text]=\"helpText\"\r\n  [required]=\"required\"\r\n  [min]=\"min\"\r\n  (change)=\"onModeloChange($event)\"\r\n>\r\n</z-range-date-input>\r\n", styles: [""] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: RangeDateZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-range-date-z', imports: [], standalone: true, schemas: [CUSTOM_ELEMENTS_SCHEMA], template: "<z-range-date-input\r\n  [model]=\"modelo\"\r\n  [label]=\"label\"\r\n  [config]=\"config\"\r\n  [help-text]=\"helpText\"\r\n  [required]=\"required\"\r\n  [min]=\"min\"\r\n  (change)=\"onModeloChange($event)\"\r\n>\r\n</z-range-date-input>\r\n" }]
        }], propDecorators: { label: [{
                type: Input
            }], config: [{
                type: Input
            }], helpText: [{
                type: Input
            }], min: [{
                type: Input
            }], required: [{
                type: Input
            }], ztheme: [{
                type: Input
            }], modelo: [{
                type: Input
            }], modeloChange: [{
                type: Output
            }] } });

class PictogramZ {
    customStr = '';
    typePictogram = 'growth-mindset';
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: PictogramZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: PictogramZ, isStandalone: true, selector: "lib-pictogram-z", inputs: { customStr: "customStr", typePictogram: "typePictogram" }, ngImport: i0, template: "<za-pictogram [custom-str]=\"customStr\" [pictogram]=\"typePictogram\" />\r\n", styles: [""], dependencies: [{ kind: "component", type: ZaPictogram, selector: "za-pictogram", inputs: ["pictogram", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: PictogramZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-pictogram-z', imports: [ZaPictogram], template: "<za-pictogram [custom-str]=\"customStr\" [pictogram]=\"typePictogram\" />\r\n" }]
        }], propDecorators: { customStr: [{
                type: Input
            }], typePictogram: [{
                type: Input
            }] } });

class TabsZ {
    cdr;
    headers = [];
    data = {};
    templates;
    templateMap = {};
    tabs = [];
    activeKey = '';
    constructor(cdr) {
        this.cdr = cdr;
    }
    ngOnChanges(changes) {
        if (this.headers && this.headers.length) {
            this.initTabs();
            if (this.tabs.length && !this.activeKey) {
                this.activeKey = this.tabs[0].key;
            }
            this.cdr.detectChanges();
        }
    }
    ngAfterContentInit() {
        this.templates.forEach((tpl) => {
            const localName = tpl._declarationTContainer?.localNames?.[0];
            if (localName) {
                this.templateMap[localName] = tpl;
            }
        });
        this.cdr.detectChanges();
    }
    ngAfterViewInit() {
        if (this.headers && this.headers.length) {
            this.initTabs();
            this.cdr.detectChanges();
        }
    }
    initTabs() {
        this.tabs = this.headers.map(header => ({
            key: header.key,
            title: header.title,
            icon: header.icon,
            disabled: header.disabled,
            content: this.data[header.key] || ''
        }));
    }
    onTabChange(event) {
        const index = event.detail - 1;
        const selectedTab = this.tabs[index];
        this.activeKey = selectedTab ? selectedTab.key : this.tabs[0]?.key;
        this.cdr.detectChanges(); // Fuerza render tras cambiar de tab
    }
    get activeTab() {
        return this.tabs.find(t => t.key === this.activeKey);
    }
    get activeTemplate() {
        return this.templateMap[this.activeKey] || null;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TabsZ, deps: [{ token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: TabsZ, isStandalone: true, selector: "lib-tabs-z", inputs: { headers: "headers", data: "data" }, queries: [{ propertyName: "templates", predicate: TemplateRef }], usesOnChanges: true, ngImport: i0, template: "@if (tabs.length > 0) {\r\n  <za-tabs (change)=\"onTabChange($event)\">\r\n    @for (tab of tabs; track tab.key) {\r\n      <option\r\n        [value]=\"tab.title\"\r\n        [attr.icon]=\"tab.icon\"\r\n        [disabled]=\"tab.disabled\"\r\n      >\r\n        {{ tab.content }}\r\n      </option>\r\n    }\r\n  </za-tabs>\r\n}\r\n<div>\r\n  @if (activeTemplate) {\r\n    <ng-container *ngTemplateOutlet=\"activeTemplate\"></ng-container>\r\n  }\r\n</div>", styles: [""], dependencies: [{ kind: "component", type: ZaTabs, selector: "za-tabs", inputs: ["disabled", "tabs", "custom"] }, { kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TabsZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-tabs-z', standalone: true, imports: [ZaTabs, NgTemplateOutlet], template: "@if (tabs.length > 0) {\r\n  <za-tabs (change)=\"onTabChange($event)\">\r\n    @for (tab of tabs; track tab.key) {\r\n      <option\r\n        [value]=\"tab.title\"\r\n        [attr.icon]=\"tab.icon\"\r\n        [disabled]=\"tab.disabled\"\r\n      >\r\n        {{ tab.content }}\r\n      </option>\r\n    }\r\n  </za-tabs>\r\n}\r\n<div>\r\n  @if (activeTemplate) {\r\n    <ng-container *ngTemplateOutlet=\"activeTemplate\"></ng-container>\r\n  }\r\n</div>" }]
        }], ctorParameters: () => [{ type: i0.ChangeDetectorRef }], propDecorators: { headers: [{
                type: Input
            }], data: [{
                type: Input
            }], templates: [{
                type: ContentChildren,
                args: [TemplateRef]
            }] } });

class TextareaZ {
    fb;
    label = '';
    lineType = false;
    name = '';
    model;
    modelChange = new EventEmitter();
    group = new FormGroup({});
    helpText = '';
    valid = false;
    validChange = new EventEmitter();
    required = false;
    disabled = false;
    readonly = false;
    maxLength = false;
    maxNumber = 0;
    elastic = false;
    constructor(fb) {
        this.fb = fb;
    }
    ngOnInit() {
        this.generateGroup();
    }
    generateGroup() {
        if (!this.group) {
            this.group = this.fb.group({});
        }
    }
    ngOnChanges(changes) {
        if (changes.model) {
            setTimeout(() => {
                this.updateControl();
            });
        }
        if (this.group.status == 'INVALID') {
            this.valid = true;
            this.validChange.emit(this.valid);
        }
    }
    generateControl() {
        if (this.group) {
            if (!this.group.get(this.name)) {
                this.name = UtilService.getControlName();
                this.group.addControl(this.name, this.fb.control({}));
            }
            this.group
                .get(this.name)
                ?.setValidators(Validators.compose([
                this.group.get(this.name)?.validator,
                () => this.generateValidation(),
            ]));
            UtilService.updateControlValitor(this.group, this.name);
        }
    }
    generateValidation() {
        if (this.validateRequired()) {
            return { errorRequired: true };
        }
        return null;
    }
    validateRequired() {
        return this.required && !String(this.model || '').trim();
    }
    updateControl() {
        if (this.group && this.group.get(this.name)) {
            this.group.get(this.name)?.setValue(this.model);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TextareaZ, deps: [{ token: i1.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: TextareaZ, isStandalone: true, selector: "lib-textarea-z", inputs: { label: "label", lineType: "lineType", name: "name", model: "model", group: "group", helpText: "helpText", valid: "valid", required: "required", disabled: "disabled", readonly: "readonly", maxLength: "maxLength", maxNumber: "maxNumber", elastic: "elastic" }, outputs: { modelChange: "modelChange", validChange: "validChange" }, usesOnChanges: true, ngImport: i0, template: "<za-textarea\r\n  [id]=\"name\"\r\n  [name]=\"name\"\r\n  [config]=\"lineType? 'line': ''\"\r\n  label=\"{{label}}\"\r\n  [required]=\"required\"\r\n  [disabled]=\"disabled\"\r\n  [invalid]=\"valid\"\r\n  [readonly]=\"readonly\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  help-text=\"{{helpText}}\"\r\n  [elastic]=\"elastic\"\r\n  [attr.max-length]=\"maxLength? maxNumber:''\"\r\n/>\r\n", styles: [""], dependencies: [{ kind: "component", type: ZaTextarea, selector: "za-textarea", inputs: ["max-length", "placeholder", "elastic", "custom"] }, { kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "ngmodule", type: ReactiveFormsModule }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TextareaZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-textarea-z', imports: [ZaTextarea, FormsModule, ReactiveFormsModule], template: "<za-textarea\r\n  [id]=\"name\"\r\n  [name]=\"name\"\r\n  [config]=\"lineType? 'line': ''\"\r\n  label=\"{{label}}\"\r\n  [required]=\"required\"\r\n  [disabled]=\"disabled\"\r\n  [invalid]=\"valid\"\r\n  [readonly]=\"readonly\"\r\n  [(ngModel)]=\"model\"\r\n  (ngModelChange)=\"modelChange.emit(model)\"\r\n  help-text=\"{{helpText}}\"\r\n  [elastic]=\"elastic\"\r\n  [attr.max-length]=\"maxLength? maxNumber:''\"\r\n/>\r\n" }]
        }], ctorParameters: () => [{ type: i1.FormBuilder }], propDecorators: { label: [{
                type: Input
            }], lineType: [{
                type: Input
            }], name: [{
                type: Input
            }], model: [{
                type: Input
            }], modelChange: [{
                type: Output
            }], group: [{
                type: Input
            }], helpText: [{
                type: Input
            }], valid: [{
                type: Input
            }], validChange: [{
                type: Output
            }], required: [{
                type: Input
            }], disabled: [{
                type: Input
            }], readonly: [{
                type: Input
            }], maxLength: [{
                type: Input
            }], maxNumber: [{
                type: Input
            }], elastic: [{
                type: Input
            }] } });

class TooltipZ {
    text = '';
    config;
    customStr = '';
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TooltipZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: TooltipZ, isStandalone: true, selector: "lib-tooltip-z", inputs: { text: "text", config: "config", customStr: "customStr" }, ngImport: i0, template: "<za-tooltip\r\n  [text]=\"text\"\r\n  [config]=\"config\"\r\n  [custom-str]=\"customStr\"\r\n>\r\n  <ng-content></ng-content>\r\n</za-tooltip>\r\n", styles: [""], dependencies: [{ kind: "component", type: ZaTooltip, selector: "za-tooltip", inputs: ["text", "config", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TooltipZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-tooltip-z', imports: [ZaTooltip], template: "<za-tooltip\r\n  [text]=\"text\"\r\n  [config]=\"config\"\r\n  [custom-str]=\"customStr\"\r\n>\r\n  <ng-content></ng-content>\r\n</za-tooltip>\r\n" }]
        }], propDecorators: { text: [{
                type: Input
            }], config: [{
                type: Input
            }], customStr: [{
                type: Input
            }] } });

class LoaderZ {
    customStr = '';
    label = '';
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: LoaderZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: LoaderZ, isStandalone: true, selector: "lib-loader-z", inputs: { customStr: "customStr", label: "label" }, ngImport: i0, template: "<za-loader\r\n  [custom-str]=\"customStr\"\r\n  custom-str=\"color:#06e7a3; size: 50px; stroke: 10px; fill: #06e7a3;\"\r\n>\r\n  {{label}}\r\n</za-loader>", styles: [""], dependencies: [{ kind: "component", type: ZaLoader, selector: "za-loader", inputs: ["small", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: LoaderZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-loader-z', imports: [ZaLoader], template: "<za-loader\r\n  [custom-str]=\"customStr\"\r\n  custom-str=\"color:#06e7a3; size: 50px; stroke: 10px; fill: #06e7a3;\"\r\n>\r\n  {{label}}\r\n</za-loader>" }]
        }], propDecorators: { customStr: [{
                type: Input
            }], label: [{
                type: Input
            }] } });

class TileZ {
    img = '';
    nameButton = '';
    customButtons = true;
    imgLeft = false;
    disabled = false;
    eventClick = new EventEmitter();
    template;
    title;
    content;
    buttons;
    constructor() { }
    ngAfterContentInit() {
        this.template.forEach((item) => {
            switch (item.id) {
                case 'title':
                    this.title = item.template;
                    break;
                case 'content':
                    this.content = item.template;
                    break;
                case 'buttons':
                    this.buttons = item.template;
                    break;
            }
        });
    }
    eventButtonClick(event) {
        this.eventClick.emit(event);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TileZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.14", type: TileZ, isStandalone: true, selector: "lib-tile-z", inputs: { img: "img", nameButton: "nameButton", customButtons: "customButtons", imgLeft: "imgLeft", disabled: "disabled" }, outputs: { eventClick: "eventClick" }, queries: [{ propertyName: "template", predicate: ZTemplate }], ngImport: i0, template: "<div class=\"flex-with\">\r\n  <za-tile custom-str=\"width:100%\" [config]=\"imgLeft? 'left': ''\">\r\n    <img slot=\"image-src\" [src]=\"img\" alt />\r\n    <span slot=\"header\">\r\n      <ng-template [ngTemplateOutlet]=\"title\"></ng-template>\r\n    </span>\r\n\r\n    <div class=\"content\">\r\n      <ng-template [ngTemplateOutlet]=\"content\"></ng-template>\r\n    </div>\r\n\r\n    <div slot=\"actions\">\r\n      @if (customButtons) {\r\n      <ng-template [ngTemplateOutlet]=\"buttons\"></ng-template>\r\n      } @else {\r\n      <lib-button-z\r\n        type=\"secondary:xs\"\r\n        [disabled]=\"disabled\"\r\n        [label]=\"nameButton\"\r\n        (eventClick)=\"eventButtonClick($event)\"\r\n      ></lib-button-z>\r\n      }\r\n    </div>\r\n  </za-tile>\r\n</div>\r\n", styles: ["z-tile{--z-tile--width: 100% !important;width:100%!important;max-width:100%}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1$1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: ZaTile, selector: "za-tile", inputs: ["header", "content", "custom"] }, { kind: "component", type: ButtonZ, selector: "lib-button-z", inputs: ["label", "type", "icon", "iconRight", "disabled", "wide", "loading", "custom_str"], outputs: ["eventClick"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: TileZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-tile-z', standalone: true, imports: [CommonModule, ZaTile, ZTemplate, ButtonZ], schemas: [CUSTOM_ELEMENTS_SCHEMA], template: "<div class=\"flex-with\">\r\n  <za-tile custom-str=\"width:100%\" [config]=\"imgLeft? 'left': ''\">\r\n    <img slot=\"image-src\" [src]=\"img\" alt />\r\n    <span slot=\"header\">\r\n      <ng-template [ngTemplateOutlet]=\"title\"></ng-template>\r\n    </span>\r\n\r\n    <div class=\"content\">\r\n      <ng-template [ngTemplateOutlet]=\"content\"></ng-template>\r\n    </div>\r\n\r\n    <div slot=\"actions\">\r\n      @if (customButtons) {\r\n      <ng-template [ngTemplateOutlet]=\"buttons\"></ng-template>\r\n      } @else {\r\n      <lib-button-z\r\n        type=\"secondary:xs\"\r\n        [disabled]=\"disabled\"\r\n        [label]=\"nameButton\"\r\n        (eventClick)=\"eventButtonClick($event)\"\r\n      ></lib-button-z>\r\n      }\r\n    </div>\r\n  </za-tile>\r\n</div>\r\n", styles: ["z-tile{--z-tile--width: 100% !important;width:100%!important;max-width:100%}\n"] }]
        }], ctorParameters: () => [], propDecorators: { img: [{
                type: Input
            }], nameButton: [{
                type: Input
            }], customButtons: [{
                type: Input
            }], imgLeft: [{
                type: Input
            }], disabled: [{
                type: Input
            }], eventClick: [{
                type: Output
            }], template: [{
                type: ContentChildren,
                args: [ZTemplate]
            }] } });

class ShapeZ {
    size = '50';
    shape = '1';
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: ShapeZ, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.14", type: ShapeZ, isStandalone: true, selector: "lib-shape-z", inputs: { size: "size", shape: "shape" }, ngImport: i0, template: "<za-shape custom-str=\"size: {{size}}px;\" [shape]=\"shape\" />\r\n", styles: [""], dependencies: [{ kind: "component", type: ZaShape, selector: "za-shape", inputs: ["shape", "custom"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.14", ngImport: i0, type: ShapeZ, decorators: [{
            type: Component,
            args: [{ selector: 'lib-shape-z', imports: [ZaShape], standalone: true, schemas: [CUSTOM_ELEMENTS_SCHEMA], template: "<za-shape custom-str=\"size: {{size}}px;\" [shape]=\"shape\" />\r\n" }]
        }], propDecorators: { size: [{
                type: Input
            }], shape: [{
                type: Input
            }] } });

class TableModel {
    id;
    title;
    key;
    actions;
    icon;
    iconClass;
    strong;
    pipe;
    percentSing;
    statuData;
    centerText;
    formatDate;
    colTamanio;
    isName;
    showGroupLabel;
    groupLabel;
    rowspan;
    isSubGroup;
    subGroupIndice;
    subGroupkey;
    isTag;
    iconTag;
    iconRight;
    /**
     *
     * @param id El valor debe ser unico
     * @param title Item que representa el nombre de la columna
     * @param key Valor que representa al nombre del atributo  de la columna
     * @param actions
     * @param icon
     * @param iconClass
     * @param strong
     * @param tag
     * @param tagType
     * @param pipe
     * @param percentSing
     * @param statuData
     * @param centerText
     * @param formatDate
     * @param colTamanio
     * @param isName
     * @param showGroupLabel
     * @param groupLabel
     */
    constructor(id, title, key, actions, icon, iconClass, strong, pipe, percentSing, statuData, centerText, formatDate, colTamanio, isName, showGroupLabel, groupLabel, rowspan, isSubGroup, subGroupIndice, subGroupkey, isTag, iconTag, iconRight) {
        this.id = id;
        this.title = title;
        this.key = key;
        this.actions = actions;
        this.icon = icon;
        this.iconClass = iconClass;
        this.strong = strong;
        this.pipe = pipe;
        this.percentSing = percentSing;
        this.statuData = statuData;
        this.centerText = centerText;
        this.formatDate = formatDate;
        this.colTamanio = colTamanio;
        this.isName = isName;
        this.showGroupLabel = showGroupLabel;
        this.groupLabel = groupLabel;
        this.rowspan = rowspan;
        this.isSubGroup = isSubGroup;
        this.subGroupIndice = subGroupIndice;
        this.subGroupkey = subGroupkey;
        this.isTag = isTag;
        this.iconTag = iconTag;
        this.iconRight = iconRight;
    }
}

/*
 * Public API Surface of lib-zurich
 */

/**
 * Generated bundle index. Do not edit.
 */

export { AccordionZ, AlertZ, AlertZService, AvatarZ, ButtonZ, CardZ, CheckboxZ, FooterZ, InputDateZ, InputPasswordZ, InputSelectZ, InputTextZ, InputTimeZ, LoaderZ, ModalZ, NavigationZ, PictogramZ, RangeDateZ, ShapeZ, StageBannerZ, StageZ, TableModel, TableZ, TabsZ, TagZ, TextareaZ, TileZ, TooltipZ, ZTemplate };
//# sourceMappingURL=zurich-col-lib-zurich.mjs.map
