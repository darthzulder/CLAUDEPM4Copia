flowchart TD
    subgraph PM4["ProcessMaker 4 — mxzurich.dev.cloud.processmaker.net"]
        PM4_PROC["Proceso BPM\n(nodo de tarea)"]
        PM4_API["API /api/1.0\n(tasks, collections, scripts)"]
        PM4_DB[("Datos del caso\n(task.data)")]
        PM4_FILES[("Archivos adjuntos\n(request files)")]
    end

    subgraph RENDER["Render.com — pm4-app.onrender.com"]
        subgraph FRONTEND["Frontend · React + Vite"]
            APP["App.tsx\n?screen= router"]
            SCREEN["SolicitudCotizacionCuw\n(formulario React)"]
            HOOKS["useTask · useCollection\nuseToken"]
            DOCS["Sección Documentos\n(file inputs)"]
        end

        subgraph BACKEND["Backend · Express"]
            PROXY["Proxy /api/*\n(inyecta Bearer token)"]
            FILE_PROXY["Proxy multipart\n/api/requests/{id}/files"]
        end
    end

    BROWSER["Navegador del usuario\n(iframe dentro de PM4)"]

    %% PM4 genera la URL del iframe
    PM4_PROC -->|"genera iframe URL\n?screen=...&task_id=...&token=eyJ..."| BROWSER

    %% Carga la app
    BROWSER -->|"carga"| APP
    APP --> SCREEN
    SCREEN --> HOOKS
    SCREEN --> DOCS

    %% Requests de datos
    HOOKS -->|"GET /api/tasks/{id}\nGET /api/collections/{id}/records\nPOST /api/scripts/{id}/execute\nx-pm4-token: eyJ..."| PROXY
    PROXY -->|"Bearer eyJ..."| PM4_API
    PM4_API --- PM4_DB
    PM4_API -->|"task.data (campos del caso)"| PROXY
    PROXY --> HOOKS

    %% Upload de archivos
    DOCS -->|"POST /api/requests/{id}/files\nmultipart/form-data\n(PDF, DOCX, etc.)"| FILE_PROXY
    FILE_PROXY -->|"Bearer eyJ...\nmultipart"| PM4_API
    PM4_API --- PM4_FILES
    PM4_FILES -->|"file_id de referencia"| FILE_PROXY
    FILE_PROXY -->|"{ id, file_name, url }"| DOCS

    %% Submit — datos + referencias a archivos
    SCREEN -->|"PUT /api/tasks/{id}\n{ status: COMPLETED,\n  data: { frm_*, arrays...,\n  frm_docs: [{ id, nombre }] } }"| PROXY
    PROXY -->|"PUT con JSON completo del caso"| PM4_API
    PM4_API -->|"avanza al siguiente nodo"| PM4_PROC

    style PM4 fill:#1a4f8a,color:#fff,stroke:#2167AE
    style RENDER fill:#2d6a4f,color:#fff,stroke:#0CA442
    style FRONTEND fill:#1b4332,color:#fff,stroke:#52b788
    style BACKEND fill:#1b4332,color:#fff,stroke:#52b788
    style BROWSER fill:#495057,color:#fff,stroke:#adb5bd
