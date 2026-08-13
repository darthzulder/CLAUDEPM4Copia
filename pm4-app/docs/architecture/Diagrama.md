# Diagrama de integración — PM4 App

Arquitectura actual (frontend + backend/proxy + verificación reCAPTCHA + resolución de IDs
por nombre). Fuente Mermaid renderizada a
[`pm4_render_integration.svg`](pm4_render_integration.svg) con `@mermaid-js/mermaid-cli`.

```mermaid
%%{init: {'flowchart': {'curve': 'linear'}} }%%
flowchart TD

    BROWSER["Navegador del usuario
    (iframe dentro de PM4)"]

    subgraph PM4["  ProcessMaker 4 — instancia definida por PM4_BASE_URL (.env)  "]
        PM4_PROC["Proceso BPM
        (nodo de tarea)"]
        PM4_API["API /api/1.0
        tasks · collections · scripts"]
        PM4_DB[("Datos del caso
        task.data")]
        PM4_FILES[("Archivos adjuntos
        request files")]
    end

    subgraph RENDER["  Render.com — pm4-app.onrender.com  "]

        subgraph FRONTEND["  Frontend — React + Vite  "]
            APP["App.tsx
            router ?screen="]
            SCREEN["Pantalla React
            (una de 14 registradas)"]
            HOOKS["useTask · useCollection · useToken"]
            DOCS["Seccion Documentos
            file inputs"]
            RECAPTCHA["RecaptchaModal
            checkbox v2"]
        end

        subgraph BACKEND["  Backend — Express  "]
            PROXY["Proxy /api/*
            inyecta Bearer token"]
            FILE_PROXY["Proxy multipart
            /api/requests/id/files"]
            RESOLVE["pm4Resolve()
            ID por nombre via pm4-registry.json"]
            RECAPTCHA_VERIFY["POST /api/recaptcha/verify"]
        end

    end

    subgraph GOOGLE["  Google — reCAPTCHA siteverify  "]
        GOOGLE_API["siteverify API"]
    end

    PM4_PROC  -->|"iframe URL  ?token=eyJ...  &task_id=..."| BROWSER
    BROWSER   -->|carga| APP
    APP       --> SCREEN
    SCREEN    --> HOOKS
    SCREEN    --> DOCS
    SCREEN    --> RECAPTCHA

    HOOKS     -->|"GET tasks · GET collections · POST scripts
    Header: x-pm4-token"| PROXY
    PROXY     -.->|"resuelve collection/script/process
    por nombre, no por ID fijo"| RESOLVE
    PROXY     -->|"Bearer token"| PM4_API
    PM4_API   ---  PM4_DB
    PM4_API   -->|"task.data — campos del caso"| PROXY
    PROXY     -->  HOOKS

    DOCS      -->|"POST multipart/form-data
    PDF · DOCX · etc"| FILE_PROXY
    FILE_PROXY-->|"Bearer token + multipart"| PM4_API
    PM4_API   ---  PM4_FILES
    PM4_FILES -->|"file_id · file_name · url"| FILE_PROXY
    FILE_PROXY-->|"referencia del archivo"| DOCS

    RECAPTCHA -->|"grecaptcha token"| RECAPTCHA_VERIFY
    RECAPTCHA_VERIFY -->|"secret + response"| GOOGLE_API
    GOOGLE_API -->|"success: true/false"| RECAPTCHA_VERIFY
    RECAPTCHA_VERIFY -->|"verified: true/false"| RECAPTCHA

    SCREEN    -->|"PUT /api/tasks/id
    status: COMPLETED
    data: frm_* + arrays + docs"| PROXY
    PROXY     -->|"PUT JSON completo del caso"| PM4_API
    PM4_API   -->|"avanza al siguiente nodo"| PM4_PROC

    style PM4       fill:#1a4f8a,color:#fff,stroke:#2167AE
    style RENDER    fill:#1b3a2d,color:#fff,stroke:#0CA442
    style FRONTEND  fill:#1b4332,color:#fff,stroke:#52b788
    style BACKEND   fill:#1b4332,color:#fff,stroke:#52b788
    style BROWSER   fill:#374151,color:#fff,stroke:#9ca3af
    style GOOGLE    fill:#3a3a1b,color:#fff,stroke:#eab308
```
