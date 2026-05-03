# Instrucciones para Claude Code — PM4 Form Builder

> **Propósito**: Construir una aplicación local (Node/React) que permita diseñar formularios con asistencia de IA y publicarlos directamente en ProcessMaker 4 via API REST.

---

## ⚠️ ANTES DE ESCRIBIR UNA SOLA LÍNEA DE CÓDIGO — PREGUNTA TODO ESTO

Eres un asistente que va a construir un proyecto desde cero. **No empieces a codificar hasta haber confirmado cada punto de esta lista con el usuario.** Si alguna respuesta cambia la arquitectura, replantea y vuelve a confirmar antes de continuar.

---

### Bloque 1 — Entorno y credenciales

1. **¿Cuál es la URL base de tu instancia de ProcessMaker 4?**
   Ejemplo: `https://empresa.processmaker.net` o `http://localhost:8080`
   Necesito esto para configurar el cliente HTTP y los CORS.

2. **¿Ya tienes un API token generado?**
   - Si SÍ: ¿Lo metes tú a mano en un `.env` o quieres que la app tenga una pantalla de login para obtenerlo?
   - Si NO: La API de PM4 usa Bearer tokens creados en `/api/1.0/users/{user_id}/tokens`. ¿Quieres que la app incluya un flujo de autenticación para generarlo, o prefieres manejarlo manualmente por ahora?

3. **¿Tu PM4 corre en HTTPS con certificado válido?**
   Si es local con certificado autofirmado, necesito configurar el cliente para ignorar verificación SSL (solo dev). Confirma si es el caso.

4. **¿Tienes acceso de administrador en PM4 o solo de usuario?**
   Algunas operaciones como crear screen categories requieren permisos de admin.

---

### Bloque 2 — Stack tecnológico

5. **¿Tienes preferencia de framework frontend?**
   Las opciones razonables son:
   - React + Vite (recomendado, mejor soporte de IA)
   - Vue 3 + Vite
   - Next.js (si quieres SSR)
   
   Si no tienes preferencia, usaré **React + Vite + TypeScript**.

6. **¿Quieres que el backend (proxy hacia PM4 API) sea:**
   - Un servidor Express/Node liviano (recomendado para local, evita problemas CORS)
   - Directo desde el frontend (solo funciona si PM4 tiene CORS abierto)
   - Ninguno por ahora (mock local hasta confirmar la conexión)

7. **¿Qué versión de Node tienes instalada?**
   Ejecuta `node -v` y dime el resultado. Necesito saber si puedo usar features de Node 18+.

8. **¿Usas npm, yarn o pnpm?**

---

### Bloque 3 — Pantallas existentes

9. **¿Tienes pantallas existentes en PM4 que quieras migrar/visualizar en esta app?**
   - Si SÍ: Lee y sigue el archivo `MIGRACION_PANTALLAS.md` que viene junto a estas instrucciones ANTES de continuar.
   - Si NO: Continuamos con proyecto limpio.

10. **¿Cuántas pantallas aproximadamente tienes en PM4?**
    Menos de 10 / entre 10 y 50 / más de 50.
    Esto afecta si necesitamos paginación en el listado.

---

### Bloque 4 — Funcionalidades del builder

11. **¿Qué tipos de campos necesitas en el builder de formularios?**
    Marca todos los que aplican:
    - [ ] Texto libre (input, textarea)
    - [ ] Selects / dropdowns (con opciones fijas o desde API)
    - [ ] Checkboxes / radios
    - [ ] Fechas y horas
    - [ ] Carga de archivos
    - [ ] Tablas / grids editables
    - [ ] Campos calculados / fórmulas
    - [ ] Campos con validación custom
    - [ ] Firma digital
    - [ ] Subformularios anidados

12. **¿El builder necesita drag & drop visual, o es suficiente con un formulario de configuración por campo?**
    El drag & drop es más cómodo pero tarda más en construirse.

13. **¿Necesitas soporte para watchers (scripts que se ejecutan cuando cambia un campo en PM4)?**
    Si SÍ, necesito saber qué lenguaje de scripts usa tu PM4: PHP, JavaScript, o ambos.

14. **¿Necesitas soporte para computed properties (campos calculados de PM4)?**

15. **¿Necesitas CSS personalizado por screen?**
    PM4 acepta `custom_css` en cada screen.

---

### Bloque 5 — Integración con IA

16. **¿Cómo quieres que funcione la IA dentro del builder?**
    - Opción A: Describes el formulario en lenguaje natural y la IA genera todos los campos de una vez.
    - Opción B: La IA sugiere campos uno a uno mientras los vas configurando.
    - Opción C: Sube un PDF/imagen de un formulario existente y la IA lo transcribe.
    - Opción D: Combinación de las anteriores.

17. **¿Tienes API key de Anthropic (Claude) o prefieres usar otro modelo?**
    Si no tienes, ¿quieres que la app tenga un campo de configuración para introducirla?

18. **¿La IA debe generar directamente el JSON de config de PM4, o solo sugerir campos que tú confirmas antes de publicar?**
    Recomiendo la segunda opción para evitar publicaciones accidentales.

