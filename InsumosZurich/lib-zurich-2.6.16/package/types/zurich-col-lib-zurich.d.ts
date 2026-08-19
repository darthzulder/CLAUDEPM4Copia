import * as i0 from '@angular/core';
import { TemplateRef, AfterContentInit, EventEmitter, QueryList, OnInit, OnChanges, AfterViewInit, ElementRef, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ZAvatar_Props, ZButton_Type, ZButton_Size, ZInput_Type, ZInput_Size } from '@zurich/dev-utils/code';
import { ToAttrChain } from '../../../node_modules/@zurich/dev-utils/dist/typescript/ZDS.types';
import { SizelessIconAttr, PictogramName } from '@zurich/dev-utils/data';
import { ToAttrChain as ToAttrChain$1, ToAttr } from '@zurich/dev-utils/typescript';
import * as rxjs from 'rxjs';
import { ZTooltip_Props } from '@zurich/dev-utils/code/Tooltip';
import { ZShape_Value } from '@zurich/dev-utils/code/Shape.props';

declare class ZTemplate {
    template: TemplateRef<any>;
    id: string;
    constructor(template: TemplateRef<any>, id: string);
    static ɵfac: i0.ɵɵFactoryDeclaration<ZTemplate, [null, { attribute: "id"; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<ZTemplate, "ng-template[libZTemplate]", never, {}, {}, never, never, true, never>;
}

declare class AccordionZ implements AfterContentInit {
    titleLabel: string;
    titleInput: boolean;
    readonlyInput: boolean;
    modelInput: any;
    modelInputChange: EventEmitter<any>;
    groupInput: FormGroup;
    validInput: boolean;
    summaryMargin: string;
    label: string;
    template: QueryList<ZTemplate>;
    content: any;
    constructor();
    ngAfterContentInit(): void;
    changeRead(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<AccordionZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AccordionZ, "lib-accordion-z", never, { "titleLabel": { "alias": "titleLabel"; "required": false; }; "titleInput": { "alias": "titleInput"; "required": false; }; "readonlyInput": { "alias": "readonlyInput"; "required": false; }; "modelInput": { "alias": "modelInput"; "required": false; }; "groupInput": { "alias": "groupInput"; "required": false; }; "validInput": { "alias": "validInput"; "required": false; }; "summaryMargin": { "alias": "summaryMargin"; "required": false; }; "label": { "alias": "label"; "required": false; }; }, { "modelInputChange": "modelInputChange"; }, ["template"], never, true, never>;
}

declare class AvatarZ implements OnInit {
    name: string;
    content: string;
    /**
     * @param {status} status - identifica si el avatar cambia de estado de conectado, valores permitidos [absent, occupied, online, offline]
     */
    status: ZAvatar_Props['status'];
    /**
     * @param {config} config - Permite configurar el componente para identificar la orientación}
     * del nombre.
     */
    config: ZAvatar_Props['config'];
    img: string;
    initials: string;
    constructor();
    ngOnInit(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<AvatarZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AvatarZ, "lib-avatar-z", never, { "name": { "alias": "name"; "required": false; }; "content": { "alias": "content"; "required": false; }; "status": { "alias": "status"; "required": false; }; "config": { "alias": "config"; "required": false; }; "img": { "alias": "img"; "required": false; }; }, {}, never, never, true, never>;
}

declare class ButtonZ implements OnInit {
    label: string;
    type: ToAttrChain<ZButton_Type, ZButton_Size, 'round'>;
    icon: SizelessIconAttr | undefined;
    iconRight: boolean;
    disabled: boolean;
    wide: boolean;
    loading: boolean;
    custom_str: string;
    eventClick: EventEmitter<any>;
    constructor();
    ngOnInit(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ButtonZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ButtonZ, "lib-button-z", never, { "label": { "alias": "label"; "required": false; }; "type": { "alias": "type"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "iconRight": { "alias": "iconRight"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "wide": { "alias": "wide"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "custom_str": { "alias": "custom_str"; "required": false; }; }, { "eventClick": "eventClick"; }, never, never, true, never>;
}

declare class InputTimeZ implements OnInit, OnChanges, AfterViewInit {
    private fb;
    timeInputRef: ElementRef;
    label: string;
    name: string;
    model: any;
    modelChange: EventEmitter<any>;
    group: FormGroup;
    required: boolean;
    valid: boolean;
    validChange: EventEmitter<any>;
    disabled: boolean;
    helpText: string;
    typeInput: ToAttrChain$1<ZInput_Type, ZInput_Size> | undefined;
    readonly: boolean;
    range: [
        `${number}${number}:${number}${number}` | null,
        `${number}${number}:${number}${number}` | null
    ];
    manualValidation: boolean;
    constructor(fb: FormBuilder);
    ngAfterViewInit(): void;
    ngOnInit(): void;
    generateGroup(): void;
    ngOnChanges(changes: SimpleChanges): void;
    updateReadOnly(): void;
    generateControl(): void;
    generateValidation(): {
        errorRequired: boolean;
    } | null;
    validateRequired(): boolean;
    updateControl(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<InputTimeZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<InputTimeZ, "lib-input-time-z", never, { "label": { "alias": "label"; "required": false; }; "name": { "alias": "name"; "required": false; }; "model": { "alias": "model"; "required": false; }; "group": { "alias": "group"; "required": false; }; "required": { "alias": "required"; "required": false; }; "valid": { "alias": "valid"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "helpText": { "alias": "helpText"; "required": false; }; "typeInput": { "alias": "typeInput"; "required": false; }; "readonly": { "alias": "readonly"; "required": false; }; "range": { "alias": "range"; "required": false; }; "manualValidation": { "alias": "manualValidation"; "required": false; }; }, { "modelChange": "modelChange"; "validChange": "validChange"; }, never, never, true, never>;
}

declare class InputTextZ implements OnInit, OnChanges {
    private fb;
    label: string;
    icon: SizelessIconAttr | undefined;
    inputType: string;
    lineType: boolean;
    name: string;
    model: any;
    modelChange: EventEmitter<any>;
    group: FormGroup;
    helpText: string;
    valid: boolean;
    validChange: EventEmitter<any>;
    required: boolean;
    readonly: boolean;
    maxLength: boolean;
    maxNumber: number;
    manualValidation: boolean;
    constructor(fb: FormBuilder);
    ngOnInit(): void;
    generateGroup(): void;
    ngOnChanges(changes: any): void;
    generateControl(): void;
    generateValidation(): {
        errorRequired: boolean;
    } | null;
    validateRequired(): boolean;
    updateControl(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<InputTextZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<InputTextZ, "lib-input-text-z", never, { "label": { "alias": "label"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "inputType": { "alias": "inputType"; "required": false; }; "lineType": { "alias": "lineType"; "required": false; }; "name": { "alias": "name"; "required": false; }; "model": { "alias": "model"; "required": false; }; "group": { "alias": "group"; "required": false; }; "helpText": { "alias": "helpText"; "required": false; }; "valid": { "alias": "valid"; "required": false; }; "required": { "alias": "required"; "required": false; }; "readonly": { "alias": "readonly"; "required": false; }; "maxLength": { "alias": "maxLength"; "required": false; }; "maxNumber": { "alias": "maxNumber"; "required": false; }; "manualValidation": { "alias": "manualValidation"; "required": false; }; }, { "modelChange": "modelChange"; "validChange": "validChange"; }, never, never, true, never>;
}

declare class InputDateZ implements OnInit, OnChanges, AfterViewInit {
    private fb;
    dateInputRef: ElementRef;
    label: string;
    inputType: string;
    name: string;
    model: any;
    lineType: ToAttrChain$1<ZInput_Type, ZInput_Size> | undefined;
    modelChange: EventEmitter<any>;
    group: FormGroup;
    valid: boolean;
    validChange: EventEmitter<any>;
    disabled: boolean;
    readonly: boolean;
    max: string;
    min: string;
    required: boolean;
    manualValidation: boolean;
    constructor(fb: FormBuilder);
    ngAfterViewInit(): void;
    ngOnInit(): void;
    generateGroup(): void;
    ngOnChanges(changes: SimpleChanges): void;
    updateInvalidState(): void;
    generateControl(): void;
    generateValidation(): {
        errorRequired: boolean;
    } | null;
    validateRequired(): boolean;
    updateControl(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<InputDateZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<InputDateZ, "lib-input-date-z", never, { "label": { "alias": "label"; "required": false; }; "inputType": { "alias": "inputType"; "required": false; }; "name": { "alias": "name"; "required": false; }; "model": { "alias": "model"; "required": false; }; "lineType": { "alias": "lineType"; "required": false; }; "group": { "alias": "group"; "required": false; }; "valid": { "alias": "valid"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "readonly": { "alias": "readonly"; "required": false; }; "max": { "alias": "max"; "required": false; }; "min": { "alias": "min"; "required": false; }; "required": { "alias": "required"; "required": false; }; "manualValidation": { "alias": "manualValidation"; "required": false; }; }, { "modelChange": "modelChange"; "validChange": "validChange"; }, never, never, true, never>;
}

declare class InputPasswordZ implements OnInit, OnChanges {
    private fb;
    name: string;
    model: any;
    modelChange: EventEmitter<any>;
    label: string;
    lineType: boolean;
    helpText: string;
    invalid: boolean;
    invalidChange: EventEmitter<any>;
    required: boolean;
    disabled: boolean;
    readonly: boolean;
    group: FormGroup;
    constructor(fb: FormBuilder);
    ngOnInit(): void;
    generateGroup(): void;
    ngOnChanges(changes: any): void;
    generateControl(): void;
    generateValidation(): {
        errorRequired: boolean;
    } | null;
    validateRequired(): boolean;
    updateControl(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<InputPasswordZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<InputPasswordZ, "lib-input-password-z", never, { "name": { "alias": "name"; "required": false; }; "model": { "alias": "model"; "required": false; }; "label": { "alias": "label"; "required": false; }; "lineType": { "alias": "lineType"; "required": false; }; "helpText": { "alias": "helpText"; "required": false; }; "invalid": { "alias": "invalid"; "required": false; }; "required": { "alias": "required"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "readonly": { "alias": "readonly"; "required": false; }; "group": { "alias": "group"; "required": false; }; }, { "modelChange": "modelChange"; "invalidChange": "invalidChange"; }, never, never, true, never>;
}

declare class SelectModel {
    value?: any | undefined;
    description?: string | undefined;
    disabled?: boolean | undefined;
    constructor(value?: any | undefined, description?: string | undefined, disabled?: boolean | undefined);
}

declare class InputSelectZ implements OnInit, OnChanges {
    private fb;
    selectInputRef: ElementRef;
    name: string;
    options: Array<SelectModel>;
    model: any;
    modelChange: EventEmitter<any>;
    multiSelect: boolean;
    group: FormGroup;
    label: string;
    typeLine: boolean;
    required: boolean;
    invalid: boolean;
    invalidChange: EventEmitter<any>;
    disable: boolean;
    iconType: boolean;
    icon: string;
    helpText: string;
    manualValidation: boolean;
    constructor(fb: FormBuilder);
    ngOnInit(): void;
    generateGroup(): void;
    ngOnChanges(changes: any): void;
    generateControl(): void;
    generateValidation(): {
        errorRequired: boolean;
    } | null;
    validateRequired(): boolean;
    updateControl(): void;
    updateInvalidState(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<InputSelectZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<InputSelectZ, "lib-input-select-z", never, { "name": { "alias": "name"; "required": false; }; "options": { "alias": "options"; "required": false; }; "model": { "alias": "model"; "required": false; }; "multiSelect": { "alias": "multiSelect"; "required": false; }; "group": { "alias": "group"; "required": false; }; "label": { "alias": "label"; "required": false; }; "typeLine": { "alias": "typeLine"; "required": false; }; "required": { "alias": "required"; "required": false; }; "invalid": { "alias": "invalid"; "required": false; }; "disable": { "alias": "disable"; "required": false; }; "iconType": { "alias": "iconType"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "helpText": { "alias": "helpText"; "required": false; }; "manualValidation": { "alias": "manualValidation"; "required": false; }; }, { "modelChange": "modelChange"; "invalidChange": "invalidChange"; }, never, never, true, never>;
}

interface NavigationRoute {
    text: string;
    icon?: any;
    href?: string;
}

declare class NavigationZ {
    routes?: NavigationRoute[];
    social?: {
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        instagram?: string;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<NavigationZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<NavigationZ, "lib-navigation-z", never, { "routes": { "alias": "routes"; "required": false; }; "social": { "alias": "social"; "required": false; }; }, {}, never, never, true, never>;
}

declare class FooterZ {
    static ɵfac: i0.ɵɵFactoryDeclaration<FooterZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<FooterZ, "lib-footer-z", never, {}, {}, never, never, true, never>;
}

declare class TableModel {
    id?: boolean | undefined;
    title?: string | undefined;
    key?: string | undefined;
    actions?: boolean | undefined;
    icon?: boolean | undefined;
    iconClass?: string | undefined;
    strong?: boolean | undefined;
    pipe?: string | undefined;
    percentSing?: boolean | undefined;
    statuData?: boolean | undefined;
    centerText?: boolean | undefined;
    formatDate?: string | undefined;
    colTamanio?: string | undefined;
    isName?: boolean | undefined;
    showGroupLabel?: boolean | undefined;
    groupLabel?: boolean | undefined;
    rowspan?: number | undefined;
    isSubGroup?: boolean | undefined;
    subGroupIndice?: number | undefined;
    subGroupkey?: string | undefined;
    isTag?: boolean | undefined;
    iconTag?: SizelessIconAttr | undefined;
    iconRight?: boolean | undefined;
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
    constructor(id?: boolean | undefined, title?: string | undefined, key?: string | undefined, actions?: boolean | undefined, icon?: boolean | undefined, iconClass?: string | undefined, strong?: boolean | undefined, pipe?: string | undefined, percentSing?: boolean | undefined, statuData?: boolean | undefined, centerText?: boolean | undefined, formatDate?: string | undefined, colTamanio?: string | undefined, isName?: boolean | undefined, showGroupLabel?: boolean | undefined, groupLabel?: boolean | undefined, rowspan?: number | undefined, isSubGroup?: boolean | undefined, subGroupIndice?: number | undefined, subGroupkey?: string | undefined, isTag?: boolean | undefined, iconTag?: SizelessIconAttr | undefined, iconRight?: boolean | undefined);
}

type RowWithGroup<T> = T & {
    [prop: string]: any;
    _groupValue?: string | number;
    _rowspan?: number;
    _showGroup?: boolean;
};
declare class TableZ implements OnInit, AfterContentInit, AfterViewInit, OnChanges {
    private platformId;
    headers: Array<TableModel>;
    data: Array<any>;
    typeStyle: string;
    pages: number;
    disablePage: boolean;
    showGenericStart: boolean;
    genericStartName: string;
    showGenericEnd: boolean;
    generciEndName: string;
    hideHeader: boolean;
    eventChangePages: EventEmitter<any>;
    tableCheck: boolean;
    selectedItemsList: EventEmitter<any>;
    template: QueryList<ZTemplate>;
    checkAll: ElementRef;
    genericStartT: any;
    genericEndT: any;
    page: number;
    selectedItems: Array<any>;
    selectAllItems: boolean;
    checkAllItem: any;
    columnTemplates: {
        [key: string]: TemplateRef<any>;
    };
    viewData: Array<RowWithGroup<any>>;
    TABLE_CONSTANTS: {
        TAG_ERROR: string[];
        TAG_WARNING: string[];
        TAG_OK: string[];
        TAG_ARCHIVATE: string[];
    };
    constructor(platformId: Object);
    ngOnChanges(changes: any): void;
    ngAfterViewInit(): void;
    ngAfterContentInit(): void;
    ngOnInit(): void;
    private orderData;
    private buildGroupingMeta;
    eventChangePage(event: any): void;
    simpleCheck(event: any, dt: any, index: any): void;
    selectAll(event: any): void;
    validIsCheck(index: any): void;
    getIdItem(): any;
    validColorByCoincidencia(status: any): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<TableZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TableZ, "lib-table-z", never, { "headers": { "alias": "headers"; "required": false; }; "data": { "alias": "data"; "required": false; }; "typeStyle": { "alias": "typeStyle"; "required": false; }; "pages": { "alias": "pages"; "required": false; }; "disablePage": { "alias": "disablePage"; "required": false; }; "showGenericStart": { "alias": "showGenericStart"; "required": false; }; "genericStartName": { "alias": "genericStartName"; "required": false; }; "showGenericEnd": { "alias": "showGenericEnd"; "required": false; }; "generciEndName": { "alias": "generciEndName"; "required": false; }; "hideHeader": { "alias": "hideHeader"; "required": false; }; "tableCheck": { "alias": "tableCheck"; "required": false; }; }, { "eventChangePages": "eventChangePages"; "selectedItemsList": "selectedItemsList"; }, ["template"], never, true, never>;
}

declare class CardZ implements OnInit, AfterContentInit {
    showHeader: boolean;
    showFooter: boolean;
    bgColor: string;
    colorTxt: string;
    template: QueryList<ZTemplate>;
    header: any;
    content: any;
    footer: any;
    customStr: string | undefined;
    constructor();
    ngAfterContentInit(): void;
    ngOnInit(): void;
    buildCustomStr(): string | undefined;
    static ɵfac: i0.ɵɵFactoryDeclaration<CardZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CardZ, "lib-card-z", never, { "showHeader": { "alias": "showHeader"; "required": false; }; "showFooter": { "alias": "showFooter"; "required": false; }; "bgColor": { "alias": "bgColor"; "required": false; }; "colorTxt": { "alias": "colorTxt"; "required": false; }; }, {}, ["template"], never, true, never>;
}

declare class ModalZ implements OnInit, AfterContentInit {
    open: boolean;
    close: EventEmitter<any>;
    tamanio: string;
    ShowBackdrop: boolean;
    template: QueryList<ZTemplate>;
    title: any;
    content: any;
    buttons: any;
    constructor();
    ngAfterContentInit(): void;
    ngOnInit(): void;
    change(event: any): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ModalZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ModalZ, "lib-modal-z", never, { "open": { "alias": "open"; "required": false; }; "tamanio": { "alias": "tamanio"; "required": false; }; "ShowBackdrop": { "alias": "ShowBackdrop"; "required": false; }; }, { "close": "close"; }, ["template"], never, true, never>;
}

declare class CheckboxZ implements OnInit, OnChanges {
    private fb;
    name: string;
    label: string;
    group: FormGroup;
    model: any;
    modelChange: EventEmitter<any>;
    required: boolean;
    disabled: boolean;
    valid: boolean;
    validChange: EventEmitter<any>;
    helpText: string;
    showHelpText: boolean;
    eventChange: EventEmitter<any>;
    constructor(fb: FormBuilder);
    ngOnInit(): void;
    ngOnChanges(changes: any): void;
    generateGroup(): void;
    generateControl(): void;
    generateValidation(): {
        errorRequired: boolean;
    } | null;
    validRequired(): boolean;
    updateControl(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CheckboxZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CheckboxZ, "lib-checkbox-z", never, { "name": { "alias": "name"; "required": false; }; "label": { "alias": "label"; "required": false; }; "group": { "alias": "group"; "required": false; }; "model": { "alias": "model"; "required": false; }; "required": { "alias": "required"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "valid": { "alias": "valid"; "required": false; }; "helpText": { "alias": "helpText"; "required": false; }; "showHelpText": { "alias": "showHelpText"; "required": false; }; }, { "modelChange": "modelChange"; "validChange": "validChange"; "eventChange": "eventChange"; }, never, never, true, never>;
}

declare class AlertZData {
    id?: string;
    message?: string;
    config: 'info' | 'positive' | 'negative' | 'alert';
    title?: string;
    dismissible?: boolean;
    onShowAnimation?: string;
    onCloseAnimation?: string;
    autoCloseAfter?: number;
    widthPercent?: 25 | 50 | 75 | 100;
    constructor(init?: Partial<AlertZData>);
}

declare class AlertZService {
    private alertsSubject;
    alerts$: rxjs.Observable<AlertZData[]>;
    private genId;
    /** Métodos rápidos para mostrar alertas */
    info(message: string, opts?: Partial<AlertZData>): void;
    positive(message: string, opts?: Partial<AlertZData>): void;
    negative(message: string, opts?: Partial<AlertZData>): void;
    alert(message: string, opts?: Partial<AlertZData>): void;
    /** Método genérico */
    show(alert: AlertZData): void;
    /** Remover alerta (por id) */
    remove(id: string): void;
    /** Limpiar todas */
    clear(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<AlertZService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<AlertZService>;
}

declare class AlertZ implements OnDestroy {
    private alertService;
    private readonly cdr;
    alerts: AlertZData[];
    private autoCloseTimers;
    private closing;
    private readonly sub;
    private readonly animationDurations;
    constructor(alertService: AlertZService, cdr: ChangeDetectorRef);
    ngOnDestroy(): void;
    close(id?: string): void;
    /** Clases por ítem para show/close */
    getItemClasses(alert: AlertZData): {
        [klass: string]: boolean;
    };
    private scheduleAutoCloseForNew;
    private cleanupTimersForRemoved;
    private getAnimationDuration;
    static ɵfac: i0.ɵɵFactoryDeclaration<AlertZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AlertZ, "lib-alert-z", never, {}, {}, never, never, true, never>;
}

declare class StageZ implements OnDestroy {
    private readonly cdr;
    customStr: string;
    imageSrc: string;
    header: string;
    contentContext: Record<string, any>;
    contentTpl?: TemplateRef<any>;
    private templatesSub?;
    constructor(cdr: ChangeDetectorRef);
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<StageZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<StageZ, "lib-stage-z", never, { "customStr": { "alias": "custom-str"; "required": false; }; "imageSrc": { "alias": "image-src"; "required": false; }; "header": { "alias": "header"; "required": false; }; "contentContext": { "alias": "contentContext"; "required": false; }; }, {}, never, ["*"], true, never>;
}

declare class StageBannerZ {
    category: string;
    customStr: string;
    addImage: boolean;
    imageSrc: string;
    content: string;
    config: string;
    shape: string;
    roundedBanner: boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<StageBannerZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<StageBannerZ, "lib-stage-banner-z", never, { "category": { "alias": "category"; "required": false; }; "customStr": { "alias": "customStr"; "required": false; }; "addImage": { "alias": "addImage"; "required": false; }; "imageSrc": { "alias": "imageSrc"; "required": false; }; "content": { "alias": "content"; "required": false; }; "config": { "alias": "config"; "required": false; }; "shape": { "alias": "shape"; "required": false; }; "roundedBanner": { "alias": "roundedBanner"; "required": false; }; }, {}, never, never, true, never>;
}

declare class RangeDateZ {
    label: string;
    config: string;
    helpText: string;
    min: string;
    required: boolean;
    ztheme: string;
    modelo: [string | null, string | null];
    modeloChange: EventEmitter<[string | null, string | null]>;
    onModeloChange(event: Event): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<RangeDateZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<RangeDateZ, "lib-range-date-z", never, { "label": { "alias": "label"; "required": false; }; "config": { "alias": "config"; "required": false; }; "helpText": { "alias": "helpText"; "required": false; }; "min": { "alias": "min"; "required": false; }; "required": { "alias": "required"; "required": false; }; "ztheme": { "alias": "ztheme"; "required": false; }; "modelo": { "alias": "modelo"; "required": false; }; }, { "modeloChange": "modeloChange"; }, never, never, true, never>;
}

declare class PictogramZ {
    customStr: string;
    typePictogram: ToAttr<PictogramName, 'dark'> | undefined;
    static ɵfac: i0.ɵɵFactoryDeclaration<PictogramZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PictogramZ, "lib-pictogram-z", never, { "customStr": { "alias": "customStr"; "required": false; }; "typePictogram": { "alias": "typePictogram"; "required": false; }; }, {}, never, never, true, never>;
}

declare class TabsZ implements OnChanges, AfterContentInit, AfterViewInit {
    private cdr;
    headers: Array<{
        title: string;
        key: string;
        icon?: string;
        disabled?: boolean;
    }>;
    data: {
        [key: string]: string;
    };
    templates: QueryList<TemplateRef<any>>;
    templateMap: {
        [key: string]: TemplateRef<any>;
    };
    tabs: Array<{
        key: string;
        title: string;
        icon?: string;
        disabled?: boolean;
        content: string;
    }>;
    activeKey: string;
    constructor(cdr: ChangeDetectorRef);
    ngOnChanges(changes: SimpleChanges): void;
    ngAfterContentInit(): void;
    ngAfterViewInit(): void;
    private initTabs;
    onTabChange(event: CustomEvent): void;
    get activeTab(): any;
    get activeTemplate(): TemplateRef<any> | null;
    static ɵfac: i0.ɵɵFactoryDeclaration<TabsZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TabsZ, "lib-tabs-z", never, { "headers": { "alias": "headers"; "required": false; }; "data": { "alias": "data"; "required": false; }; }, {}, ["templates"], never, true, never>;
}

declare class TagZ {
    label: string;
    colorTag: string;
    icon: SizelessIconAttr | undefined;
    iconRight: boolean | undefined;
    fill: 'moss' | 'azure' | 'teal' | 'lilac' | 'candy' | 'peach' | 'mint' | 'lime' | 'lemon' | 'powder-pink' | undefined;
    static ɵfac: i0.ɵɵFactoryDeclaration<TagZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TagZ, "lib-tag-z", never, { "label": { "alias": "label"; "required": false; }; "colorTag": { "alias": "colorTag"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "iconRight": { "alias": "iconRight"; "required": false; }; "fill": { "alias": "fill"; "required": false; }; }, {}, never, never, true, never>;
}

declare class TextareaZ implements OnInit, OnChanges {
    private fb;
    label: string;
    lineType: boolean;
    name: string;
    model: any;
    modelChange: EventEmitter<any>;
    group: FormGroup;
    helpText: string;
    valid: boolean;
    validChange: EventEmitter<any>;
    required: boolean;
    disabled: boolean;
    readonly: boolean;
    maxLength: boolean;
    maxNumber: number;
    elastic: boolean;
    constructor(fb: FormBuilder);
    ngOnInit(): void;
    generateGroup(): void;
    ngOnChanges(changes: any): void;
    generateControl(): void;
    generateValidation(): {
        errorRequired: boolean;
    } | null;
    validateRequired(): boolean;
    updateControl(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<TextareaZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TextareaZ, "lib-textarea-z", never, { "label": { "alias": "label"; "required": false; }; "lineType": { "alias": "lineType"; "required": false; }; "name": { "alias": "name"; "required": false; }; "model": { "alias": "model"; "required": false; }; "group": { "alias": "group"; "required": false; }; "helpText": { "alias": "helpText"; "required": false; }; "valid": { "alias": "valid"; "required": false; }; "required": { "alias": "required"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "readonly": { "alias": "readonly"; "required": false; }; "maxLength": { "alias": "maxLength"; "required": false; }; "maxNumber": { "alias": "maxNumber"; "required": false; }; "elastic": { "alias": "elastic"; "required": false; }; }, { "modelChange": "modelChange"; "validChange": "validChange"; }, never, never, true, never>;
}

declare class TooltipZ {
    text: string;
    config?: ZTooltip_Props['config'];
    customStr: string;
    static ɵfac: i0.ɵɵFactoryDeclaration<TooltipZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TooltipZ, "lib-tooltip-z", never, { "text": { "alias": "text"; "required": false; }; "config": { "alias": "config"; "required": false; }; "customStr": { "alias": "customStr"; "required": false; }; }, {}, never, ["*"], true, never>;
}

declare class LoaderZ {
    customStr: string;
    label: string;
    static ɵfac: i0.ɵɵFactoryDeclaration<LoaderZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<LoaderZ, "lib-loader-z", never, { "customStr": { "alias": "customStr"; "required": false; }; "label": { "alias": "label"; "required": false; }; }, {}, never, never, true, never>;
}

declare class TileZ implements AfterContentInit {
    img: string;
    nameButton: string;
    customButtons: boolean;
    imgLeft: boolean;
    disabled: boolean;
    eventClick: EventEmitter<any>;
    template: QueryList<ZTemplate>;
    title: any;
    content: any;
    buttons: any;
    constructor();
    ngAfterContentInit(): void;
    eventButtonClick(event: any): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<TileZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TileZ, "lib-tile-z", never, { "img": { "alias": "img"; "required": false; }; "nameButton": { "alias": "nameButton"; "required": false; }; "customButtons": { "alias": "customButtons"; "required": false; }; "imgLeft": { "alias": "imgLeft"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; }, { "eventClick": "eventClick"; }, ["template"], never, true, never>;
}

declare class ShapeZ {
    size: string;
    shape: ZShape_Value;
    static ɵfac: i0.ɵɵFactoryDeclaration<ShapeZ, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ShapeZ, "lib-shape-z", never, { "size": { "alias": "size"; "required": false; }; "shape": { "alias": "shape"; "required": false; }; }, {}, never, never, true, never>;
}

export { AccordionZ, AlertZ, AlertZService, AvatarZ, ButtonZ, CardZ, CheckboxZ, FooterZ, InputDateZ, InputPasswordZ, InputSelectZ, InputTextZ, InputTimeZ, LoaderZ, ModalZ, NavigationZ, PictogramZ, RangeDateZ, ShapeZ, StageBannerZ, StageZ, TableModel, TableZ, TabsZ, TagZ, TextareaZ, TileZ, TooltipZ, ZTemplate };
