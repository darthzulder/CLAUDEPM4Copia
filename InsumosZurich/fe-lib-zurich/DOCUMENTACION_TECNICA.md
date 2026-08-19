# Documentacion Tecnica - Libreria fe-lib-zurich

## Tabla de Contenidos

1. [Introduccion](#introduccion)
2. [Instalacion y Configuracion](#instalacion-y-configuracion)
3. [Arquitectura de la Libreria](#arquitectura-de-la-libreria)
4. [Componentes de Entrada de Datos](#componentes-de-entrada-de-datos)
   - [InputTextZ](#inputtextz)
   - [InputPasswordZ](#inputpasswordz)
   - [InputDateZ](#inputdatez)
   - [InputTimeZ](#inputtimez)
   - [InputSelectZ](#inputselectz)
   - [CheckboxZ](#checkboxz)
   - [TextareaZ](#textareaz)
   - [RangeDateZ](#rangedatez)
5. [Componentes de Layout](#componentes-de-layout)
   - [AccordionZ](#accordionz)
   - [CardZ](#cardz)
   - [ModalZ](#modalz)
   - [TileZ](#tilez)
   - [TabsZ](#tabsz)
6. [Componentes de Navegacion](#componentes-de-navegacion)
   - [NavigationZ](#navigationz)
   - [FooterZ](#footerz)
7. [Componentes de Accion](#componentes-de-accion)
   - [ButtonZ](#buttonz)
8. [Componentes Visuales](#componentes-visuales)
   - [AlertZ](#alertz)
   - [AvatarZ](#avatarz)
   - [TagZ](#tagz)
   - [TooltipZ](#tooltipz)
   - [LoaderZ](#loaderz)
   - [PictogramZ](#pictogramz)
   - [ShapeZ](#shapez)
   - [StageZ](#stagez)
   - [StageBannerZ](#stagebanner)
9. [Componentes de Datos](#componentes-de-datos)
   - [TableZ](#tablez)
10. [Servicios](#servicios)
    - [AlertZService](#alertzservice)
    - [UtilService](#utilservice)
11. [Modelos](#modelos)
    - [TableModel](#tablemodel)
    - [AlertZData](#alertzdata)
    - [SelectModel](#selectmodel)
    - [NavigationRoute](#navigationroute)
12. [Directivas](#directivas)
    - [ZTemplate](#ztemplate)
13. [Pipes](#pipes)
    - [DynamicPipe](#dynamicpipe)
14. [Constantes](#constantes)
15. [Buenas Practicas](#buenas-practicas)

---

## Introduccion

La libreria **fe-lib-zurich** es una coleccion de componentes Angular reutilizables construidos sobre el sistema de diseno de Zurich (`@zurich/angular-components`). Esta libreria proporciona una capa de abstraccion que simplifica el uso de los componentes base de Zurich, agregando funcionalidades adicionales como validacion de formularios reactivos, manejo de estados y personalizacion avanzada.

### Caracteristicas Principales

- **Componentes Standalone**: Todos los componentes utilizan la arquitectura standalone de Angular 17+
- **Formularios Reactivos**: Integracion nativa con `FormGroup` y validaciones personalizadas
- **Two-way Data Binding**: Soporte para `[(model)]` en componentes de entrada
- **Tematizacion**: Compatibilidad con el sistema de diseno de Zurich
- **Tipado Fuerte**: Uso de TypeScript con tipos de `@zurich/dev-utils`

### Version de Angular

La libreria esta desarrollada para **Angular 20+** y requiere las siguientes dependencias peer:

```json
{
  "@zurich/angular-components": ">=x.x.x",
  "@zurich/dev-utils": ">=x.x.x"
}
```

---

## Instalacion y Configuracion

### 1. Instalacion

```bash
npm install lib-zurich
```

### 2. Importacion de Componentes

Los componentes son standalone, por lo que pueden importarse directamente donde se necesiten:

```typescript
import { InputTextZ, ButtonZ, TableZ } from 'lib-zurich';

@Component({
  standalone: true,
  imports: [InputTextZ, ButtonZ, TableZ],
  // ...
})
export class MiComponente {}
```

### 3. Configuracion de Estilos

Asegurese de incluir los estilos de Zurich en su aplicacion:

```scss
@import '@zurich/design-tokens/styles';
```

---

## Arquitectura de la Libreria

```
projects/lib-zurich/src/
├── lib/
│   ├── components/          # Componentes visuales
│   │   ├── accordion-z/
│   │   ├── alert-z/
│   │   ├── avatar-z/
│   │   ├── button-z/
│   │   ├── card-z/
│   │   ├── checkbox-z/
│   │   ├── footer-z/
│   │   ├── input-date-z/
│   │   ├── input-password-z/
│   │   ├── input-select-z/
│   │   ├── input-text-z/
│   │   ├── input-time-z/
│   │   ├── loader-z/
│   │   ├── modal-z/
│   │   ├── navigation-z/
│   │   ├── pictogram-z/
│   │   ├── range-date-z/
│   │   ├── shape-z/
│   │   ├── stage-banner-z/
│   │   ├── stage-z/
│   │   ├── table-z/
│   │   ├── tabs-z/
│   │   ├── tag-z/
│   │   ├── textarea-z/
│   │   ├── tile-z/
│   │   └── tooltip-z/
│   ├── core/
│   │   ├── constants/       # Constantes globales
│   │   ├── pipes/           # Pipes personalizados
│   │   └── utils/
│   │       ├── models/      # Modelos de datos
│   │       └── services/    # Servicios inyectables
│   └── derective/           # Directivas personalizadas
└── public-api.ts            # Exports publicos
```

---

## Componentes de Entrada de Datos

### InputTextZ

Componente para entrada de texto con soporte para validacion reactiva.

**Selector:** `lib-input-text-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Etiqueta del campo |
| `icon` | `SizelessIconAttr` | `undefined` | Icono a mostrar |
| `inputType` | `string` | `'text'` | Tipo de input HTML |
| `lineType` | `boolean` | `false` | Estilo de linea (sin borde completo) |
| `name` | `string` | `''` | Nombre del control de formulario |
| `model` | `any` | - | Valor del campo (two-way binding) |
| `group` | `FormGroup` | `new FormGroup({})` | Grupo de formulario padre |
| `helpText` | `string` | `''` | Texto de ayuda |
| `valid` | `boolean` | `false` | Estado de validacion (two-way binding) |
| `required` | `boolean` | `false` | Campo requerido |
| `readonly` | `boolean` | `false` | Campo de solo lectura |
| `maxLength` | `boolean` | `false` | Activar limite de caracteres |
| `maxNumber` | `number` | `0` | Numero maximo de caracteres |
| `manualValidation` | `boolean` | `false` | Desactivar validacion automatica |

#### Propiedades de Salida (@Output)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `modelChange` | `EventEmitter<any>` | Emite cuando cambia el valor |
| `validChange` | `EventEmitter<any>` | Emite cuando cambia el estado de validacion |

#### Ejemplo de Uso

```html
<!-- Uso basico -->
<lib-input-text-z
  label="Nombre completo"
  [(model)]="nombre"
  [required]="true"
  [group]="formulario">
</lib-input-text-z>

<!-- Con icono y texto de ayuda -->
<lib-input-text-z
  label="Correo electronico"
  icon="mail:line"
  inputType="email"
  [(model)]="email"
  helpText="Ingrese un correo valido"
  [required]="true"
  [group]="formulario">
</lib-input-text-z>

<!-- Estilo linea -->
<lib-input-text-z
  label="Buscar"
  [lineType]="true"
  [(model)]="busqueda">
</lib-input-text-z>
```

```typescript
// En el componente
import { FormBuilder, FormGroup } from '@angular/forms';

export class MiComponente {
  formulario: FormGroup;
  nombre: string = '';
  email: string = '';

  constructor(private fb: FormBuilder) {
    this.formulario = this.fb.group({});
  }
}
```

---

### InputPasswordZ

Componente para entrada de contrasenas con toggle de visibilidad.

**Selector:** `lib-input-password-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `name` | `string` | `''` | Nombre del control |
| `model` | `any` | - | Valor del campo (two-way binding) |
| `label` | `string` | `''` | Etiqueta del campo |
| `lineType` | `boolean` | `false` | Estilo de linea |
| `helpText` | `string` | `''` | Texto de ayuda |
| `invalid` | `boolean` | `false` | Estado de error (two-way binding) |
| `required` | `boolean` | `false` | Campo requerido |
| `disabled` | `boolean` | `false` | Campo deshabilitado |
| `readonly` | `boolean` | `false` | Campo de solo lectura |
| `group` | `FormGroup` | `new FormGroup({})` | Grupo de formulario |

#### Propiedades de Salida (@Output)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `modelChange` | `EventEmitter<any>` | Emite cuando cambia el valor |
| `invalidChange` | `EventEmitter<any>` | Emite cuando cambia el estado de error |

#### Ejemplo de Uso

```html
<lib-input-password-z
  label="Contrasena"
  [(model)]="password"
  [(invalid)]="passwordInvalid"
  [required]="true"
  helpText="Minimo 8 caracteres"
  [group]="loginForm">
</lib-input-password-z>
```

---

### InputDateZ

Componente para seleccion de fechas.

**Selector:** `lib-input-date-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Etiqueta del campo |
| `inputType` | `string` | `'date'` | Tipo de input |
| `name` | `string` | `''` | Nombre del control |
| `model` | `any` | - | Valor del campo (two-way binding) |
| `lineType` | `ToAttrChain<ZInput_Type, ZInput_Size>` | `undefined` | Tipo de linea |
| `group` | `FormGroup` | `new FormGroup({})` | Grupo de formulario |
| `valid` | `boolean` | `false` | Estado de validacion (two-way binding) |
| `disabled` | `boolean` | `false` | Campo deshabilitado |
| `readonly` | `boolean` | `false` | Campo de solo lectura |
| `max` | `string` | `''` | Fecha maxima permitida (YYYY-MM-DD) |
| `min` | `string` | `''` | Fecha minima permitida (YYYY-MM-DD) |
| `required` | `boolean` | `false` | Campo requerido |
| `manualValidation` | `boolean` | `false` | Desactivar validacion automatica |

#### Ejemplo de Uso

```html
<lib-input-date-z
  label="Fecha de nacimiento"
  [(model)]="fechaNacimiento"
  [required]="true"
  max="2006-01-01"
  min="1920-01-01"
  [group]="formulario">
</lib-input-date-z>
```

---

### InputTimeZ

Componente para seleccion de hora.

**Selector:** `lib-input-time-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Etiqueta del campo |
| `name` | `string` | `''` | Nombre del control |
| `model` | `any` | - | Valor del campo (two-way binding) |
| `group` | `FormGroup` | `new FormGroup({})` | Grupo de formulario |
| `required` | `boolean` | `false` | Campo requerido |
| `valid` | `boolean` | `false` | Estado de validacion (two-way binding) |
| `disabled` | `boolean` | `false` | Campo deshabilitado |
| `helpText` | `string` | `'Ingrese un valor'` | Texto de ayuda |
| `typeInput` | `ToAttrChain<ZInput_Type, ZInput_Size>` | `''` | Tipo de input |
| `readonly` | `boolean` | `false` | Campo de solo lectura |
| `range` | `[string \| null, string \| null]` | `['00:00', '23:00']` | Rango de horas permitido |
| `manualValidation` | `boolean` | `false` | Desactivar validacion automatica |

#### Ejemplo de Uso

```html
<lib-input-time-z
  label="Hora de cita"
  [(model)]="horaCita"
  [required]="true"
  [range]="['08:00', '18:00']"
  helpText="Horario de atencion: 8:00 AM - 6:00 PM"
  [group]="formulario">
</lib-input-time-z>
```

---

### InputSelectZ

Componente de lista desplegable con soporte para seleccion simple y multiple.

**Selector:** `lib-input-select-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `name` | `string` | `''` | Nombre del control |
| `options` | `Array<SelectModel>` | `[]` | Opciones de la lista |
| `model` | `any` | - | Valor seleccionado (two-way binding) |
| `multiSelect` | `boolean` | `false` | Habilitar seleccion multiple |
| `group` | `FormGroup` | `new FormGroup({})` | Grupo de formulario |
| `label` | `string` | `'Select'` | Etiqueta del campo |
| `typeLine` | `boolean` | `false` | Estilo de linea |
| `required` | `boolean` | `false` | Campo requerido |
| `invalid` | `boolean` | `false` | Estado de error (two-way binding) |
| `disable` | `boolean` | `false` | Campo deshabilitado |
| `iconType` | `boolean` | `false` | Mostrar icono |
| `icon` | `string` | `'bookmark'` | Nombre del icono |
| `helpText` | `string` | `''` | Texto de ayuda |
| `manualValidation` | `boolean` | `false` | Desactivar validacion automatica |

#### Modelo SelectModel

```typescript
export class SelectModel {
  constructor(
    public value?: any,           // Valor del item
    public description?: string,  // Texto a mostrar
    public disabled?: boolean     // Deshabilitar opcion
  ) {}
}
```

#### Ejemplo de Uso

```html
<!-- Seleccion simple -->
<lib-input-select-z
  label="Pais"
  [options]="paises"
  [(model)]="paisSeleccionado"
  [required]="true"
  [group]="formulario">
</lib-input-select-z>

<!-- Seleccion multiple -->
<lib-input-select-z
  label="Intereses"
  [options]="intereses"
  [(model)]="interesesSeleccionados"
  [multiSelect]="true"
  [group]="formulario">
</lib-input-select-z>
```

```typescript
// En el componente
paises: SelectModel[] = [
  new SelectModel('CO', 'Colombia'),
  new SelectModel('MX', 'Mexico'),
  new SelectModel('AR', 'Argentina'),
  new SelectModel('ES', 'Espana', true) // Deshabilitado
];

paisSeleccionado: string = '';
```

---

### CheckboxZ

Componente de casilla de verificacion.

**Selector:** `lib-checkbox-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `name` | `string` | `''` | Nombre del control |
| `label` | `string` | `''` | Texto del checkbox |
| `group` | `FormGroup` | `new FormGroup({})` | Grupo de formulario |
| `model` | `any` | - | Estado del checkbox (two-way binding) |
| `required` | `boolean` | `false` | Campo requerido |
| `disabled` | `boolean` | `false` | Campo deshabilitado |
| `valid` | `boolean` | `false` | Estado de validacion (two-way binding) |
| `helpText` | `string` | `''` | Texto de ayuda |
| `showHelpText` | `boolean` | `false` | Mostrar texto de ayuda |

#### Propiedades de Salida (@Output)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `modelChange` | `EventEmitter<any>` | Emite cuando cambia el valor |
| `validChange` | `EventEmitter<any>` | Emite cuando cambia la validacion |
| `eventChange` | `EventEmitter<any>` | Emite en cualquier cambio |

#### Ejemplo de Uso

```html
<lib-checkbox-z
  label="Acepto los terminos y condiciones"
  [(model)]="aceptaTerminos"
  [required]="true"
  [group]="formulario">
</lib-checkbox-z>

<lib-checkbox-z
  label="Recibir notificaciones"
  [(model)]="recibirNotificaciones"
  helpText="Te enviaremos correos informativos"
  [showHelpText]="true">
</lib-checkbox-z>
```

---

### TextareaZ

Componente de area de texto multilinea.

**Selector:** `lib-textarea-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Etiqueta del campo |
| `lineType` | `boolean` | `false` | Estilo de linea |
| `name` | `string` | `''` | Nombre del control |
| `model` | `any` | - | Valor del campo (two-way binding) |
| `group` | `FormGroup` | `new FormGroup({})` | Grupo de formulario |
| `helpText` | `string` | `''` | Texto de ayuda |
| `valid` | `boolean` | `false` | Estado de validacion (two-way binding) |
| `required` | `boolean` | `false` | Campo requerido |
| `disabled` | `boolean` | `false` | Campo deshabilitado |
| `readonly` | `boolean` | `false` | Campo de solo lectura |
| `maxLength` | `boolean` | `false` | Activar limite de caracteres |
| `maxNumber` | `number` | `0` | Numero maximo de caracteres |
| `elastic` | `boolean` | `false` | Altura automatica segun contenido |

#### Ejemplo de Uso

```html
<lib-textarea-z
  label="Descripcion"
  [(model)]="descripcion"
  [required]="true"
  [elastic]="true"
  [maxLength]="true"
  [maxNumber]="500"
  helpText="Maximo 500 caracteres"
  [group]="formulario">
</lib-textarea-z>
```

---

### RangeDateZ

Componente para seleccion de rango de fechas.

**Selector:** `lib-range-date-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `label` | `string` | `'content'` | Etiqueta del campo |
| `config` | `string` | `'teal'` | Configuracion de color |
| `helpText` | `string` | `'Rango de fechas de filtro'` | Texto de ayuda |
| `min` | `string` | `'date'` | Fecha minima |
| `required` | `boolean` | `false` | Campo requerido |
| `ztheme` | `string` | `'dark'` | Tema visual |
| `modelo` | `[string \| null, string \| null]` | `[null, null]` | Rango de fechas (two-way binding) |

#### Propiedades de Salida (@Output)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `modeloChange` | `EventEmitter<[string \| null, string \| null]>` | Emite cuando cambia el rango |

#### Ejemplo de Uso

```html
<lib-range-date-z
  label="Periodo de consulta"
  [(modelo)]="rangoFechas"
  [required]="true"
  helpText="Seleccione fecha inicial y final">
</lib-range-date-z>
```

```typescript
rangoFechas: [string | null, string | null] = [null, null];

// Acceder a las fechas
get fechaInicio() { return this.rangoFechas[0]; }
get fechaFin() { return this.rangoFechas[1]; }
```

---

## Componentes de Layout

### AccordionZ

Componente de acordeon colapsable con soporte para contenido personalizado.

**Selector:** `lib-accordion-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `titleLabel` | `string` | `''` | Titulo del acordeon |
| `titleInput` | `boolean` | `false` | Mostrar input editable en titulo |
| `readonlyInput` | `boolean` | `true` | Input de titulo en solo lectura |
| `modelInput` | `any` | - | Valor del input de titulo |
| `groupInput` | `FormGroup` | `new FormGroup({})` | Grupo de formulario para el input |
| `validInput` | `boolean` | `false` | Estado de validacion del input |
| `summaryMargin` | `string` | `'2'` | Margen del resumen en rem |
| `label` | `string` | `'Ingrese un valor'` | Placeholder del input |

#### Uso con ZTemplate

El contenido del acordeon se define usando la directiva `ZTemplate`:

```html
<lib-accordion-z titleLabel="Informacion personal">
  <ng-template libZTemplate id="content">
    <p>Contenido del acordeon aqui</p>
    <lib-input-text-z label="Nombre" [(model)]="nombre"></lib-input-text-z>
  </ng-template>
</lib-accordion-z>

<!-- Con input editable en el titulo -->
<lib-accordion-z
  [titleInput]="true"
  [(modelInput)]="tituloSeccion"
  label="Nombre de la seccion">
  <ng-template libZTemplate id="content">
    <p>Contenido dinamico</p>
  </ng-template>
</lib-accordion-z>
```

---

### CardZ

Componente de tarjeta con secciones de header, content y footer personalizables.

**Selector:** `lib-card-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `showHeader` | `boolean` | `true` | Mostrar seccion de header |
| `showFooter` | `boolean` | `true` | Mostrar seccion de footer |
| `bgColor` | `string` | `''` | Color de fondo (hex o nombre) |
| `colorTxt` | `string` | `''` | Color del texto |

#### Uso con ZTemplate

```html
<lib-card-z [showHeader]="true" [showFooter]="true" bgColor="#ffffff">
  <ng-template libZTemplate id="header">
    <h3>Titulo de la Tarjeta</h3>
  </ng-template>
  
  <ng-template libZTemplate id="content">
    <p>Contenido principal de la tarjeta.</p>
    <p>Puede incluir cualquier contenido HTML o componentes.</p>
  </ng-template>
  
  <ng-template libZTemplate id="footer">
    <lib-button-z label="Accion" type="primary"></lib-button-z>
  </ng-template>
</lib-card-z>

<!-- Tarjeta solo con contenido -->
<lib-card-z [showHeader]="false" [showFooter]="false">
  <ng-template libZTemplate id="content">
    <p>Tarjeta simple sin header ni footer</p>
  </ng-template>
</lib-card-z>

<!-- Tarjeta con colores personalizados -->
<lib-card-z bgColor="#1a365d" colorTxt="#ffffff">
  <ng-template libZTemplate id="content">
    <p>Tarjeta con fondo azul y texto blanco</p>
  </ng-template>
</lib-card-z>
```

---

### ModalZ

Componente de ventana modal con backdrop y secciones personalizables.

**Selector:** `lib-modal-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `open` | `boolean` | `false` | Estado de apertura del modal |
| `tamanio` | `string` | `''` | Tamano del modal: `'xs'`, `'s'`, `'m'`, `'l'` |
| `ShowBackdrop` | `boolean` | `true` | Mostrar fondo oscuro |

#### Propiedades de Salida (@Output)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `close` | `EventEmitter<any>` | Emite cuando se cierra el modal |

#### Tamanos Disponibles

- `xs`: Extra pequeno
- `s`: Pequeno
- `m`: Mediano
- `l`: Grande

#### Ejemplo de Uso

```html
<lib-button-z 
  label="Abrir Modal" 
  type="primary" 
  (eventClick)="modalAbierto = true">
</lib-button-z>

<lib-modal-z 
  [open]="modalAbierto" 
  tamanio="m"
  (close)="modalAbierto = false">
  
  <ng-template libZTemplate id="title">
    <h2>Titulo del Modal</h2>
  </ng-template>
  
  <ng-template libZTemplate id="content">
    <p>Contenido del modal. Puede incluir formularios, 
       informacion o cualquier otro contenido.</p>
    <lib-input-text-z 
      label="Campo de ejemplo" 
      [(model)]="campoModal">
    </lib-input-text-z>
  </ng-template>
  
  <ng-template libZTemplate id="buttons">
    <lib-button-z 
      label="Cancelar" 
      type="secondary" 
      (eventClick)="modalAbierto = false">
    </lib-button-z>
    <lib-button-z 
      label="Guardar" 
      type="primary" 
      (eventClick)="guardar()">
    </lib-button-z>
  </ng-template>
</lib-modal-z>
```

```typescript
modalAbierto: boolean = false;
campoModal: string = '';

guardar() {
  // Logica de guardado
  this.modalAbierto = false;
}
```

---

### TileZ

Componente de tarjeta tipo tile con imagen y acciones.

**Selector:** `lib-tile-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `img` | `string` | `''` | URL de la imagen |
| `nameButton` | `string` | `''` | Texto del boton por defecto |
| `customButtons` | `boolean` | `true` | Usar botones personalizados |
| `imgLeft` | `boolean` | `false` | Posicionar imagen a la izquierda |

#### Propiedades de Salida (@Output)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `eventClick` | `EventEmitter<any>` | Emite al hacer clic en el boton |

#### Ejemplo de Uso

```html
<!-- Con botones personalizados -->
<lib-tile-z img="assets/producto.jpg" [customButtons]="true">
  <ng-template libZTemplate id="title">
    <h4>Nombre del Producto</h4>
  </ng-template>
  
  <ng-template libZTemplate id="content">
    <p>Descripcion del producto con detalles importantes.</p>
  </ng-template>
  
  <ng-template libZTemplate id="buttons">
    <lib-button-z label="Comprar" type="primary"></lib-button-z>
    <lib-button-z label="Ver mas" type="link"></lib-button-z>
  </ng-template>
</lib-tile-z>

<!-- Con boton por defecto -->
<lib-tile-z 
  img="assets/servicio.jpg" 
  [customButtons]="false"
  nameButton="Conocer mas"
  (eventClick)="verDetalle()">
  <ng-template libZTemplate id="title">
    <h4>Servicio Premium</h4>
  </ng-template>
  <ng-template libZTemplate id="content">
    <p>Descripcion del servicio</p>
  </ng-template>
</lib-tile-z>

<!-- Imagen a la izquierda -->
<lib-tile-z img="assets/articulo.jpg" [imgLeft]="true">
  <ng-template libZTemplate id="title">
    <h4>Articulo de Blog</h4>
  </ng-template>
  <ng-template libZTemplate id="content">
    <p>Resumen del articulo...</p>
  </ng-template>
</lib-tile-z>
```

---

### TabsZ

Componente de pestanas con contenido dinamico.

**Selector:** `lib-tabs-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `headers` | `Array<{title, key, icon?, disabled?}>` | `[]` | Configuracion de pestanas |
| `data` | `{[key: string]: string}` | `{}` | Contenido de texto por pestaña |

#### Estructura de Headers

```typescript
interface TabHeader {
  title: string;      // Texto de la pestaña
  key: string;        // Identificador unico
  icon?: string;      // Icono opcional
  disabled?: boolean; // Deshabilitar pestaña
}
```

#### Ejemplo de Uso

```html
<!-- Con contenido de texto -->
<lib-tabs-z 
  [headers]="tabHeaders" 
  [data]="tabData">
</lib-tabs-z>

<!-- Con templates personalizados -->
<lib-tabs-z [headers]="tabHeaders">
  <ng-template #informacion>
    <div>
      <h3>Informacion General</h3>
      <p>Contenido de la primera pestaña</p>
    </div>
  </ng-template>
  
  <ng-template #configuracion>
    <div>
      <h3>Configuracion</h3>
      <lib-input-text-z label="Opcion 1" [(model)]="opcion1"></lib-input-text-z>
    </div>
  </ng-template>
  
  <ng-template #historial>
    <div>
      <h3>Historial</h3>
      <lib-table-z [headers]="historialHeaders" [data]="historialData"></lib-table-z>
    </div>
  </ng-template>
</lib-tabs-z>
```

```typescript
tabHeaders = [
  { title: 'Informacion', key: 'informacion', icon: 'info:line' },
  { title: 'Configuracion', key: 'configuracion', icon: 'settings:line' },
  { title: 'Historial', key: 'historial', icon: 'history:line', disabled: false }
];

tabData = {
  informacion: 'Contenido de texto para la pestaña de informacion',
  configuracion: 'Contenido de configuracion',
  historial: 'Historial de cambios'
};
```

---

## Componentes de Navegacion

### NavigationZ

Componente de barra de navegacion principal.

**Selector:** `lib-navigation-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `routes` | `NavigationRoute[]` | `undefined` | Rutas de navegacion |
| `social` | `{facebook?, twitter?, linkedin?, instagram?}` | `undefined` | Enlaces a redes sociales |

#### Modelo NavigationRoute

```typescript
export interface NavigationRoute {
  text: string;    // Texto del enlace
  icon?: any;      // Icono opcional
  href?: string;   // URL de destino
}
```

#### Ejemplo de Uso

```html
<lib-navigation-z 
  [routes]="rutasNavegacion"
  [social]="redesSociales">
</lib-navigation-z>
```

```typescript
rutasNavegacion: NavigationRoute[] = [
  { text: 'Inicio', href: '/', icon: 'home:line' },
  { text: 'Productos', href: '/productos', icon: 'box:line' },
  { text: 'Servicios', href: '/servicios' },
  { text: 'Contacto', href: '/contacto', icon: 'phone:line' }
];

redesSociales = {
  facebook: 'https://facebook.com/zurich',
  twitter: 'https://twitter.com/zurich',
  linkedin: 'https://linkedin.com/company/zurich',
  instagram: 'https://instagram.com/zurich'
};
```

---

### FooterZ

Componente de pie de pagina.

**Selector:** `lib-footer-z`

#### Descripcion

Componente simple que renderiza el footer estandar de Zurich. No requiere configuracion adicional.

#### Ejemplo de Uso

```html
<lib-footer-z></lib-footer-z>
```

---

## Componentes de Accion

### ButtonZ

Componente de boton con multiples variantes.

**Selector:** `lib-button-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Texto del boton |
| `type` | `ToAttrChain<ZButton_Type, ZButton_Size, 'round'>` | `'primary'` | Tipo y tamano del boton |
| `icon` | `SizelessIconAttr` | `undefined` | Icono del boton |
| `iconRight` | `boolean` | `false` | Posicionar icono a la derecha |
| `disabled` | `boolean` | `true` | Boton deshabilitado |
| `wide` | `boolean` | `false` | Boton de ancho completo |
| `loading` | `boolean` | `false` | Estado de carga |
| `custom_str` | `string` | `''` | Estilos personalizados |

#### Propiedades de Salida (@Output)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `eventClick` | `EventEmitter<any>` | Emite al hacer clic |

#### Tipos de Boton

**Tipos base:**
- `primary` - Accion principal
- `secondary` - Accion secundaria
- `danger` - Accion destructiva
- `link` - Estilo de enlace

**Tamanos:**
- `xs` - Extra pequeno
- `s` - Pequeno
- `m` - Mediano (default)
- `l` - Grande

**Formato combinado:** `tipo:tamano` (ej: `'primary:s'`, `'secondary:xs'`)

#### Ejemplo de Uso

```html
<!-- Boton primario -->
<lib-button-z 
  label="Guardar" 
  type="primary"
  [disabled]="false"
  (eventClick)="guardar()">
</lib-button-z>

<!-- Boton con icono -->
<lib-button-z 
  label="Descargar" 
  type="secondary"
  icon="download:line"
  [disabled]="false"
  (eventClick)="descargar()">
</lib-button-z>

<!-- Boton de carga -->
<lib-button-z 
  label="Procesando..." 
  type="primary"
  [loading]="procesando"
  [disabled]="procesando">
</lib-button-z>

<!-- Boton ancho completo -->
<lib-button-z 
  label="Continuar" 
  type="primary:l"
  [wide]="true"
  [disabled]="!formularioValido">
</lib-button-z>

<!-- Boton tipo link con icono a la derecha -->
<lib-button-z 
  label="Ver mas" 
  type="link"
  icon="arrow-right:line"
  [iconRight]="true"
  [disabled]="false">
</lib-button-z>

<!-- Boton danger pequeno -->
<lib-button-z 
  label="Eliminar" 
  type="danger:xs"
  icon="trash:line"
  [disabled]="false"
  (eventClick)="eliminar()">
</lib-button-z>
```

---

## Componentes Visuales

### AlertZ

Componente de alertas/notificaciones con animaciones y cierre automatico.

**Selector:** `lib-alert-z`

#### Descripcion

Este componente trabaja en conjunto con el servicio `AlertZService` para mostrar alertas globales en la aplicacion.

#### Ejemplo de Uso

```html
<!-- Colocar una vez en el componente principal (app.component) -->
<lib-alert-z></lib-alert-z>
```

```typescript
import { AlertZService } from 'lib-zurich';

@Component({...})
export class MiComponente {
  constructor(private alertService: AlertZService) {}

  mostrarExito() {
    this.alertService.positive('Operacion exitosa!', {
      title: 'Exito',
      autoCloseAfter: 3000,
      dismissible: true
    });
  }

  mostrarError() {
    this.alertService.negative('Ocurrio un error', {
      title: 'Error',
      autoCloseAfter: 5000
    });
  }

  mostrarAdvertencia() {
    this.alertService.alert('Por favor revise los datos', {
      title: 'Advertencia'
    });
  }

  mostrarInfo() {
    this.alertService.info('Informacion importante', {
      title: 'Informacion',
      widthPercent: 50
    });
  }
}
```

---

### AvatarZ

Componente de avatar con iniciales, imagen y estado de conexion.

**Selector:** `lib-avatar-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `name` | `string` | `''` | Nombre completo (se generan iniciales) |
| `content` | `string` | `''` | Contenido adicional |
| `status` | `'absent' \| 'occupied' \| 'online' \| 'offline'` | `'offline'` | Estado de conexion |
| `config` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientacion del nombre |
| `img` | `string` | `''` | URL de imagen de perfil |

#### Ejemplo de Uso

```html
<!-- Avatar con iniciales -->
<lib-avatar-z 
  name="Juan Perez" 
  status="online">
</lib-avatar-z>

<!-- Avatar con imagen -->
<lib-avatar-z 
  name="Maria Garcia" 
  img="assets/profile/maria.jpg"
  status="occupied"
  config="vertical">
</lib-avatar-z>

<!-- Avatar ausente -->
<lib-avatar-z 
  name="Carlos Lopez" 
  status="absent">
</lib-avatar-z>
```

---

### TagZ

Componente de etiqueta con colores y iconos.

**Selector:** `lib-tag-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Texto de la etiqueta |
| `colorTag` | `string` | `'#000000'` | Color del tag (hex) |
| `icon` | `SizelessIconAttr` | `undefined` | Icono del tag |
| `iconRight` | `boolean` | `false` | Icono a la derecha |
| `fill` | `string` | `undefined` | Color de relleno predefinido |

#### Colores de Relleno Predefinidos

- `moss`, `azure`, `teal`, `lilac`, `candy`
- `peach`, `mint`, `lime`, `lemon`, `powder-pink`

#### Ejemplo de Uso

```html
<!-- Tag basico -->
<lib-tag-z label="Nuevo" colorTag="#00A86B"></lib-tag-z>

<!-- Tag con icono -->
<lib-tag-z 
  label="Importante" 
  icon="star:fill"
  colorTag="#FFD700">
</lib-tag-z>

<!-- Tag con color predefinido -->
<lib-tag-z 
  label="En progreso" 
  fill="azure">
</lib-tag-z>

<!-- Tag con icono a la derecha -->
<lib-tag-z 
  label="Verificado" 
  icon="check:line"
  [iconRight]="true"
  fill="mint">
</lib-tag-z>
```

---

### TooltipZ

Componente de tooltip informativo.

**Selector:** `lib-tooltip-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `text` | `string` | `''` | Texto del tooltip |
| `config` | `ZTooltip_Props['config']` | `undefined` | Configuracion de posicion |
| `customStr` | `string` | `''` | Estilos personalizados |

#### Ejemplo de Uso

```html
<lib-tooltip-z text="Este es un mensaje de ayuda">
  <span>Pasa el cursor aqui</span>
</lib-tooltip-z>

<lib-tooltip-z 
  text="Informacion adicional sobre este campo"
  config="top">
  <lib-button-z label="Info" type="link" icon="info:line"></lib-button-z>
</lib-tooltip-z>
```

---

### LoaderZ

Componente de indicador de carga.

**Selector:** `lib-loader-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `customStr` | `string` | `''` | Estilos personalizados |
| `label` | `string` | `''` | Texto de carga |

#### Ejemplo de Uso

```html
<!-- Loader simple -->
<lib-loader-z></lib-loader-z>

<!-- Loader con mensaje -->
<lib-loader-z label="Cargando datos..."></lib-loader-z>

<!-- Uso condicional -->
@if (cargando) {
  <lib-loader-z label="Procesando solicitud..."></lib-loader-z>
}
```

---

### PictogramZ

Componente para mostrar pictogramas del sistema de diseno.

**Selector:** `lib-pictogram-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `customStr` | `string` | `''` | Estilos personalizados |
| `typePictogram` | `ToAttr<PictogramName, 'dark'>` | `'growth-mindset'` | Nombre del pictograma |

#### Ejemplo de Uso

```html
<lib-pictogram-z typePictogram="growth-mindset"></lib-pictogram-z>
<lib-pictogram-z typePictogram="security:dark"></lib-pictogram-z>
<lib-pictogram-z typePictogram="teamwork" customStr="width:100px"></lib-pictogram-z>
```

---

### ShapeZ

Componente para mostrar formas geometricas decorativas.

**Selector:** `lib-shape-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `size` | `string` | `'50'` | Tamano de la forma |
| `shape` | `ZShape_Value` | `'1'` | Tipo de forma (1-10+) |

#### Ejemplo de Uso

```html
<lib-shape-z shape="1" size="100"></lib-shape-z>
<lib-shape-z shape="2" size="80"></lib-shape-z>
<lib-shape-z shape="3" size="60"></lib-shape-z>
```

---

### StageZ

Componente de escenario/stage con imagen de fondo.

**Selector:** `lib-stage-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `custom-str` | `string` | `''` | Estilos personalizados |
| `image-src` | `string` | `''` | URL de imagen de fondo |
| `header` | `string` | `''` | Texto de encabezado |
| `contentContext` | `Record<string, any>` | `{}` | Contexto para el contenido |

#### Ejemplo de Uso

```html
<lib-stage-z 
  header="Bienvenido"
  image-src="assets/backgrounds/hero.jpg">
</lib-stage-z>
```

---

### StageBannerZ

Componente de banner con forma decorativa.

**Selector:** `lib-stage-banner-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `category` | `string` | `'Category Header'` | Categoria/titulo |
| `customStr` | `string` | `''` | Estilos personalizados (bg, color) |
| `addImage` | `boolean` | `false` | Agregar imagen |
| `imageSrc` | `string` | `''` | URL de la imagen |
| `content` | `string` | `'CONTENT'` | Contenido del banner |
| `config` | `string` | `''` | Configuracion adicional |
| `shape` | `string` | `''` | Tipo de forma decorativa |
| `roundedBanner` | `boolean` | `false` | Bordes redondeados |

#### Ejemplo de Uso

```html
<lib-stage-banner-z
  category="Seguros de Vida"
  content="Protege a tu familia con los mejores planes"
  customStr="bg: #73DCE6; color: #000"
  shape="1"
  [roundedBanner]="true">
</lib-stage-banner-z>

<lib-stage-banner-z
  category="Promocion Especial"
  content="Descubre nuestras ofertas"
  [addImage]="true"
  imageSrc="assets/promo.jpg">
</lib-stage-banner-z>
```

---

## Componentes de Datos

### TableZ

Componente de tabla avanzada con paginacion, seleccion y agrupacion.

**Selector:** `lib-table-z`

#### Propiedades de Entrada (@Input)

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `headers` | `Array<TableModel>` | `[]` | Configuracion de columnas |
| `data` | `Array<any>` | `[]` | Datos a mostrar |
| `typeStyle` | `string` | `''` | Estilo de la tabla |
| `pages` | `number` | `0` | Total de paginas |
| `disablePage` | `boolean` | `false` | Deshabilitar paginacion |
| `showGenericStart` | `boolean` | `false` | Mostrar columna generica al inicio |
| `genericStartName` | `string` | `''` | Nombre columna inicio |
| `showGenericEnd` | `boolean` | `false` | Mostrar columna generica al final |
| `generciEndName` | `string` | `''` | Nombre columna final |
| `hideHeader` | `boolean` | `false` | Ocultar encabezados |
| `tableCheck` | `boolean` | `false` | Habilitar seleccion de filas |

#### Propiedades de Salida (@Output)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `eventChangePages` | `EventEmitter<any>` | Emite cambio de pagina |
| `selectedItemsList` | `EventEmitter<any>` | Emite items seleccionados |

#### Modelo TableModel

```typescript
export class TableModel {
  constructor(
    public id?: boolean,           // Es campo identificador
    public title?: string,         // Titulo de columna
    public key?: string,           // Clave del dato
    public actions?: boolean,      // Es columna de acciones
    public icon?: boolean,         // Mostrar icono
    public iconClass?: string,     // Clase CSS del icono
    public strong?: boolean,       // Texto en negrita
    public pipe?: string,          // Pipe a aplicar (date, currency, uppercase)
    public percentSing?: boolean,  // Agregar signo %
    public statuData?: boolean,    // Es dato de estado
    public centerText?: boolean,   // Centrar texto
    public formatDate?: string,    // Formato de fecha
    public colTamanio?: string,    // Tamano de columna
    public isName?: boolean,       // Es nombre
    public showGroupLabel?: boolean,  // Mostrar label de grupo
    public groupLabel?: boolean,   // Es columna de agrupacion
    public rowspan?: number,       // Rowspan para grupos
    public isSubGroup?: boolean,   // Es subgrupo
    public subGroupIndice?: number,// Indice de subgrupo
    public subGroupkey?: string,   // Clave de subgrupo
    public isTag?: boolean,        // Mostrar como tag
    public iconTag?: SizelessIconAttr, // Icono del tag
    public iconRight?: boolean     // Icono a la derecha
  ) {}
}
```

#### Ejemplo de Uso Basico

```html
<lib-table-z
  [headers]="columnas"
  [data]="datos"
  [pages]="totalPaginas"
  (eventChangePages)="cambiarPagina($event)">
</lib-table-z>
```

```typescript
columnas: TableModel[] = [
  new TableModel(true, 'ID', 'id'),
  new TableModel(false, 'Nombre', 'nombre', false, false, '', true),
  new TableModel(false, 'Fecha', 'fecha', false, false, '', false, 'date'),
  new TableModel(false, 'Monto', 'monto', false, false, '', false, 'currency'),
  new TableModel(false, 'Estado', 'estado', false, false, '', false, '', false, true)
];

datos = [
  { id: 1, nombre: 'Juan Perez', fecha: '2024-01-15', monto: 1500000, estado: 'Activo' },
  { id: 2, nombre: 'Maria Garcia', fecha: '2024-02-20', monto: 2300000, estado: 'Activo' },
  { id: 3, nombre: 'Carlos Lopez', fecha: '2024-03-10', monto: 890000, estado: 'Archivado' }
];

totalPaginas = 5;

cambiarPagina(pagina: number) {
  // Cargar datos de la pagina
}
```

#### Ejemplo con Seleccion de Filas

```html
<lib-table-z
  [headers]="columnas"
  [data]="datos"
  [tableCheck]="true"
  (selectedItemsList)="onSeleccion($event)">
</lib-table-z>
```

```typescript
onSeleccion(items: any[]) {
  console.log('Items seleccionados:', items);
}
```

#### Ejemplo con Columnas Personalizadas (ZTemplate)

```html
<lib-table-z
  [headers]="columnas"
  [data]="datos"
  [showGenericEnd]="true"
  generciEndName="Acciones">
  
  <!-- Columna de acciones personalizada -->
  <ng-template libZTemplate id="end" let-row>
    <lib-button-z 
      type="link:xs" 
      icon="edit:line"
      [disabled]="false"
      (eventClick)="editar(row)">
    </lib-button-z>
    <lib-button-z 
      type="danger:xs" 
      icon="trash:line"
      [disabled]="false"
      (eventClick)="eliminar(row)">
    </lib-button-z>
  </ng-template>
</lib-table-z>
```

#### Ejemplo con Agrupacion

```typescript
// Columna con groupLabel: true agrupa automaticamente las filas
columnas: TableModel[] = [
  new TableModel(false, 'Categoria', 'categoria', false, false, '', false, '', false, false, false, '', false, false, true), // groupLabel: true
  new TableModel(false, 'Producto', 'producto'),
  new TableModel(false, 'Precio', 'precio', false, false, '', false, 'currency')
];

datos = [
  { categoria: 'Electronicos', producto: 'Laptop', precio: 2500000 },
  { categoria: 'Electronicos', producto: 'Tablet', precio: 800000 },
  { categoria: 'Hogar', producto: 'Sofa', precio: 1200000 },
  { categoria: 'Hogar', producto: 'Mesa', precio: 450000 }
];
// Las filas se agruparan automaticamente por categoria
```

#### Constantes para Tags de Estado

La tabla usa colores automaticos para estados conocidos:

```typescript
// TABLE_CONSTANTS
{
  TAG_ERROR: ['Error', 'No disponible', 'Deshabilitado'],    // Rojo
  TAG_WARNING: ['Warning', 'En mantenimiento'],              // Amarillo
  TAG_OK: ['OK', 'Disponible', 'Activo', 'ACTIVO'],         // Verde
  TAG_ARCHIVATE: ['Archivado']                               // Gris
}
```

---

## Servicios

### AlertZService

Servicio para mostrar alertas globales en la aplicacion.

**Proveedor:** `providedIn: 'root'`

#### Metodos

| Metodo | Parametros | Descripcion |
|--------|------------|-------------|
| `info(message, opts?)` | `string, Partial<AlertZData>` | Muestra alerta informativa |
| `positive(message, opts?)` | `string, Partial<AlertZData>` | Muestra alerta de exito |
| `negative(message, opts?)` | `string, Partial<AlertZData>` | Muestra alerta de error |
| `alert(message, opts?)` | `string, Partial<AlertZData>` | Muestra alerta de advertencia |
| `show(alert)` | `AlertZData` | Muestra alerta personalizada |
| `remove(id)` | `string` | Remueve una alerta por ID |
| `clear()` | - | Limpia todas las alertas |

#### Propiedades

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `alerts$` | `Observable<AlertZData[]>` | Observable con las alertas activas |

#### Ejemplo de Uso

```typescript
import { AlertZService, AlertZData } from 'lib-zurich';

@Component({...})
export class MiComponente {
  constructor(private alertService: AlertZService) {}

  // Metodos rapidos
  mostrarExito() {
    this.alertService.positive('Guardado correctamente');
  }

  mostrarError() {
    this.alertService.negative('Error al procesar', {
      title: 'Error',
      autoCloseAfter: 10000
    });
  }

  // Alerta personalizada
  mostrarPersonalizada() {
    const alerta = new AlertZData({
      message: 'Mensaje personalizado',
      config: 'info',
      title: 'Titulo',
      dismissible: true,
      onShowAnimation: 'slide-in',
      onCloseAnimation: 'slide-out',
      autoCloseAfter: 5000,
      widthPercent: 75
    });
    this.alertService.show(alerta);
  }

  // Cerrar todas
  limpiarAlertas() {
    this.alertService.clear();
  }
}
```

---

### UtilService

Servicio de utilidades para generacion de nombres de control y validaciones.

#### Metodos Estaticos

| Metodo | Parametros | Retorno | Descripcion |
|--------|------------|---------|-------------|
| `getControlName()` | - | `string` | Genera nombre unico para control |
| `updateControlValitor(group, name)` | `FormGroup, string` | `void` | Actualiza validadores del control |

#### Uso Interno

Este servicio es utilizado internamente por los componentes de formulario para generar nombres unicos de controles cuando no se proporciona uno.

```typescript
// Uso interno en componentes
if (!this.group.get(this.name)) {
  this.name = UtilService.getControlName();
  this.group.addControl(this.name, this.fb.control({}));
}
```

---

## Modelos

### TableModel

Modelo para configuracion de columnas de tabla.

```typescript
export class TableModel {
  constructor(
    public id?: boolean,           // Marca el campo como identificador unico
    public title?: string,         // Texto del encabezado de columna
    public key?: string,           // Clave para acceder al dato en el objeto
    public actions?: boolean,      // Indica si es columna de acciones
    public icon?: boolean,         // Muestra un icono en la celda
    public iconClass?: string,     // Clase CSS para el icono
    public strong?: boolean,       // Renderiza el texto en negrita
    public pipe?: string,          // Pipe a aplicar: 'date', 'currency', 'uppercase'
    public percentSing?: boolean,  // Agrega simbolo % al valor
    public statuData?: boolean,    // Indica si es un dato de estado (colores automaticos)
    public centerText?: boolean,   // Centra el texto en la celda
    public formatDate?: string,    // Formato personalizado para fechas
    public colTamanio?: string,    // Ancho de columna CSS
    public isName?: boolean,       // Indica si es un nombre (formato especial)
    public showGroupLabel?: boolean, // Muestra label del grupo
    public groupLabel?: boolean,   // Columna usada para agrupar filas
    public rowspan?: number,       // Numero de filas que abarca (grupos)
    public isSubGroup?: boolean,   // Es parte de un subgrupo
    public subGroupIndice?: number,// Indice del subgrupo
    public subGroupkey?: string,   // Clave del subgrupo
    public isTag?: boolean,        // Renderiza como tag/badge
    public iconTag?: SizelessIconAttr, // Icono para el tag
    public iconRight?: boolean     // Icono a la derecha en el tag
  ) {}
}
```

---

### AlertZData

Modelo para configuracion de alertas.

```typescript
export class AlertZData {
  id?: string;                                    // ID unico (auto-generado si no se provee)
  message?: string;                               // Mensaje de la alerta
  config: 'info' | 'positive' | 'negative' | 'alert' = 'info';  // Tipo de alerta
  title?: string;                                 // Titulo opcional
  dismissible?: boolean = false;                  // Permite cerrar manualmente
  onShowAnimation?: string = 'fade-in';           // Animacion de entrada
  onCloseAnimation?: string = 'fade-out';         // Animacion de salida
  autoCloseAfter?: number = 5000;                 // Cierre automatico (ms), 0 = no cierra
  widthPercent?: 25 | 50 | 75 | 100 = 100;       // Ancho de la alerta

  constructor(init?: Partial<AlertZData>) {
    Object.assign(this, init);
    if (!this.id) {
      this.id = Math.random().toString(36).substr(2, 9);
    }
  }
}
```

---

### SelectModel

Modelo para opciones de select.

```typescript
export class SelectModel {
  constructor(
    public value?: any,           // Valor del item
    public description?: string,  // Texto a mostrar
    public disabled?: boolean     // Deshabilita la opcion
  ) {}
}
```

---

### NavigationRoute

Interface para rutas de navegacion.

```typescript
export interface NavigationRoute {
  text: string;    // Texto del enlace
  icon?: any;      // Icono opcional
  href?: string;   // URL de destino
}
```

---

## Directivas

### ZTemplate

Directiva para definir templates reutilizables en componentes.

**Selector:** `ng-template[libZTemplate]`

#### Atributos

| Atributo | Tipo | Descripcion |
|----------|------|-------------|
| `id` | `string` | Identificador del template |

#### Uso

La directiva `ZTemplate` permite definir secciones personalizables dentro de componentes como `CardZ`, `ModalZ`, `TileZ`, `AccordionZ` y `TableZ`.

```html
<!-- En CardZ -->
<lib-card-z>
  <ng-template libZTemplate id="header">
    <h3>Encabezado personalizado</h3>
  </ng-template>
  
  <ng-template libZTemplate id="content">
    <p>Contenido personalizado</p>
  </ng-template>
  
  <ng-template libZTemplate id="footer">
    <button>Accion</button>
  </ng-template>
</lib-card-z>

<!-- En TableZ para columnas personalizadas -->
<lib-table-z [headers]="headers" [data]="data">
  <ng-template libZTemplate id="nombreColumna" let-row>
    <span>{{ row.campo | uppercase }}</span>
  </ng-template>
</lib-table-z>
```

#### IDs Comunes por Componente

| Componente | IDs Disponibles |
|------------|-----------------|
| `CardZ` | `header`, `content`, `footer` |
| `ModalZ` | `title`, `content`, `buttons` |
| `TileZ` | `title`, `content`, `buttons` |
| `AccordionZ` | `content` |
| `TableZ` | `start`, `end`, `[nombreColumna]` |

---

## Pipes

### DynamicPipe

Pipe para aplicar transformaciones dinamicas en tablas.

**Nombre:** `dynamicPipe`

#### Transformaciones Disponibles

| Pipe | Descripcion | Ejemplo |
|------|-------------|---------|
| `date` | Formatea fecha a DD/MM/YYYY | `'2024-01-15'` -> `'15/01/2024'` |
| `currency` | Formatea como moneda | `1500000` -> `$1,500,000.00` |
| `uppercase` | Convierte a mayusculas | `'texto'` -> `'TEXTO'` |
| `strong` | Envuelve en tags `<strong>` | `'texto'` -> `'<strong>texto</strong>'` |

#### Uso en TableModel

```typescript
// Columna con pipe de fecha
new TableModel(false, 'Fecha', 'fecha', false, false, '', false, 'date')

// Columna con pipe de moneda
new TableModel(false, 'Monto', 'monto', false, false, '', false, 'currency')

// Columna en mayusculas
new TableModel(false, 'Codigo', 'codigo', false, false, '', false, 'uppercase')
```

---

## Constantes

### TABLE_CONSTANTS

Constantes para manejo de estados en tablas.

```typescript
export const TABLE_CONSTANTS = {
  // Estados que se muestran en rojo
  TAG_ERROR: ['Error', 'No disponible', 'Deshabilitado'],
  
  // Estados que se muestran en amarillo
  TAG_WARNING: ['Warning', 'En mantenimiento'],
  
  // Estados que se muestran en verde
  TAG_OK: ['OK', 'Disponible', 'Activo', 'ACTIVO'],
  
  // Estados que se muestran en gris
  TAG_ARCHIVATE: ['Archivado']
};
```

---

## Buenas Practicas

### 1. Manejo de Formularios

Siempre utilice `FormGroup` para agrupar controles relacionados:

```typescript
@Component({...})
export class MiFormulario {
  formulario = new FormGroup({});
  
  nombre: string = '';
  email: string = '';
  
  enviar() {
    if (this.formulario.valid) {
      // Procesar datos
    }
  }
}
```

```html
<form [formGroup]="formulario" (ngSubmit)="enviar()">
  <lib-input-text-z
    label="Nombre"
    [(model)]="nombre"
    [required]="true"
    [group]="formulario">
  </lib-input-text-z>
  
  <lib-input-text-z
    label="Email"
    inputType="email"
    [(model)]="email"
    [required]="true"
    [group]="formulario">
  </lib-input-text-z>
  
  <lib-button-z
    label="Enviar"
    type="primary"
    [disabled]="formulario.invalid">
  </lib-button-z>
</form>
```

### 2. Uso de Alertas Globales

Configure el componente `AlertZ` una sola vez en el componente principal:

```html
<!-- app.component.html -->
<router-outlet></router-outlet>
<lib-alert-z></lib-alert-z>
```

### 3. Validacion Manual vs Automatica

Use `manualValidation="true"` cuando necesite controlar la validacion:

```html
<lib-input-text-z
  [(model)]="campo"
  [(valid)]="campoInvalido"
  [manualValidation]="true"
  [group]="formulario">
</lib-input-text-z>
```

```typescript
// Control manual de validacion
validarCampo() {
  this.campoInvalido = !this.validacionPersonalizada(this.campo);
}
```

### 4. Tablas con Grandes Volumenes de Datos

Implemente paginacion del lado del servidor:

```typescript
page = 1;
pageSize = 10;
totalPages = 0;

cargarDatos() {
  this.servicio.obtenerDatos(this.page, this.pageSize)
    .subscribe(response => {
      this.datos = response.items;
      this.totalPages = response.totalPages;
    });
}

cambiarPagina(nuevaPagina: number) {
  this.page = nuevaPagina;
  this.cargarDatos();
}
```

### 5. Modales con Formularios

Resetee el formulario al cerrar el modal:

```typescript
cerrarModal() {
  this.modalAbierto = false;
  this.formularioModal.reset();
  this.limpiarCampos();
}
```

### 6. Importacion Selectiva

Importe solo los componentes que necesita:

```typescript
// Bien - importacion selectiva
import { InputTextZ, ButtonZ, CardZ } from 'lib-zurich';

// Evitar - importar todo
// import * as LibZurich from 'lib-zurich';
```

---

## Apendice: Referencia Rapida de Selectores

| Componente | Selector |
|------------|----------|
| AccordionZ | `lib-accordion-z` |
| AlertZ | `lib-alert-z` |
| AvatarZ | `lib-avatar-z` |
| ButtonZ | `lib-button-z` |
| CardZ | `lib-card-z` |
| CheckboxZ | `lib-checkbox-z` |
| FooterZ | `lib-footer-z` |
| InputDateZ | `lib-input-date-z` |
| InputPasswordZ | `lib-input-password-z` |
| InputSelectZ | `lib-input-select-z` |
| InputTextZ | `lib-input-text-z` |
| InputTimeZ | `lib-input-time-z` |
| LoaderZ | `lib-loader-z` |
| ModalZ | `lib-modal-z` |
| NavigationZ | `lib-navigation-z` |
| PictogramZ | `lib-pictogram-z` |
| RangeDateZ | `lib-range-date-z` |
| ShapeZ | `lib-shape-z` |
| StageBannerZ | `lib-stage-banner-z` |
| StageZ | `lib-stage-z` |
| TableZ | `lib-table-z` |
| TabsZ | `lib-tabs-z` |
| TagZ | `lib-tag-z` |
| TextareaZ | `lib-textarea-z` |
| TileZ | `lib-tile-z` |
| TooltipZ | `lib-tooltip-z` |

---

**Version:** 2.6.14  
**Angular:** 20+  
**Ultima actualizacion:** Julio 2026