---

### Bloque 6 — Publicación y flujo de trabajo

19. **¿Quieres un flujo de borrador → revisión → publicar, o publicación directa?**
    PM4 tiene un endpoint `PUT /screens/{id}/draft` para guardar borradores.

20. **¿Necesitas historial de versiones de los formularios dentro de la app?**

21. **¿Las pantallas deben asociarse a una screen category específica en PM4?**
    Si SÍ: ¿Cuál es el ID o nombre de la categoría por defecto?

22. **¿Necesitas preview del formulario antes de publicar?**
    PM4 tiene `POST /screens/preview` que devuelve el HTML renderizado.

23. **¿Quieres que la app también permita editar pantallas ya existentes en PM4, o solo crear nuevas?**

---

### Bloque 7 — Estructura del proyecto

24. **¿Quieres un monorepo (frontend + backend en la misma carpeta) o repositorios separados?**

25. **¿El proyecto debe estar listo para deployarse después, o es puramente local y temporal?**
    Esto afecta si configuro variables de entorno, dockerización, etc.

26. **¿Quieres que el proyecto incluya tests desde el inicio (Jest/Vitest) o los añadimos después?**

---

## Instrucciones de arquitectura para cuando confirmes todo lo anterior

Una vez respondidas todas las preguntas, construye el proyecto con esta estructura base:

```
pm4-form-builder/
├── .env.example          # Variables de entorno documentadas (nunca .env real)
├── README.md
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── pm4Client.ts       # Cliente HTTP para PM4 API (Bearer token)
│   │   ├── components/
│   │   │   ├── FieldEditor/       # Editor de un campo individual (~200 líneas max)
│   │   │   ├── ScreenList/        # Listado de screens desde PM4
│   │   │   ├── ScreenBuilder/     # Canvas del builder
│   │   │   └── AIAssistant/       # Panel de asistencia con IA
│   │   ├── hooks/
│   │   │   ├── useScreens.ts      # CRUD de screens via PM4 API
│   │   │   └── useAI.ts           # Llamadas a Claude API
│   │   ├── types/
│   │   │   └── pm4.types.ts       # Tipos TypeScript del schema de PM4
│   │   └── App.tsx
│   └── vite.config.ts
└── backend/               # Solo si se decidió usar proxy Express
    └── src/
        ├── routes/pm4.routes.ts
        └── server.ts
```

**Reglas obligatorias de desarrollo:**
- Ningún archivo de componente debe superar 300 líneas. Si lo hace, dividir en subcomponentes.
- El `pm4Client.ts` debe ser el único lugar donde se construyen las llamadas HTTP a PM4.
- El API key / Bearer token NUNCA debe estar hardcodeado. Solo desde `.env`.
- Cada componente que llama a la API debe manejar explícitamente los estados: loading, error, success.
- El JSON de `config` de una screen de PM4 debe manejarse como tipo opaco (`Record<string, unknown>[]`) hasta que se decida tipar completamente.

---

## Referencia rápida de la API de PM4 (screens)

Base URL: `{PM4_BASE_URL}/api/1.0`
Auth header: `Authorization: Bearer {API_TOKEN}`

| Acción | Método | Endpoint |
|--------|--------|----------|
| Listar screens | GET | `/screens` |
| Obtener screen | GET | `/screens/{id}` |
| Crear screen | POST | `/screens` |
| Actualizar screen | PUT | `/screens/{id}` |
| Guardar borrador | PUT | `/screens/{id}/draft` |
| Duplicar | PUT | `/screens/{id}/duplicate` |
| Exportar | POST | `/screens/{id}/export` |
| Importar | POST | `/screens/import` |
| Preview | POST | `/screens/preview` |
| Listar categorías | GET | `/screen_categories` |

**Schema de una screen (POST/PUT body):**
```json
{
  "title": "Nombre del formulario",
  "type": "FORM",
  "description": "Descripción opcional",
  "config": [],
  "computed": [],
  "watchers": [],
  "custom_css": "",
  "screen_category_id": "1"
}
```

El campo `config` es un array de objetos que define la estructura visual del formulario. Es el corazón de cada screen y el que la IA debe aprender a generar.

---

## Prompt base para el módulo de IA

Cuando implementes el `useAI.ts`, usa este system prompt como base para las llamadas a Claude:

```
Eres un experto en ProcessMaker 4. Tu tarea es generar el array "config" 
de una screen de PM4 a partir de una descripción en lenguaje natural.

El array config sigue el schema interno de PM4 donde cada elemento es un 
objeto con al menos: component, config (label, name, placeholder, validation).

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin bloques de código markdown.
El JSON debe ser un array que pueda asignarse directamente al campo "config" de una screen.

Antes de generar, confirma con el usuario:
1. ¿Cuántas páginas/secciones tiene el formulario?
2. ¿Hay campos que dependan de otros (lógica condicional)?
3. ¿Hay campos que se llenen desde una API o datasource externo?
```

---

*Documento generado para uso con Claude Code — proyecto PM4 Form Builder*
