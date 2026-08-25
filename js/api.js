const TaskFlowAPI = (() => {

    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    /*
     * DESARROLLO LOCAL
     *
     * Mientras el backend esté ejecutándose en tu computadora:
     *
     * http://localhost:3000
     *
     * Cuando publiquemos Express en internet,
     * solamente cambiaremos esta URL.
     */
    const API_URL =
        "https://task2-yf5q.onrender.com/api";


    /* =========================================================
       PETICIÓN GENERAL
       ========================================================= */

    async function request(
        endpoint,
        options = {}
    ) {

        try {

            const response =
                await fetch(
                    `${API_URL}${endpoint}`,
                    {
                        ...options,

                        headers: {
                            "Content-Type":
                                "application/json",

                            ...(
                                options.headers ||
                                {}
                            )
                        }
                    }
                );


            /*
             * Algunas respuestas DELETE pueden
             * venir sin contenido.
             *
             * Por eso primero obtenemos el texto
             * y luego intentamos convertirlo.
             */

            const text =
                await response.text();


            let data = null;


            if (text) {

                try {

                    data =
                        JSON.parse(
                            text
                        );

                } catch {

                    data =
                        text;

                }

            }


            /*
             * Cualquier código HTTP fuera
             * del rango 200-299 genera error.
             */

            if (!response.ok) {

                throw new Error(

                    data?.message ||

                    (
                        typeof data ===
                        "string"
                            ? data
                            : `Error HTTP ${response.status}`
                    )

                );

            }


            return data;


        } catch (error) {

            /*
             * Cuando fetch no puede llegar
             * al backend normalmente lanza
             * "Failed to fetch".
             */

            if (
                error instanceof TypeError &&
                error.message
                    .toLowerCase()
                    .includes(
                        "fetch"
                    )
            ) {

                throw new Error(
                    "No se pudo conectar con el servidor de TaskFlow."
                );

            }


            throw error;

        }

    }


    /* =========================================================
       ADAPTADOR TAREA:
       API → FRONTEND
       ========================================================= */

    function adaptTaskFromAPI(
        task
    ) {

        if (!task) {

            return task;

        }


        return {

            ...task,


            /*
             * PostgreSQL usa normalmente
             * secondary_task.
             *
             * El frontend utiliza
             * secondaryTask.
             */

            secondaryTask:

                task.secondaryTask ??

                task.secondary_task ??

                "",


            /*
             * PostgreSQL:
             * project_id
             *
             * Frontend:
             * projectId
             */

            projectId:

                task.projectId ??

                task.project_id ??

                "",


            /*
             * PostgreSQL:
             * task_date
             *
             * Frontend:
             * date
             */

            date:

                task.date ??

                task.task_date ??

                "",


            /*
             * PostgreSQL:
             * completed_at
             *
             * Frontend:
             * completedAt
             */

            completedAt:

                task.completedAt ??

                task.completed_at ??

                null,


            /*
             * PostgreSQL:
             * created_at
             *
             * Frontend:
             * createdAt
             */

            createdAt:

                task.createdAt ??

                task.created_at ??

                null,


            /*
             * La API puede devolver:
             *
             * members: [
             *   {
             *      id: "collaborator_1",
             *      name: "Ana"
             *   }
             * ]
             *
             * Pero script.js trabaja con:
             *
             * members: [
             *   "collaborator_1"
             * ]
             */

            members:

                Array.isArray(
                    task.members
                )

                    ? task.members

                        .map(
                            member => {

                                if (
                                    typeof member ===
                                    "object"
                                ) {

                                    return (
                                        member?.id ??
                                        null
                                    );

                                }


                                return member;

                            }
                        )

                        .filter(
                            Boolean
                        )

                    : []

        };

    }


    /* =========================================================
       ADAPTADOR TAREA:
       FRONTEND → API
       ========================================================= */

    function adaptTaskToAPI(
        task
    ) {

        const payload = {};


        /*
         * Solo enviamos ID cuando existe.
         *
         * Para tareas nuevas el backend
         * puede generar automáticamente
         * el identificador.
         */

        if (task.id) {

            payload.id =
                task.id;

        }


        /*
         * IMPORTANTE:
         *
         * Usamos comprobaciones con !== undefined
         * para permitir enviar valores vacíos
         * durante una edición.
         */


        if (
            task.title !==
            undefined
        ) {

            payload.title =
                task.title;

        }


        if (
            task.secondaryTask !==
            undefined ||
            task.secondary_task !==
            undefined
        ) {

            payload.secondaryTask =

                task.secondaryTask ??

                task.secondary_task ??

                "";

        }


        if (
            task.company !==
            undefined ||
            task.EMPRESA !==
            undefined
        ) {

            payload.company =

                task.company ??

                task.EMPRESA ??

                "";

        }


        if (
            task.observations !==
            undefined ||
            task.OBSERVACIONES !==
            undefined
        ) {

            payload.observations =

                task.observations ??

                task.OBSERVACIONES ??

                "";

        }


        if (
            task.priority !==
            undefined
        ) {

            payload.priority =
                task.priority;

        }


        if (
            task.projectId !==
            undefined
        ) {

            payload.projectId =

                task.projectId ||

                null;

        }


        if (
            task.date !==
            undefined
        ) {

            payload.date =

                task.date ||

                null;

        }


        return payload;

    }


    /* =========================================================
       ADAPTADOR PROYECTO
       ========================================================= */

    function adaptProjectFromAPI(
        project
    ) {

        if (!project) {

            return project;

        }


        return {

            ...project,


            createdAt:

                project.createdAt ??

                project.created_at ??

                null

        };

    }


    /* =========================================================
       ADAPTADOR COLABORADOR
       ========================================================= */

    function adaptCollaboratorFromAPI(
        collaborator
    ) {

        if (!collaborator) {

            return collaborator;

        }


        return {

            ...collaborator,


            createdAt:

                collaborator.createdAt ??

                collaborator.created_at ??

                null

        };

    }


    /* =========================================================
       PROYECTOS
       ========================================================= */


    async function getProjects() {

        const projects =
            await request(
                "/projects"
            );


        if (
            !Array.isArray(
                projects
            )
        ) {

            return [];

        }


        return projects.map(
            adaptProjectFromAPI
        );

    }


    async function createProject(
        project
    ) {

        const created =
            await request(
                "/projects",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            project
                        )

                }
            );


        return adaptProjectFromAPI(
            created
        );

    }


    async function updateProject(
        id,
        project
    ) {

        const updated =
            await request(

                `/projects/${encodeURIComponent(id)}`,

                {

                    method:
                        "PUT",

                    body:
                        JSON.stringify(
                            project
                        )

                }

            );


        return adaptProjectFromAPI(
            updated
        );

    }


    function deleteProject(
        id
    ) {

        return request(

            `/projects/${encodeURIComponent(id)}`,

            {

                method:
                    "DELETE"

            }

        );

    }


    /* =========================================================
       COLABORADORES
       ========================================================= */


    async function getCollaborators() {

        const collaborators =
            await request(
                "/collaborators"
            );


        if (
            !Array.isArray(
                collaborators
            )
        ) {

            return [];

        }


        return collaborators.map(
            adaptCollaboratorFromAPI
        );

    }


    async function createCollaborator(
        collaborator
    ) {

        const created =
            await request(

                "/collaborators",

                {

                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            collaborator
                        )

                }

            );


        return adaptCollaboratorFromAPI(
            created
        );

    }


    async function updateCollaborator(
        id,
        collaborator
    ) {

        const updated =
            await request(

                `/collaborators/${encodeURIComponent(id)}`,

                {

                    method:
                        "PUT",

                    body:
                        JSON.stringify(
                            collaborator
                        )

                }

            );


        return adaptCollaboratorFromAPI(
            updated
        );

    }


    function deleteCollaborator(
        id
    ) {

        return request(

            `/collaborators/${encodeURIComponent(id)}`,

            {

                method:
                    "DELETE"

            }

        );

    }


    /* =========================================================
       TAREAS
       ========================================================= */


    async function getTasks() {

        const tasks =
            await request(
                "/tasks"
            );


        if (
            !Array.isArray(
                tasks
            )
        ) {

            return [];

        }


        return tasks.map(
            adaptTaskFromAPI
        );

    }


    async function createTask(
        task
    ) {

        const created =
            await request(

                "/tasks",

                {

                    method:
                        "POST",

                    body:
                        JSON.stringify(

                            adaptTaskToAPI(
                                task
                            )

                        )

                }

            );


        return adaptTaskFromAPI(
            created
        );

    }


    async function updateTask(
        id,
        task
    ) {

        const updated =
            await request(

                `/tasks/${encodeURIComponent(id)}`,

                {

                    method:
                        "PUT",

                    body:
                        JSON.stringify(

                            adaptTaskToAPI(
                                task
                            )

                        )

                }

            );


        return adaptTaskFromAPI(
            updated
        );

    }


    function deleteTask(
        id
    ) {

        return request(

            `/tasks/${encodeURIComponent(id)}`,

            {

                method:
                    "DELETE"

            }

        );

    }


    /* =========================================================
       COMPLETAR TAREA
       ========================================================= */

    async function completeTask(
        id
    ) {

        const response =
            await request(

                `/tasks/${encodeURIComponent(id)}/complete`,

                {

                    method:
                        "PATCH"

                }

            );


        return adaptTaskFromAPI(

            response?.task ??

            response

        );

    }


    /* =========================================================
       REABRIR TAREA
       ========================================================= */

    async function reopenTask(
        id
    ) {

        const response =
            await request(

                `/tasks/${encodeURIComponent(id)}/reopen`,

                {

                    method:
                        "PATCH"

                }

            );


        return adaptTaskFromAPI(

            response?.task ??

            response

        );

    }


    /* =========================================================
       ASIGNAR COLABORADOR A TAREA
       ========================================================= */

    function assignCollaborator(
        taskId,
        collaboratorId
    ) {

        return request(

            `/tasks/${encodeURIComponent(taskId)}/collaborators/${encodeURIComponent(collaboratorId)}`,

            {

                method:
                    "POST"

            }

        );

    }


    /* =========================================================
       QUITAR COLABORADOR DE TAREA
       ========================================================= */

    function removeCollaborator(
        taskId,
        collaboratorId
    ) {

        return request(

            `/tasks/${encodeURIComponent(taskId)}/collaborators/${encodeURIComponent(collaboratorId)}`,

            {

                method:
                    "DELETE"

            }

        );

    }


    /* =========================================================
       INFORMACIÓN DE CONEXIÓN
       ========================================================= */

    function getAPIURL() {

        return API_URL;

    }


    /* =========================================================
       API PÚBLICA
       ========================================================= */

    return {

        /* -------------------------
           PROYECTOS
           ------------------------- */

        getProjects,

        createProject,

        updateProject,

        deleteProject,


        /* -------------------------
           COLABORADORES
           ------------------------- */

        getCollaborators,

        createCollaborator,

        updateCollaborator,

        deleteCollaborator,


        /* -------------------------
           TAREAS
           ------------------------- */

        getTasks,

        createTask,

        updateTask,

        deleteTask,

        completeTask,

        reopenTask,


        /* -------------------------
           INTEGRANTES
           ------------------------- */

        assignCollaborator,

        removeCollaborator,


        /* -------------------------
           INFORMACIÓN
           ------------------------- */

        getAPIURL

    };

})();