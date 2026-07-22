%%{init: {'flowchart': {'curve': 'linear'}} }%%
flowchart TD

    BROWSER["Navegador del usuario
    (iframe dentro de PM4)"]

    subgraph PM4["  ProcessMaker 4 — mxzurich.dev.cloud.processmaker.net  "]
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
            SCREEN["SolicitudCotizacionCuw
            formulario React"]
            HOOKS["useTask · useCollection · useToken"]
            DOCS["Seccion Documentos
            file inputs"]
        end

        subgraph BACKEND["  Backend — Express  "]
            PROXY["Proxy /api/*
            inyecta Bearer token"]
            FILE_PROXY["Proxy multipart
            /api/requests/id/files"]
        end

    end

    PM4_PROC  -->|"iframe URL  ?token=eyJ...  &task_id=..."| BROWSER
    BROWSER   -->|carga| APP
    APP       --> SCREEN
    SCREEN    --> HOOKS
    SCREEN    --> DOCS

    HOOKS     -->|"GET tasks · GET collections · POST scripts
    Header: x-pm4-token"| PROXY
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
