const TaskFlowAPI = (() => {

    // Durante el desarrollo local:
    const API_URL = "http://localhost:3000/api";

    async function request(
        endpoint,
        options = {}
    ) {
        const response =
            await fetch(
                `${API_URL}${endpoint}`,
                {
                    ...options,
                    headers: {
                        "Content-Type":
                            "application/json",
                        ...(options.headers || {})
                    }
                }
            );

        let data = null;

        try {
            data =
                await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                `Error HTTP ${response.status}`
            );
        }

        return data;
    }


    /* =========================================================
       ADAPTADORES
       ========================================================= */

    function adaptTaskFromAPI(task) {
        if (!task) {
            return task;
        }

        return {
            ...task,

            secondaryTask:
                task.secondaryTask ??
                task.secondary_task ??
                "",

            projectId:
                task.projectId ??
                task.project_id ??
                "",

            date:
                task.date ??
                task.task_date ??
                "",

            completedAt:
                task.completedAt ??
                task.completed_at ??
                null,

            createdAt:
                task.createdAt ??
                task.created_at ??
                null,

            members:
                Array.isArray(
                    task.members
                )
                    ? task.members
                        .map(member =>
                            typeof member ===
                            "object"
                                ? member?.id
                                : member
                        )
                        .filter(Boolean)
                    : []
        };
    }

    function adaptTaskToAPI(task) {
        return {
            ...(task.id
                ? { id: task.id }
                : {}),

            title:
                task.title || "",

            secondaryTask:
                task.secondaryTask ||
                task.secondary_task ||
                "",

            company:
                task.company ||
                task.EMPRESA ||
                "",

            observations:
                task.observations ||
                task.OBSERVACIONES ||
                "",

            priority:
                task.priority ||
                "media",

            projectId:
                task.projectId ||
                null,

            date:
                task.date ||
                null
        };
    }

    function adaptProjectFromAPI(
        project
    ) {
        return {
            ...project,

            createdAt:
                project.createdAt ??
                project.created_at ??
                null
        };
    }

    function adaptCollaboratorFromAPI(
        collaborator
    ) {
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

    function deleteProject(id) {
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

        return tasks.map(
            adaptTaskFromAPI
        );
    }

    async function createTask(task) {
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

    function deleteTask(id) {
        return request(
            `/tasks/${encodeURIComponent(id)}`,
            {
                method:
                    "DELETE"
            }
        );
    }

    async function completeTask(id) {
        const response =
            await request(
                `/tasks/${encodeURIComponent(id)}/complete`,
                {
                    method:
                        "PATCH"
                }
            );

        return adaptTaskFromAPI(
            response?.task ||
            response
        );
    }

    async function reopenTask(id) {
        const response =
            await request(
                `/tasks/${encodeURIComponent(id)}/reopen`,
                {
                    method:
                        "PATCH"
                }
            );

        return adaptTaskFromAPI(
            response?.task ||
            response
        );
    }


    /* =========================================================
       INTEGRANTES DE TAREAS
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
       API PÚBLICA
       ========================================================= */

    return {
        getProjects,
        createProject,
        updateProject,
        deleteProject,

        getCollaborators,
        createCollaborator,
        updateCollaborator,
        deleteCollaborator,

        getTasks,
        createTask,
        updateTask,
        deleteTask,
        completeTask,
        reopenTask,

        assignCollaborator,
        removeCollaborator
    };

})();
