document.addEventListener("DOMContentLoaded", () => {
    let tasks = JSON.parse(localStorage.getItem("taskflow_tasks")) || [];
    let collaborators = JSON.parse(localStorage.getItem("taskflow_collaborators")) || [];
    let projects = JSON.parse(localStorage.getItem("taskflow_projects")) || [];

    const JSON_DATA_URL = "data.json";
    const FILTER_STORAGE_KEY = "taskflow_task_filter";

    /* =========================================================
       CONFIGURACIÓN DE ICONOS DE PROYECTOS
       ========================================================= */

    const DEFAULT_PROJECT_ICON = "fa-folder";

    const PROJECT_ICONS = [
        "fa-folder",
        "fa-briefcase",
        "fa-house",
        "fa-building",
        "fa-users",
        "fa-user",
        "fa-chart-line",
        "fa-chart-pie",
        "fa-money-bill",
        "fa-credit-card",
        "fa-cart-shopping",
        "fa-bullhorn",
        "fa-calendar",
        "fa-list-check",
        "fa-clipboard",
        "fa-file",
        "fa-file-lines",
        "fa-book",
        "fa-graduation-cap",
        "fa-lightbulb",
        "fa-star",
        "fa-heart",
        "fa-gear",
        "fa-code",
        "fa-laptop",
        "fa-mobile-screen",
        "fa-database",
        "fa-server",
        "fa-truck",
        "fa-box",
        "fa-warehouse",
        "fa-gear"
    ];

    function normalizeProjectIcon(icon) {
        if (!icon) {
            return DEFAULT_PROJECT_ICON;
        }

        let value = String(icon).trim();

        /*
         * Permite que se guarde tanto:
         *
         * fa-folder
         *
         * como:
         *
         * fa-solid fa-folder
         *
         * y siempre devuelve solamente
         * la clase del icono.
         */

        value = value
            .replace(/\bfa-solid\b/g, "")
            .replace(/\bfa-regular\b/g, "")
            .replace(/\bfa-brands\b/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (!value.startsWith("fa-")) {
            return DEFAULT_PROJECT_ICON;
        }

        return value;
    }

    function getProjectIcon(project) {
        return normalizeProjectIcon(
            project?.icon ||
            project?.icono ||
            project?.ICONO ||
            DEFAULT_PROJECT_ICON
        );
    }

    function generateTemporaryId() {
        return "task_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8);
    }

    function generateId(prefix = "id") {
        return prefix +
            "_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8);
    }

    function hashString(str) {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            hash =
                (hash << 5) -
                hash +
                str.charCodeAt(i);

            hash |= 0;
        }

        return Math.abs(hash).toString(36);
    }

    function normalizeEstado(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function isTaskCompleted(task) {
        const estado = normalizeEstado(
            task["ESTADO"] ||
            task.estado ||
            task.status ||
            task.state
        );

        const estadosCompletados = [
            "finalizada",
            "finalizado",
            "completada",
            "completado",
            "terminada",
            "terminado",
            "cerrada",
            "cerrado"
        ];

        if (estadosCompletados.includes(estado)) {
            return true;
        }

        return task.completed === true;
    }

    function normalizeTask(task) {
        const completed =
            isTaskCompleted(task);

        task.completed =
            completed;

        if (completed) {
            task.status =
                "Finalizado";

            task.ESTADO =
                "Finalizado";

            if (!task.completedAt) {
                const fechaFinalizada =
                    task["FECHA FINALIZADA"] ||
                    task.completedDate ||
                    "";

                if (fechaFinalizada) {
                    const partes =
                        String(
                            fechaFinalizada
                        ).split("/");

                    if (partes.length === 3) {
                        const dia =
                            partes[0]
                                .padStart(2, "0");

                        const mes =
                            partes[1]
                                .padStart(2, "0");

                        const anio =
                            partes[2].length === 2
                                ? `20${partes[2]}`
                                : partes[2];

                        task.completedAt =
                            `${anio}-${mes}-${dia}T00:00:00`;
                    } else {
                        task.completedAt =
                            new Date().toISOString();
                    }
                } else {
                    task.completedAt =
                        new Date().toISOString();
                }
            }
        } else {
            task.completed =
                false;
        }

        if (
            !task.title &&
            task["TAREA PRINCIPAL"]
        ) {
            task.title =
                task["TAREA PRINCIPAL"];
        }

        if (
            !task.priority &&
            task.PRIORIDAD
        ) {
            const prioridad =
                normalizeEstado(
                    task.PRIORIDAD
                );

            if (prioridad === "alta") {
                task.priority =
                    "alta";
            } else if (
                prioridad === "baja"
            ) {
                task.priority =
                    "baja";
            } else {
                task.priority =
                    "media";
            }
        }

        if (
            !task.date &&
            task["FECHA REGISTRO"]
        ) {
            const fecha =
                String(
                    task["FECHA REGISTRO"]
                ).trim();

            const partes =
                fecha.split("/");

            if (partes.length === 3) {
                const dia =
                    partes[0].padStart(
                        2,
                        "0"
                    );

                const mes =
                    partes[1].padStart(
                        2,
                        "0"
                    );

                const anio =
                    partes[2].length === 2
                        ? `20${partes[2]}`
                        : partes[2];

                task.date =
                    `${anio}-${mes}-${dia}`;
            }
        }

        if (!task.id) {
            task.id =
                generateTemporaryId();
        }

        return task;
    }

    tasks =
        tasks.map(
            normalizeTask
        );

    /*
     * Normalizamos proyectos antiguos.
     *
     * Los proyectos existentes que fueron
     * creados antes de implementar iconos
     * reciben automáticamente fa-folder.
     */

    projects =
        projects.map(project => ({
            ...project,
            icon:
                getProjectIcon(project)
        }));

    function saveData() {
        localStorage.setItem(
            "taskflow_tasks",
            JSON.stringify(tasks)
        );

        localStorage.setItem(
            "taskflow_collaborators",
            JSON.stringify(collaborators)
        );

        localStorage.setItem(
            "taskflow_projects",
            JSON.stringify(projects)
        );
    }

    let currentMembersTaskId =
        null;

    let currentEditingTaskId =
        null;

    let currentEditingProjectId =
        null;

    let selectedMembers =
        [];

    let currentTaskFilter =
        localStorage.getItem(
            FILTER_STORAGE_KEY
        ) || "newest";

    const menuItems =
        document.querySelectorAll(
            ".menu-item"
        );

    const floatingOptions =
        document.querySelectorAll(
            ".floating-menu-options button"
        );

    const views =
        document.querySelectorAll(
            ".view"
        );

    const floatingMenuButton =
        document.getElementById(
            "floatingMenuButton"
        );

    const floatingMenuOptions =
        document.getElementById(
            "floatingMenuOptions"
        );

    const taskTableBody =
        document.getElementById(
            "taskTableBody"
        );

    const emptyTaskState =
        document.getElementById(
            "emptyTaskState"
        );

    const taskInputRow =
        document.getElementById(
            "taskInputRow"
        );

    const inlineTaskInput =
        document.getElementById(
            "inlineTaskInput"
        );

    const inlinePriority =
        document.getElementById(
            "inlinePriority"
        );

    const inlineProject =
        document.getElementById(
            "inlineProject"
        );

    const inlineDate =
        document.getElementById(
            "inlineDate"
        );

    const saveInlineTask =
        document.getElementById(
            "saveInlineTask"
        );

    const taskSearch =
        document.getElementById(
            "taskSearch"
        );

    const taskFilterPriority =
        document.getElementById(
            "taskFilterPriority"
        );

    const taskFilterProject =
        document.getElementById(
            "taskFilterProject"
        );

    const totalTasks =
        document.getElementById(
            "totalTasks"
        );

    const pendingTasks =
        document.getElementById(
            "pendingTasks"
        );

    const completedTasks =
        document.getElementById(
            "completedTasks"
        );

    const taskProgress =
        document.getElementById(
            "taskProgress"
        );

    const taskCountLabel =
        document.getElementById(
            "taskCountLabel"
        );

    const collaboratorsGrid =
        document.getElementById(
            "collaboratorsGrid"
        );

    const emptyCollaborators =
        document.getElementById(
            "emptyCollaborators"
        );

    const collaboratorCount =
        document.getElementById(
            "collaboratorCount"
        );

    const collaboratorSearch =
        document.getElementById(
            "collaboratorSearch"
        );

    const projectsGrid =
        document.getElementById(
            "projectsGrid"
        );

    const emptyProjects =
        document.getElementById(
            "emptyProjects"
        );

    const completedTableBody =
        document.getElementById(
            "completedTableBody"
        );

    const emptyCompleted =
        document.getElementById(
            "emptyCompleted"
        );

    const completedTotalPage =
        document.getElementById(
            "completedTotalPage"
        );

    const completedSearch =
        document.getElementById(
            "completedSearch"
        );

    const collaboratorModal =
        document.getElementById(
            "collaboratorModal"
        );

    const projectModal =
        document.getElementById(
            "projectModal"
        );

    const membersModal =
        document.getElementById(
            "membersModal"
        );

    const taskEditModal =
        document.getElementById(
            "taskEditModal"
        );

    const newCollaboratorButton =
        document.getElementById(
            "newCollaboratorButton"
        );

    const newProjectButton =
        document.getElementById(
            "newProjectButton"
        );

    const inlineMembersButton =
        document.getElementById(
            "inlineMembersButton"
        );

    const saveMembersButton =
        document.getElementById(
            "saveMembersButton"
        );

    const newTaskButton =
        document.getElementById(
            "newTaskButton"
        );

    /*
     * Elementos opcionales para el selector
     * de iconos del proyecto.
     *
     * Si todavía no existen en el HTML,
     * el sistema continúa funcionando.
     */

    const projectIconInput =
        document.getElementById(
            "projectIcon"
        );

    const projectIconPreview =
        document.getElementById(
            "projectIconPreview"
        );

    const projectIconSelector =
        document.getElementById(
            "projectIconSelector"
        );

    function escapeHTML(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    function formatDate(date) {
        if (!date) return "—";

        const value =
            String(date);

        if (value.includes("T")) {
            return formatDate(
                value.substring(
                    0,
                    10
                )
            );
        }

        const parts =
            value.split("-");

        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        const slashParts =
            value.split("/");

        if (slashParts.length === 3) {
            return `${slashParts[0].padStart(2, "0")}/${slashParts[1]}/${slashParts[2]}`;
        }

        return value;
    }

    function getProjectName(projectId) {
        if (!projectId) {
            return "Sin proyecto";
        }

        const project =
            projects.find(
                p =>
                    p.id === projectId
            );

        return project
            ? project.name
            : "Sin proyecto";
    }

    function getCollaborator(id) {
        return collaborators.find(
            c =>
                c.id === id
        );
    }

    function getInitials(name) {
        if (!name) return "?";

        const words =
            name.trim()
                .split(/\s+/);

        if (words.length === 1) {
            return words[0]
                .substring(
                    0,
                    2
                )
                .toUpperCase();
        }

        return (
            words[0][0] +
            words[
                words.length - 1
            ][0]
        ).toUpperCase();
    }

    function showToast(
        message,
        type = "success"
    ) {
        const container =
            document.getElementById(
                "toastContainer"
            );

        if (!container) return;

        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            `toast toast-${type}`;

        let icon =
            "fa-check";

        if (type === "error") {
            icon =
                "fa-circle-exclamation";
        }

        if (type === "warning") {
            icon =
                "fa-triangle-exclamation";
        }

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${escapeHTML(message)}</span>
        `;

        container.appendChild(
            toast
        );

        setTimeout(
            () =>
                toast.classList.add(
                    "show"
                ),
            10
        );

        setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );

                setTimeout(
                    () =>
                        toast.remove(),
                    300
                );
            },
            3000
        );
    }

    function actualizarTareasFinalizadas() {
        let cambios = false;

        tasks.forEach(task => {
            const antes =
                task.completed;

            normalizeTask(task);

            if (
                antes !==
                task.completed
            ) {
                cambios = true;
            }
        });

        if (cambios) {
            saveData();
        }
    }

    actualizarTareasFinalizadas();

    /* =========================================================
       SELECTOR DE ICONOS
       ========================================================= */

    function renderProjectIconSelector(
        selectedIcon = DEFAULT_PROJECT_ICON
    ) {
        const selector =
            document.getElementById(
                "projectIconSelector"
            );

        if (!selector) return;

        selectedIcon =
            normalizeProjectIcon(
                selectedIcon
            );

        selector.innerHTML = "";

        PROJECT_ICONS.forEach(
            icon => {
                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "project-icon-option";

                button.dataset.icon =
                    icon;

                if (
                    icon ===
                    selectedIcon
                ) {
                    button.classList.add(
                        "active"
                    );
                }

                button.innerHTML = `
                    <i class="fa-solid ${escapeHTML(icon)}"></i>
                `;

                button.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        event.stopPropagation();

                        setSelectedProjectIcon(
                            icon
                        );
                    }
                );

                selector.appendChild(
                    button
                );
            }
        );

        updateProjectIconPreview(
            selectedIcon
        );
    }

    function setSelectedProjectIcon(
        icon
    ) {
        icon =
            normalizeProjectIcon(
                icon
            );

        if (projectIconInput) {
            projectIconInput.value =
                icon;
        }

        updateProjectIconPreview(
            icon
        );

        const selector =
            document.getElementById(
                "projectIconSelector"
            );

        if (selector) {
            selector
                .querySelectorAll(
                    ".project-icon-option"
                )
                .forEach(button => {
                    button.classList.toggle(
                        "active",
                        button.dataset.icon ===
                            icon
                    );
                });
        }
    }

    function updateProjectIconPreview(
        icon
    ) {
        if (!projectIconPreview) {
            return;
        }

        icon =
            normalizeProjectIcon(
                icon
            );

        projectIconPreview.innerHTML = `
            <i class="fa-solid ${escapeHTML(icon)}"></i>
        `;
    }

    function initializeProjectIconSelector() {
        const existing =
            projectIconInput?.value ||
            DEFAULT_PROJECT_ICON;

        renderProjectIconSelector(
            existing
        );
    }

    /* =========================================================
       NAVEGACIÓN
       ========================================================= */

    function changeView(
        viewName
    ) {
        views.forEach(view => {
            view.classList.remove(
                "active"
            );

            view.style.display =
                "none";
        });

        const target =
            document.getElementById(
                `view-${viewName}`
            );

        if (target) {
            target.classList.add(
                "active"
            );

            target.style.display =
                "block";
        }

        menuItems.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.view ===
                    viewName
            );
        });

        floatingOptions.forEach(
            button => {
                button.classList.toggle(
                    "active",
                    button.dataset.view ===
                        viewName
                );
            }
        );

        if (floatingMenuOptions) {
            floatingMenuOptions.classList.remove(
                "open"
            );
        }

        updateAll();
    }

    menuItems.forEach(button => {
        button.addEventListener(
            "click",
            () =>
                changeView(
                    button.dataset.view
                )
        );
    });

    floatingOptions.forEach(
        button => {
            button.addEventListener(
                "click",
                () =>
                    changeView(
                        button.dataset.view
                    )
            );
        }
    );

    if (floatingMenuButton) {
        floatingMenuButton.addEventListener(
            "click",
            () => {
                floatingMenuOptions.classList.toggle(
                    "open"
                );
            }
        );
    }

    document.addEventListener(
        "click",
        event => {
            if (
                !event.target.closest(
                    ".floating-menu"
                ) &&
                floatingMenuOptions
            ) {
                floatingMenuOptions.classList.remove(
                    "open"
                );
            }
        }
    );

    /* =========================================================
       CREAR TAREA
       ========================================================= */

    function createTask() {
        const title =
            inlineTaskInput.value.trim();

        if (!title) {
            showToast(
                "Escribe el nombre de la tarea.",
                "warning"
            );

            inlineTaskInput.focus();
            return;
        }

        const task = {
            id: generateId("task"),
            title,
            priority:
                inlinePriority.value ||
                "media",
            projectId:
                inlineProject.value ||
                "",
            members: [],
            date:
                inlineDate.value ||
                "",
            completed: false,
            createdAt:
                new Date().toISOString(),
            completedAt: null
        };

        tasks.push(task);

        saveData();

        inlineTaskInput.value =
            "";

        inlinePriority.value =
            "media";

        inlineProject.value =
            "";

        inlineDate.value =
            "";

        renderTasks();
        updateAll();

        showToast(
            "Tarea creada correctamente."
        );
    }

    if (saveInlineTask) {
        saveInlineTask.addEventListener(
            "click",
            createTask
        );
    }

    if (inlineTaskInput) {
        inlineTaskInput.addEventListener(
            "keydown",
            event => {
                if (
                    event.key ===
                    "Enter"
                ) {
                    event.preventDefault();
                    createTask();
                }
            }
        );
    }

    if (newTaskButton) {
        newTaskButton.addEventListener(
            "click",
            () => {
                inlineTaskInput.focus();

                document
                    .getElementById(
                        "view-tareas"
                    )
                    ?.scrollIntoView({
                        behavior:
                            "smooth"
                    });
            }
        );
    }

    /* =========================================================
       FECHAS Y ORDENAMIENTO
       ========================================================= */

    function getTaskDateValue(
        task
    ) {
        const value =
            task.date ||
            task["FECHA REGISTRO"] ||
            task.createdAt ||
            "";

        if (!value) return 0;

        const date =
            String(value);

        if (date.includes("/")) {
            const parts =
                date.split("/");

            if (parts.length === 3) {
                return (
                    new Date(
                        `${parts[2]}-${parts[1]}-${parts[0]}`
                    ).getTime() ||
                    0
                );
            }
        }

        return (
            new Date(date).getTime() ||
            0
        );
    }

    function getTaskRegistrationValue(
        task
    ) {
        if (task.createdAt) {
            return (
                new Date(
                    task.createdAt
                ).getTime() ||
                0
            );
        }

        const value =
            task["FECHA REGISTRO"] ||
            task.date ||
            "";

        return getTaskDateValue({
            date: value
        });
    }

    function sortTasks(
        taskList
    ) {
        const sorted =
            [...taskList];

        if (
            currentTaskFilter ===
            "newest"
        ) {
            sorted.sort(
                (a, b) =>
                    getTaskRegistrationValue(
                        b
                    ) -
                    getTaskRegistrationValue(
                        a
                    )
            );
        } else if (
            currentTaskFilter ===
            "registration"
        ) {
            sorted.sort(
                (a, b) =>
                    getTaskRegistrationValue(
                        a
                    ) -
                    getTaskRegistrationValue(
                        b
                    )
            );
        } else if (
            currentTaskFilter ===
            "dateDesc"
        ) {
            sorted.sort(
                (a, b) =>
                    getTaskDateValue(
                        b
                    ) -
                    getTaskDateValue(
                        a
                    )
            );
        } else if (
            currentTaskFilter ===
            "dateAsc"
        ) {
            sorted.sort(
                (a, b) =>
                    getTaskDateValue(
                        a
                    ) -
                    getTaskDateValue(
                        b
                    )
            );
        }

        return sorted;
    }

    function getFilteredTasks() {
        const search =
            (
                taskSearch?.value ||
                ""
            )
                .toLowerCase()
                .trim();

        const priority =
            taskFilterPriority?.value ||
            "all";

        const project =
            taskFilterProject?.value ||
            "all";

        const filtered =
            tasks.filter(task => {
                if (
                    isTaskCompleted(
                        task
                    )
                ) {
                    return false;
                }

                const title =
                    String(
                        task.title ||
                        task["TAREA PRINCIPAL"] ||
                        ""
                    ).toLowerCase();

                const projectName =
                    getProjectName(
                        task.projectId
                    ).toLowerCase();

                const matchesSearch =
                    !search ||
                    title.includes(
                        search
                    ) ||
                    projectName.includes(
                        search
                    );

                const matchesPriority =
                    priority === "all" ||
                    task.priority ===
                        priority;

                const matchesProject =
                    project === "all" ||
                    task.projectId ===
                        project;

                return (
                    matchesSearch &&
                    matchesPriority &&
                    matchesProject
                );
            });

        return sortTasks(
            filtered
        );
    }

    /* =========================================================
       RENDERIZAR TAREAS
       ========================================================= */

    function renderTasks() {
        if (!taskTableBody) {
            return;
        }

        const filtered =
            getFilteredTasks();

        taskTableBody.innerHTML =
            "";

        if (emptyTaskState) {
            emptyTaskState.style.display =
                filtered.length
                    ? "none"
                    : "flex";
        }

        filtered.forEach(task => {
            const row =
                document.createElement(
                    "tr"
                );

            row.dataset.id =
                task.id;

            const projectName =
                getProjectName(
                    task.projectId
                );

            let membersHTML =
                "";

            if (
                task.members &&
                task.members.length
            ) {
                membersHTML =
                    `<div class="members-list">`;

                task.members
                    .slice(0, 3)
                    .forEach(
                        memberId => {
                            const member =
                                getCollaborator(
                                    memberId
                                );

                            if (!member) {
                                return;
                            }

                            membersHTML += `
                                <span
                                    class="member-avatar"
                                    title="${escapeHTML(member.name)}"
                                >
                                    ${escapeHTML(
                                        getInitials(
                                            member.name
                                        )
                                    )}
                                </span>
                            `;
                        }
                    );

                if (
                    task.members.length >
                    3
                ) {
                    membersHTML += `
                        <span class="member-more">
                            +${task.members.length - 3}
                        </span>
                    `;
                }

                membersHTML +=
                    "</div>";
            } else {
                membersHTML = `
                    <button
                        class="assign-members-small"
                        data-action="members"
                        data-id="${task.id}"
                    >
                        <i class="fa-solid fa-user-plus"></i>
                        Asignar
                    </button>
                `;
            }

            const title =
                task.title ||
                task["TAREA PRINCIPAL"] ||
                "Sin título";

            row.innerHTML = `
                <td class="col-check">
                    <input
                        type="checkbox"
                        class="task-checkbox"
                        data-id="${task.id}"
                    >
                </td>

                <td class="col-task">
                    <div class="task-title-cell">
                        <strong>
                            ${escapeHTML(title)}
                        </strong>
                    </div>
                </td>

                <td class="col-priority">
                    <span
                        class="priority-badge ${
                            task.priority ||
                            "media"
                        }"
                    >
                        ${priorityLabel(
                            task.priority
                        )}
                    </span>
                </td>

                <td class="col-project">
                    <span class="project-name">
                        ${escapeHTML(
                            projectName
                        )}
                    </span>
                </td>

                <td class="col-members">
                    ${membersHTML}
                </td>

                <td class="col-date">
                    ${formatDate(
                        task.date
                    )}
                </td>

                <td class="col-status">
                    <span class="status-badge pending">
                        Pendiente
                    </span>
                </td>

                <td class="col-actions">
                    <div class="task-actions">
                        <button
                            class="row-action"
                            data-action="edit"
                            data-id="${task.id}"
                            title="Editar"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="row-action danger"
                            data-action="delete"
                            data-id="${task.id}"
                            title="Eliminar"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            taskTableBody.appendChild(
                row
            );
        });

        if (taskCountLabel) {
            taskCountLabel.textContent =
                `${filtered.length} ${
                    filtered.length === 1
                        ? "tarea"
                        : "tareas"
                }`;
        }
    }

    function priorityLabel(
        priority
    ) {
        if (
            priority === "alta"
        ) {
            return "Alta";
        }

        if (
            priority === "baja"
        ) {
            return "Baja";
        }

        return "Media";
    }

    if (taskTableBody) {
        taskTableBody.addEventListener(
            "click",
            event => {
                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) {
                    return;
                }

                const id =
                    button.dataset.id;

                const action =
                    button.dataset.action;

                if (
                    action === "edit"
                ) {
                    openTaskEdit(id);
                }

                if (
                    action === "delete"
                ) {
                    deleteTask(id);
                }

                if (
                    action === "members"
                ) {
                    openMembersModal(
                        id
                    );
                }
            }
        );

        taskTableBody.addEventListener(
            "change",
            event => {
                if (
                    !event.target.classList.contains(
                        "task-checkbox"
                    )
                ) {
                    return;
                }

                completeTask(
                    event.target.dataset.id
                );
            }
        );
    }

    function completeTask(id) {
        const task =
            tasks.find(
                t =>
                    t.id === id
            );

        if (!task) return;

        task.completed =
            true;

        task.status =
            "Finalizado";

        task.ESTADO =
            "Finalizado";

        task.completedAt =
            new Date().toISOString();

        saveData();

        renderTasks();
        renderCompleted();
        updateAll();

        showToast(
            "Tarea completada."
        );
    }

    function restoreTask(id) {
        const task =
            tasks.find(
                t =>
                    t.id === id
            );

        if (!task) return;

        task.completed =
            false;

        task.status =
            "Pendiente";

        task.ESTADO =
            "Pendiente";

        task.completedAt =
            null;

        saveData();

        renderTasks();
        renderCompleted();
        updateAll();

        showToast(
            "Tarea restaurada correctamente."
        );
    }

    function deleteTask(id) {
        const task =
            tasks.find(
                t =>
                    t.id === id
            );

        if (!task) return;

        const title =
            task.title ||
            task["TAREA PRINCIPAL"] ||
            "esta tarea";

        if (
            !confirm(
                `¿Eliminar la tarea "${title}"?`
            )
        ) {
            return;
        }

        tasks =
            tasks.filter(
                t =>
                    t.id !== id
            );

        saveData();

        renderTasks();
        updateAll();

        showToast(
            "Tarea eliminada."
        );
    }

    if (taskSearch) {
        taskSearch.addEventListener(
            "input",
            renderTasks
        );
    }

    if (taskFilterPriority) {
        taskFilterPriority.addEventListener(
            "change",
            renderTasks
        );
    }

    if (taskFilterProject) {
        taskFilterProject.addEventListener(
            "change",
            renderTasks
        );
    }

    /* =========================================================
       FILTROS
       ========================================================= */

    function createFiltersPanel() {
        if (
            document.getElementById(
                "taskFiltersPanel"
            )
        ) {
            return;
        }

        const filterButton =
            document.getElementById(
                "filterButton"
            );

        if (!filterButton) {
            return;
        }

        const panel =
            document.createElement(
                "div"
            );

        panel.id =
            "taskFiltersPanel";

        panel.innerHTML = `
            <div class="task-filters-header">
                <strong>Filtros</strong>
            </div>

            <div
                class="task-filter-option"
                data-filter="newest"
            >
                <span>
                    Mostrar tareas Nuevas siempre primero
                </span>

                <button
                    type="button"
                    class="filter-switch"
                >
                    <span></span>
                </button>
            </div>

            <div
                class="task-filter-option"
                data-filter="registration"
            >
                <span>
                    Mostrar en orden de registro
                </span>

                <button
                    type="button"
                    class="filter-switch"
                >
                    <span></span>
                </button>
            </div>

            <div
                class="task-filter-option"
                data-filter="dateDesc"
            >
                <span>
                    Mostrar por fecha Descendente
                </span>

                <button
                    type="button"
                    class="filter-switch"
                >
                    <span></span>
                </button>
            </div>

            <div
                class="task-filter-option"
                data-filter="dateAsc"
            >
                <span>
                    Mostrar por fecha Ascendente
                </span>

                <button
                    type="button"
                    class="filter-switch"
                >
                    <span></span>
                </button>
            </div>
        `;

        filterButton.parentElement.style.position =
            "relative";

        filterButton.parentElement.appendChild(
            panel
        );

        panel
            .querySelectorAll(
                ".task-filter-option"
            )
            .forEach(option => {
                option.addEventListener(
                    "click",
                    event => {
                        event.stopPropagation();

                        currentTaskFilter =
                            option.dataset.filter;

                        localStorage.setItem(
                            FILTER_STORAGE_KEY,
                            currentTaskFilter
                        );

                        updateFilterSwitches();
                        renderTasks();
                    }
                );
            });

        updateFilterSwitches();
    }

    function updateFilterSwitches() {
        const panel =
            document.getElementById(
                "taskFiltersPanel"
            );

        if (!panel) {
            return;
        }

        panel
            .querySelectorAll(
                ".task-filter-option"
            )
            .forEach(option => {
                const active =
                    option.dataset.filter ===
                    currentTaskFilter;

                option.classList.toggle(
                    "active",
                    active
                );

                const switchButton =
                    option.querySelector(
                        ".filter-switch"
                    );

                if (switchButton) {
                    switchButton.classList.toggle(
                        "active",
                        active
                    );
                }
            });
    }

    function setupFilterStyles() {
        if (
            document.getElementById(
                "taskFilterStyles"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "taskFilterStyles";

        style.textContent = `
            #taskFiltersPanel{
                position:absolute;
                top:calc(100% + 10px);
                right:0;
                width:340px;
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:14px;
                padding:8px;
                box-shadow:0 12px 35px rgba(0,0,0,.12);
                z-index:9999;
            }

            .task-filters-header{
                padding:10px 12px 12px;
                border-bottom:1px solid #f0f0f0;
                margin-bottom:4px;
                font-size:14px;
            }

            .task-filter-option{
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
                padding:12px;
                border-radius:10px;
                cursor:pointer;
                font-size:13px;
                color:#374151;
            }

            .task-filter-option:hover{
                background:#f8fafc;
            }

            .task-filter-option.active{
                background:#eff6ff;
                color:#1d4ed8;
            }

            .filter-switch{
                flex:none;
                width:40px;
                height:22px;
                border:0;
                border-radius:20px;
                background:#d1d5db;
                padding:3px;
                cursor:pointer;
                transition:.2s;
            }

            .filter-switch span{
                display:block;
                width:16px;
                height:16px;
                border-radius:50%;
                background:#fff;
                transition:.2s;
                box-shadow:0 1px 3px rgba(0,0,0,.2);
            }

            .filter-switch.active{
                background:#2563eb;
            }

            .filter-switch.active span{
                transform:translateX(18px);
            }

            .restore-task{
                color:#2563eb;
            }

            .restore-task:hover{
                background:#eff6ff;
            }
        `;

        document.head.appendChild(
            style
        );
    }

    const filterButton =
        document.getElementById(
            "filterButton"
        );

    if (filterButton) {
        setupFilterStyles();
        createFiltersPanel();

        filterButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                const panel =
                    document.getElementById(
                        "taskFiltersPanel"
                    );

                if (panel) {
                    panel.style.display =
                        panel.style.display ===
                        "none"
                            ? "block"
                            : "none";
                }
            }
        );

        document.addEventListener(
            "click",
            event => {
                const panel =
                    document.getElementById(
                        "taskFiltersPanel"
                    );

                if (!panel) {
                    return;
                }

                if (
                    !event.target.closest(
                        "#taskFiltersPanel"
                    ) &&
                    !event.target.closest(
                        "#filterButton"
                    )
                ) {
                    panel.style.display =
                        "none";
                }
            }
        );
    }

    /* =========================================================
       SELECTORES DE PROYECTOS
       ========================================================= */

    function renderProjectSelects() {
        const selects = [
            inlineProject,
            document.getElementById(
                "editTaskProject"
            ),
            taskFilterProject
        ];

        selects.forEach(select => {
            if (!select) {
                return;
            }

            const current =
                select.value;

            const isFilter =
                select ===
                taskFilterProject;

            select.innerHTML =
                isFilter
                    ? `<option value="all">Todos los proyectos</option>`
                    : `<option value="">Sin proyecto</option>`;

            projects.forEach(
                project => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        project.id;

                    option.textContent =
                        project.name;

                    select.appendChild(
                        option
                    );
                }
            );

            if (
                [
                    ...select.options
                ].some(
                    option =>
                        option.value ===
                        current
                )
            ) {
                select.value =
                    current;
            }
        });
    }

    /* =========================================================
       RENDERIZAR PROYECTOS
       ========================================================= */

    function renderProjects() {
        if (!projectsGrid) {
            return;
        }

        projectsGrid.innerHTML =
            "";

        if (!projects.length) {
            emptyProjects.style.display =
                "flex";

            return;
        }

        emptyProjects.style.display =
            "none";

        projects.forEach(
            project => {
                const projectTasks =
                    tasks.filter(
                        task =>
                            task.projectId ===
                            project.id
                    );

                const completed =
                    projectTasks.filter(
                        task =>
                            isTaskCompleted(
                                task
                            )
                    ).length;

                const total =
                    projectTasks.length;

                const progress =
                    total
                        ? Math.round(
                            completed /
                            total *
                            100
                        )
                        : 0;

                const icon =
                    getProjectIcon(
                        project
                    );

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "project-card";

                card.innerHTML = `
                    <div class="project-card-header">

                        <div class="project-icon">
                            <i class="fa-solid ${escapeHTML(icon)}"></i>
                        </div>

                        <button
                            class="row-action danger"
                            data-delete-project="${project.id}"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                    <h3>
                        ${escapeHTML(
                            project.name
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            project.description ||
                            "Sin descripción"
                        )}
                    </p>

                    <div class="project-progress">

                        <div class="project-progress-header">
                            <span>Progreso</span>

                            <strong>
                                ${progress}%
                            </strong>
                        </div>

                        <div class="progress-track">
                            <div
                                class="progress-fill"
                                style="width:${progress}%"
                            ></div>
                        </div>

                    </div>

                    <div class="project-card-footer">
                        <span>
                            ${completed}/${total} tareas
                        </span>
                    </div>
                `;

                projectsGrid.appendChild(
                    card
                );
            }
        );

        projectsGrid
            .querySelectorAll(
                "[data-delete-project]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () =>
                        deleteProject(
                            button.dataset
                                .deleteProject
                        )
                );
            });
    }

    /* =========================================================
       ELIMINAR PROYECTO
       ========================================================= */

    function deleteProject(id) {
        const project =
            projects.find(
                p =>
                    p.id === id
            );

        if (!project) {
            return;
        }

        if (
            tasks.some(
                task =>
                    task.projectId ===
                    id
            )
        ) {
            showToast(
                "No puedes eliminar un proyecto que tiene tareas asignadas.",
                "warning"
            );

            return;
        }

        if (
            !confirm(
                `¿Eliminar el proyecto "${project.name}"?`
            )
        ) {
            return;
        }

        projects =
            projects.filter(
                p =>
                    p.id !== id
            );

        saveData();

        renderProjects();
        renderProjectSelects();

        showToast(
            "Proyecto eliminado."
        );
    }

    /* =========================================================
       FORMULARIO DE PROYECTO
       ========================================================= */

    document
        .getElementById(
            "projectForm"
        )
        ?.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                const name =
                    document
                        .getElementById(
                            "projectName"
                        )
                        .value
                        .trim();

                const description =
                    document
                        .getElementById(
                            "projectDescription"
                        )
                        .value
                        .trim();

                if (!name) {
                    return;
                }

                const selectedIcon =
                    normalizeProjectIcon(
                        projectIconInput?.value ||
                        DEFAULT_PROJECT_ICON
                    );

                /*
                 * Si currentEditingProjectId
                 * existe, actualizamos el proyecto.
                 *
                 * Si no existe, creamos uno nuevo.
                 */

                if (
                    currentEditingProjectId
                ) {
                    const project =
                        projects.find(
                            p =>
                                p.id ===
                                currentEditingProjectId
                        );

                    if (project) {
                        project.name =
                            name;

                        project.description =
                            description;

                        project.icon =
                            selectedIcon;
                    }

                    currentEditingProjectId =
                        null;

                    showToast(
                        "Proyecto actualizado."
                    );
                } else {
                    projects.push({
                        id: generateId(
                            "project"
                        ),
                        name,
                        description,
                        icon:
                            selectedIcon,
                        createdAt:
                            new Date().toISOString()
                    });

                    showToast(
                        "Proyecto creado."
                    );
                }

                saveData();

                event.target.reset();

                setSelectedProjectIcon(
                    DEFAULT_PROJECT_ICON
                );

                closeModal(
                    "projectModal"
                );

                renderProjects();
                renderProjectSelects();
            }
        );

    if (newProjectButton) {
        newProjectButton.addEventListener(
            "click",
            () => {
                currentEditingProjectId =
                    null;

                const form =
                    document.getElementById(
                        "projectForm"
                    );

                if (form) {
                    form.reset();
                }

                setSelectedProjectIcon(
                    DEFAULT_PROJECT_ICON
                );

                initializeProjectIconSelector();

                openModal(
                    "projectModal"
                );
            }
        );
    }

    /* =========================================================
       CONTINUACIÓN EN PARTE 2
       ========================================================= */
           /* =========================================================
       RENDERIZAR PROYECTOS
       ========================================================= */

    function renderProjects() {
        if (!projectsGrid) return;

        projectsGrid.innerHTML = "";

        if (!projects.length) {
            if (emptyProjects) {
                emptyProjects.style.display = "flex";
            }

            return;
        }

        if (emptyProjects) {
            emptyProjects.style.display = "none";
        }

        projects.forEach(project => {

            const projectTasks =
                tasks.filter(
                    task =>
                        task.projectId === project.id
                );

            const completed =
                projectTasks.filter(
                    task =>
                        isTaskCompleted(task)
                ).length;

            const total =
                projectTasks.length;

            const progress =
                total
                    ? Math.round(
                        completed /
                        total *
                        100
                    )
                    : 0;

            /*
             * ICONO DEL PROYECTO
             *
             * Si el proyecto tiene icon definido,
             * se utiliza ese icono.
             *
             * Si no tiene icono, se utiliza
             * fa-folder como valor predeterminado.
             */

            const projectIcon =
                project.icon ||
                "fa-folder";

            const card =
                document.createElement("div");

            card.className =
                "project-card";

            card.innerHTML = `
                <div class="project-card-header">

                    <div class="project-icon">
                        <i class="fa-solid ${escapeHTML(projectIcon)}"></i>
                    </div>

                    <button
                        class="row-action danger"
                        data-delete-project="${project.id}"
                        title="Eliminar proyecto"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

                <h3>
                    ${escapeHTML(project.name)}
                </h3>

                <p>
                    ${escapeHTML(
                        project.description ||
                        "Sin descripción"
                    )}
                </p>

                <div class="project-progress">

                    <div class="project-progress-header">
                        <span>Progreso</span>

                        <strong>
                            ${progress}%
                        </strong>
                    </div>

                    <div class="progress-track">

                        <div
                            class="progress-fill"
                            style="width:${progress}%"
                        ></div>

                    </div>

                </div>

                <div class="project-card-footer">

                    <span>
                        ${completed}/${total}
                        ${
                            total === 1
                                ? "tarea"
                                : "tareas"
                        }
                    </span>

                </div>
            `;

            projectsGrid.appendChild(card);
        });

        projectsGrid
            .querySelectorAll(
                "[data-delete-project]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteProject(
                            button.dataset
                                .deleteProject
                        );

                    }
                );

            });
    }


    /* =========================================================
       ELIMINAR PROYECTO
       ========================================================= */

    function deleteProject(id) {

        const project =
            projects.find(
                p => p.id === id
            );

        if (!project) return;

        const hasTasks =
            tasks.some(
                task =>
                    task.projectId === id
            );

        if (hasTasks) {

            showToast(
                "No puedes eliminar un proyecto que tiene tareas asignadas.",
                "warning"
            );

            return;
        }

        if (
            !confirm(
                `¿Eliminar el proyecto "${project.name}"?`
            )
        ) {
            return;
        }

        projects =
            projects.filter(
                p => p.id !== id
            );

        saveData();

        renderProjects();
        renderProjectSelects();

        showToast(
            "Proyecto eliminado."
        );
    }


    /* =========================================================
       CREAR PROYECTO
       ========================================================= */

    document
        .getElementById("projectForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const name =
                    document
                        .getElementById(
                            "projectName"
                        )
                        ?.value
                        .trim();

                const description =
                    document
                        .getElementById(
                            "projectDescription"
                        )
                        ?.value
                        .trim();

                /*
                 * OBTENER ICONO SELECCIONADO
                 *
                 * El HTML debe tener un elemento:
                 *
                 * #projectIcon
                 *
                 * Puede ser un select o input.
                 */

                const iconInput =
                    document.getElementById(
                        "projectIcon"
                    );

                const icon =
                    iconInput?.value ||
                    "fa-folder";

                if (!name) {

                    showToast(
                        "Escribe el nombre del proyecto.",
                        "warning"
                    );

                    return;
                }

                projects.push({

                    id:
                        generateId(
                            "project"
                        ),

                    name,

                    description,

                    icon,

                    createdAt:
                        new Date().toISOString()

                });

                saveData();

                event.target.reset();

                closeModal(
                    "projectModal"
                );

                renderProjects();
                renderProjectSelects();

                showToast(
                    "Proyecto creado."
                );
            }
        );


    /* =========================================================
       BOTÓN NUEVO PROYECTO
       ========================================================= */

    if (newProjectButton) {

        newProjectButton.addEventListener(
            "click",
            () => {

                openModal(
                    "projectModal"
                );

            }
        );

    }


    /* =========================================================
       COLABORADORES
       ========================================================= */

    function renderCollaborators() {

        if (!collaboratorsGrid) return;

        const search =
            (
                collaboratorSearch?.value ||
                ""
            )
                .toLowerCase()
                .trim();

        const filtered =
            collaborators.filter(
                collaborator => {

                    const name =
                        String(
                            collaborator.name ||
                            ""
                        ).toLowerCase();

                    const role =
                        String(
                            collaborator.role ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(search) ||
                        role.includes(search)
                    );
                }
            );

        collaboratorsGrid.innerHTML =
            "";

        if (collaboratorCount) {

            collaboratorCount.textContent =
                `${collaborators.length} ${
                    collaborators.length === 1
                        ? "colaborador"
                        : "colaboradores"
                }`;

        }

        if (!filtered.length) {

            if (emptyCollaborators) {

                emptyCollaborators.style.display =
                    "flex";

            }

            return;
        }

        if (emptyCollaborators) {

            emptyCollaborators.style.display =
                "none";

        }

        filtered.forEach(
            collaborator => {

                const assigned =
                    tasks.filter(
                        task =>
                            task.members &&
                            task.members.includes(
                                collaborator.id
                            )
                    ).length;

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "collaborator-card";

                card.innerHTML = `

                    <div class="collaborator-card-top">

                        <div class="collaborator-avatar">
                            ${escapeHTML(
                                getInitials(
                                    collaborator.name
                                )
                            )}
                        </div>

                        <button
                            class="row-action danger"
                            data-delete-collaborator="${collaborator.id}"
                            title="Eliminar colaborador"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                    <h3>
                        ${escapeHTML(
                            collaborator.name
                        )}
                    </h3>

                    <span class="collaborator-role">
                        ${escapeHTML(
                            collaborator.role ||
                            "Sin cargo"
                        )}
                    </span>

                    <div class="collaborator-email">

                        <i class="fa-regular fa-envelope"></i>

                        ${escapeHTML(
                            collaborator.email ||
                            "Sin correo"
                        )}

                    </div>

                    <div class="collaborator-footer">

                        <span>
                            ${assigned}
                            ${
                                assigned === 1
                                    ? " tarea"
                                    : " tareas"
                            }
                        </span>

                    </div>

                `;

                collaboratorsGrid.appendChild(
                    card
                );

            }
        );

        collaboratorsGrid
            .querySelectorAll(
                "[data-delete-collaborator]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteCollaborator(
                            button.dataset
                                .deleteCollaborator
                        );

                    }
                );

            });

    }


    /* =========================================================
       ELIMINAR COLABORADOR
       ========================================================= */

    function deleteCollaborator(id) {

        const collaborator =
            collaborators.find(
                c => c.id === id
            );

        if (!collaborator) return;

        if (
            !confirm(
                `¿Eliminar a ${collaborator.name}?`
            )
        ) {
            return;
        }

        collaborators =
            collaborators.filter(
                c => c.id !== id
            );

        tasks.forEach(task => {

            if (task.members) {

                task.members =
                    task.members.filter(
                        memberId =>
                            memberId !== id
                    );

            }

        });

        saveData();

        renderCollaborators();
        renderTasks();

        showToast(
            "Colaborador eliminado."
        );
    }


    /* =========================================================
       FORMULARIO COLABORADOR
       ========================================================= */

    document
        .getElementById("collaboratorForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const name =
                    document
                        .getElementById(
                            "collaboratorName"
                        )
                        ?.value
                        .trim();

                const role =
                    document
                        .getElementById(
                            "collaboratorRole"
                        )
                        ?.value
                        .trim();

                const email =
                    document
                        .getElementById(
                            "collaboratorEmail"
                        )
                        ?.value
                        .trim();

                if (!name) {

                    showToast(
                        "Escribe el nombre del colaborador.",
                        "warning"
                    );

                    return;
                }

                collaborators.push({

                    id:
                        generateId(
                            "collaborator"
                        ),

                    name,

                    role,

                    email,

                    createdAt:
                        new Date().toISOString()

                });

                saveData();

                event.target.reset();

                closeModal(
                    "collaboratorModal"
                );

                renderCollaborators();

                showToast(
                    "Colaborador agregado."
                );

            }
        );


    /* =========================================================
       NUEVO COLABORADOR
       ========================================================= */

    if (newCollaboratorButton) {

        newCollaboratorButton.addEventListener(
            "click",
            () => {

                openModal(
                    "collaboratorModal"
                );

            }
        );

    }


    if (collaboratorSearch) {

        collaboratorSearch.addEventListener(
            "input",
            renderCollaborators
        );

    }


    /* =========================================================
       MODAL DE INTEGRANTES
       ========================================================= */

    function openMembersModal(taskId) {

        currentMembersTaskId =
            taskId;

        const task =
            tasks.find(
                t => t.id === taskId
            );

        selectedMembers =
            task?.members
                ? [...task.members]
                : [];

        renderMembersSelector();

        openModal(
            "membersModal"
        );
    }


    function renderMembersSelector() {

        const selector =
            document.getElementById(
                "membersSelector"
            );

        if (!selector) return;

        selector.innerHTML = "";

        if (!collaborators.length) {

            selector.innerHTML = `
                <div class="members-empty">

                    <i class="fa-solid fa-users"></i>

                    <p>
                        Primero debes crear colaboradores.
                    </p>

                </div>
            `;

            return;
        }

        collaborators.forEach(member => {

            const selected =
                selectedMembers.includes(
                    member.id
                );

            const item =
                document.createElement(
                    "button"
                );

            item.type =
                "button";

            item.className =
                `member-selector-item ${
                    selected
                        ? "selected"
                        : ""
                }`;

            item.innerHTML = `

                <div class="member-selector-avatar">

                    ${escapeHTML(
                        getInitials(
                            member.name
                        )
                    )}

                </div>

                <div class="member-selector-info">

                    <strong>
                        ${escapeHTML(
                            member.name
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            member.role ||
                            "Sin cargo"
                        )}
                    </span>

                </div>

                <div class="member-selector-check">

                    <i class="fa-solid fa-check"></i>

                </div>

            `;

            item.addEventListener(
                "click",
                () => {

                    if (
                        selectedMembers.includes(
                            member.id
                        )
                    ) {

                        selectedMembers =
                            selectedMembers.filter(
                                id =>
                                    id !==
                                    member.id
                            );

                    } else {

                        selectedMembers.push(
                            member.id
                        );

                    }

                    renderMembersSelector();

                }
            );

            selector.appendChild(
                item
            );

        });

    }


    /* =========================================================
       ASIGNACIÓN DESDE CREACIÓN RÁPIDA
       ========================================================= */

    if (inlineMembersButton) {

        inlineMembersButton.addEventListener(
            "click",
            () => {

                showToast(
                    "Primero crea la tarea y luego podrás asignar integrantes.",
                    "warning"
                );

            }
        );

    }


    /* =========================================================
       GUARDAR INTEGRANTES
       ========================================================= */

    if (saveMembersButton) {

        saveMembersButton.addEventListener(
            "click",
            () => {

                if (
                    !currentMembersTaskId
                ) {
                    return;
                }

                const task =
                    tasks.find(
                        t =>
                            t.id ===
                            currentMembersTaskId
                    );

                if (!task) return;

                task.members =
                    [...selectedMembers];

                saveData();

                closeModal(
                    "membersModal"
                );

                renderTasks();
                renderCollaborators();

                showToast(
                    "Integrantes actualizados."
                );

            }
        );

    }


    /* =========================================================
       EDITAR TAREA
       ========================================================= */

    function openTaskEdit(id) {

        const task =
            tasks.find(
                t => t.id === id
            );

        if (!task) return;

        currentEditingTaskId =
            id;

        const editTaskId =
            document.getElementById(
                "editTaskId"
            );

        const editTaskTitle =
            document.getElementById(
                "editTaskTitle"
            );

        const editTaskPriority =
            document.getElementById(
                "editTaskPriority"
            );

        const editTaskProject =
            document.getElementById(
                "editTaskProject"
            );

        const editTaskDate =
            document.getElementById(
                "editTaskDate"
            );

        if (editTaskId) {

            editTaskId.value =
                id;

        }

        if (editTaskTitle) {

            editTaskTitle.value =
                task.title ||
                task["TAREA PRINCIPAL"] ||
                "";

        }

        if (editTaskPriority) {

            editTaskPriority.value =
                task.priority ||
                "media";

        }

        renderProjectSelects();

        if (editTaskProject) {

            editTaskProject.value =
                task.projectId ||
                "";

        }

        if (editTaskDate) {

            editTaskDate.value =
                task.date ||
                "";

        }

        openModal(
            "taskEditModal"
        );
    }


    /* =========================================================
       GUARDAR EDICIÓN DE TAREA
       ========================================================= */

    document
        .getElementById("taskEditForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const task =
                    tasks.find(
                        t =>
                            t.id ===
                            currentEditingTaskId
                    );

                if (!task) return;

                const titleInput =
                    document.getElementById(
                        "editTaskTitle"
                    );

                const priorityInput =
                    document.getElementById(
                        "editTaskPriority"
                    );

                const projectInput =
                    document.getElementById(
                        "editTaskProject"
                    );

                const dateInput =
                    document.getElementById(
                        "editTaskDate"
                    );

                task.title =
                    titleInput
                        ?.value
                        .trim() ||
                    "";

                task.priority =
                    priorityInput
                        ?.value ||
                    "media";

                task.projectId =
                    projectInput
                        ?.value ||
                    "";

                task.date =
                    dateInput
                        ?.value ||
                    "";

                saveData();

                closeModal(
                    "taskEditModal"
                );

                renderTasks();
                updateAll();

                showToast(
                    "Tarea actualizada."
                );

            }
        );


    /* =========================================================
       MODALES
       ========================================================= */

    function openModal(id) {

        const modal =
            document.getElementById(
                id
            );

        if (!modal) return;

        modal.classList.add(
            "active"
        );

        document.body.classList.add(
            "modal-open"
        );
    }


    function closeModal(id) {

        const modal =
            document.getElementById(
                id
            );

        if (!modal) return;

        modal.classList.remove(
            "active"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }


    document
        .querySelectorAll(
            "[data-close]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    closeModal(
                        button.dataset.close
                    )
            );

        });


    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(overlay => {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        closeModal(
                            overlay.id
                        );

                    }

                }
            );

        });


    /* =========================================================
       ESCAPE
       ========================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {
                return;
            }

            document
                .querySelectorAll(
                    ".modal-overlay.active"
                )
                .forEach(modal =>
                    closeModal(
                        modal.id
                    )
                );

            const searchOverlay =
                document.getElementById(
                    "searchOverlay"
                );

            if (
                searchOverlay?.classList.contains(
                    "active"
                )
            ) {

                searchOverlay.classList.remove(
                    "active"
                );

            }

            const filtersPanel =
                document.getElementById(
                    "taskFiltersPanel"
                );

            if (filtersPanel) {

                filtersPanel.style.display =
                    "none";

            }

        }
    );


    /* =========================================================
       DASHBOARD
       ========================================================= */

    function updateDashboard() {

        const total =
            tasks.length;

        const completed =
            tasks.filter(
                isTaskCompleted
            ).length;

        const pending =
            tasks.filter(
                task =>
                    !isTaskCompleted(task)
            ).length;

        const progress =
            total
                ? Math.round(
                    completed /
                    total *
                    100
                )
                : 0;

        const high =
            tasks.filter(
                task =>
                    !isTaskCompleted(task) &&
                    task.priority === "alta"
            ).length;

        const medium =
            tasks.filter(
                task =>
                    !isTaskCompleted(task) &&
                    task.priority === "media"
            ).length;

        const low =
            tasks.filter(
                task =>
                    !isTaskCompleted(task) &&
                    task.priority === "baja"
            ).length;

        setText(
            "dashboardTotal",
            total
        );

        setText(
            "dashboardPending",
            pending
        );

        setText(
            "dashboardCompleted",
            completed
        );

        setText(
            "dashboardProgress",
            `${progress}%`
        );

        setText(
            "dashboardCircleValue",
            `${progress}%`
        );

        setText(
            "breakdownPending",
            pending
        );

        setText(
            "breakdownCompleted",
            completed
        );

        setText(
            "priorityHighCount",
            high
        );

        setText(
            "priorityMediumCount",
            medium
        );

        setText(
            "priorityLowCount",
            low
        );

        updateBar(
            "priorityHighBar",
            high,
            total
        );

        updateBar(
            "priorityMediumBar",
            medium,
            total
        );

        updateBar(
            "priorityLowBar",
            low,
            total
        );

        const circle =
            document.getElementById(
                "dashboardCircle"
            );

        if (circle) {

            circle.style.setProperty(
                "--progress",
                `${progress * 3.6}deg`
            );

        }

    }


    function updateBar(
        id,
        value,
        total
    ) {

        const bar =
            document.getElementById(
                id
            );

        if (!bar) return;

        bar.style.width =
            `${
                total
                    ? value /
                      total *
                      100
                    : 0
            }%`;
    }


    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );

        if (element) {

            element.textContent =
                value;

        }

    }


    /* =========================================================
       RESUMEN
       ========================================================= */

    function updateSummary() {

        const total =
            tasks.length;

        const completed =
            tasks.filter(
                isTaskCompleted
            ).length;

        const pending =
            tasks.filter(
                task =>
                    !isTaskCompleted(task)
            ).length;

        const progress =
            total
                ? Math.round(
                    completed /
                    total *
                    100
                )
                : 0;

        setText(
            "totalTasks",
            total
        );

        setText(
            "pendingTasks",
            pending
        );

        setText(
            "completedTasks",
            completed
        );

        setText(
            "taskProgress",
            `${progress}%`
        );

    }


    /* =========================================================
       TAREAS FINALIZADAS
       ========================================================= */

    function renderCompleted() {

        if (!completedTableBody) {
            return;
        }

        const search =
            (
                completedSearch?.value ||
                ""
            )
                .toLowerCase()
                .trim();

        const completed =
            tasks.filter(task => {

                if (
                    !isTaskCompleted(task)
                ) {
                    return false;
                }

                if (!search) {
                    return true;
                }

                const title =
                    String(
                        task.title ||
                        task["TAREA PRINCIPAL"] ||
                        ""
                    ).toLowerCase();

                return (
                    title.includes(search) ||
                    getProjectName(
                        task.projectId
                    )
                        .toLowerCase()
                        .includes(search)
                );

            });

        completedTableBody.innerHTML =
            "";

        if (completedTotalPage) {

            completedTotalPage.textContent =
                tasks.filter(
                    isTaskCompleted
                ).length;

        }

        if (!completed.length) {

            if (emptyCompleted) {

                emptyCompleted.style.display =
                    "flex";

            }

            return;
        }

        if (emptyCompleted) {

            emptyCompleted.style.display =
                "none";

        }

        completed.forEach(task => {

            const row =
                document.createElement(
                    "tr"
                );

            let membersHTML =
                "—";

            if (
                task.members &&
                task.members.length
            ) {

                membersHTML =
                    task.members
                        .map(id => {

                            const member =
                                getCollaborator(
                                    id
                                );

                            return member
                                ? escapeHTML(
                                    member.name
                                )
                                : "";

                        })
                        .filter(Boolean)
                        .join(", ");

            } else if (
                task.COLABORADORES
            ) {

                membersHTML =
                    escapeHTML(
                        task.COLABORADORES
                    );

            }

            const completedDate =
                task.completedAt
                    ? formatDate(
                        String(
                            task.completedAt
                        ).substring(
                            0,
                            10
                        )
                    )
                    : formatDate(
                        task[
                            "FECHA FINALIZADA"
                        ]
                    );

            const title =
                task.title ||
                task["TAREA PRINCIPAL"] ||
                "Sin título";

            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(title)}
                    </strong>
                </td>

                <td>
                    <span
                        class="priority-badge ${
                            task.priority ||
                            "media"
                        }"
                    >
                        ${priorityLabel(
                            task.priority
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(
                        getProjectName(
                            task.projectId
                        )
                    )}
                </td>

                <td>
                    ${membersHTML}
                </td>

                <td>
                    ${formatDate(
                        task.date ||
                        task["FECHA REGISTRO"]
                    )}
                </td>

                <td>
                    ${completedDate}
                </td>

                <td>

                    <button
                        class="row-action restore-task"
                        data-action="restore"
                        data-id="${task.id}"
                        title="Restaurar tarea"
                    >

                        <i class="fa-solid fa-rotate-left"></i>

                    </button>

                </td>

            `;

            completedTableBody.appendChild(
                row
            );

        });

    }


    if (completedSearch) {

        completedSearch.addEventListener(
            "input",
            renderCompleted
        );

    }


    if (completedTableBody) {

        completedTableBody.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        '[data-action="restore"]'
                    );

                if (!button) return;

                restoreTask(
                    button.dataset.id
                );

            }
        );

    }


    /* =========================================================
       BÚSQUEDA GLOBAL
       ========================================================= */

    const searchButton =
        document.getElementById(
            "searchButton"
        );

    const searchOverlay =
        document.getElementById(
            "searchOverlay"
        );

    const globalSearchInput =
        document.getElementById(
            "globalSearchInput"
        );

    const closeSearch =
        document.getElementById(
            "closeSearch"
        );

    const globalSearchResults =
        document.getElementById(
            "globalSearchResults"
        );


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            () => {

                if (!searchOverlay) {
                    return;
                }

                searchOverlay.classList.add(
                    "active"
                );

                globalSearchInput?.focus();

            }
        );

    }


    if (closeSearch) {

        closeSearch.addEventListener(
            "click",
            () => {

                searchOverlay?.classList.remove(
                    "active"
                );

            }
        );

    }


    if (globalSearchInput) {

        globalSearchInput.addEventListener(
            "input",
            performGlobalSearch
        );

    }


    function performGlobalSearch() {

        if (
            !globalSearchInput ||
            !globalSearchResults
        ) {
            return;
        }

        const query =
            globalSearchInput.value
                .toLowerCase()
                .trim();

        if (!query) {

            globalSearchResults.innerHTML = `

                <div class="search-empty">

                    <i class="fa-solid fa-magnifying-glass"></i>

                    <span>
                        Escribe para comenzar la búsqueda
                    </span>

                </div>

            `;

            return;
        }

        const results = [];


        tasks.forEach(task => {

            const title =
                String(
                    task.title ||
                    task["TAREA PRINCIPAL"] ||
                    ""
                );

            if (
                title
                    .toLowerCase()
                    .includes(query)
            ) {

                results.push({

                    type: "Tarea",

                    title,

                    action: "tareas"

                });

            }

        });


        projects.forEach(project => {

            const name =
                String(
                    project.name ||
                    ""
                );

            if (
                name
                    .toLowerCase()
                    .includes(query)
            ) {

                results.push({

                    type: "Proyecto",

                    title: name,

                    action: "proyectos"

                });

            }

        });


        collaborators.forEach(member => {

            const name =
                String(
                    member.name ||
                    ""
                );

            if (
                name
                    .toLowerCase()
                    .includes(query)
            ) {

                results.push({

                    type: "Colaborador",

                    title: name,

                    action: "colaboradores"

                });

            }

        });


        if (!results.length) {

            globalSearchResults.innerHTML = `

                <div class="search-empty">

                    <i class="fa-regular fa-face-frown"></i>

                    <span>
                        No encontramos resultados.
                    </span>

                </div>

            `;

            return;
        }


        globalSearchResults.innerHTML =
            results
                .slice(0, 12)
                .map(result => `

                    <button
                        class="global-result"
                        data-result-view="${result.action}"
                    >

                        <div class="global-result-icon">

                            <i class="fa-solid ${
                                result.type === "Tarea"
                                    ? "fa-list-check"
                                    : result.type === "Proyecto"
                                        ? "fa-folder"
                                        : "fa-user"
                            }"></i>

                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    result.title
                                )}
                            </strong>

                            <span>
                                ${result.type}
                            </span>

                        </div>

                    </button>

                `)
                .join("");


        globalSearchResults
            .querySelectorAll(
                "[data-result-view]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        searchOverlay?.classList.remove(
                            "active"
                        );

                        changeView(
                            button.dataset
                                .resultView
                        );

                    }
                );

            });

    }


    /* =========================================================
       ACTUALIZAR TODO
       ========================================================= */

    function updateAll() {

        actualizarTareasFinalizadas();

        renderProjectSelects();

        renderTasks();

        renderProjects();

        renderCollaborators();

        renderCompleted();

        updateSummary();

        updateDashboard();

        updateFilterSwitches();

    }


    /* =========================================================
       DATOS INICIALES
       ========================================================= */

    function createInitialData() {

        if (
            tasks.length === 0 &&
            projects.length === 0 &&
            collaborators.length === 0
        ) {

            projects = [

                {

                    id:
                        generateId(
                            "project"
                        ),

                    name:
                        "Organización",

                    description:
                        "Tareas generales y administrativas.",

                    /*
                     * ICONO PREDETERMINADO
                     */

                    icon:
                        "fa-folder",

                    createdAt:
                        new Date().toISOString()

                }

            ];

            saveData();

        }

    }


    /* =========================================================
       CARGAR TAREAS DESDE data.json
       ========================================================= */

    async function loadPreloadedTasksFromJSON() {

        try {

            const response =
                await fetch(
                    JSON_DATA_URL
                );

            if (!response.ok) {
                return;
            }

            const rawTasks =
                await response.json();

            if (
                !Array.isArray(
                    rawTasks
                )
            ) {
                return;
            }

            let added = false;

            const existingKeys =
                new Set(
                    tasks.map(task =>
                        [
                            task[
                                "TAREA PRINCIPAL"
                            ] ||
                            task.title ||
                            "",

                            task[
                                "FECHA REGISTRO"
                            ] ||
                            task.date ||
                            "",

                            task[
                                "EMPRESA"
                            ] ||
                            "",

                            task[
                                "COLABORADORES"
                            ] ||
                            ""

                        ].join("|")
                    )
                );


            rawTasks.forEach(
                rawTask => {

                    const key =
                        [
                            rawTask[
                                "TAREA PRINCIPAL"
                            ] || "",

                            rawTask[
                                "FECHA REGISTRO"
                            ] || "",

                            rawTask[
                                "EMPRESA"
                            ] || "",

                            rawTask[
                                "COLABORADORES"
                            ] || ""

                        ].join("|");


                    if (
                        existingKeys.has(
                            key
                        )
                    ) {

                        const existing =
                            tasks.find(
                                task =>
                                    [
                                        task[
                                            "TAREA PRINCIPAL"
                                        ] ||
                                        task.title ||
                                        "",

                                        task[
                                            "FECHA REGISTRO"
                                        ] ||
                                        task.date ||
                                        "",

                                        task[
                                            "EMPRESA"
                                        ] ||
                                        "",

                                        task[
                                            "COLABORADORES"
                                        ] ||
                                        ""

                                    ].join("|") ===
                                    key
                            );

                        if (existing) {

                            normalizeTask(
                                existing
                            );

                        }

                        return;
                    }


                    const id =
                        "json_" +
                        hashString(
                            key
                        );


                    const newTask =
                        normalizeTask({

                            ...rawTask,

                            id

                        });


                    tasks.push(
                        newTask
                    );

                    existingKeys.add(
                        key
                    );

                    added = true;

                }
            );


            tasks =
                tasks.map(
                    normalizeTask
                );

            saveData();


            if (added) {

                updateAll();

            }

        } catch (error) {

            console.error(
                "No se pudo cargar el archivo de tareas preregistradas:",
                error
            );

        }

    }


    /* =========================================================
       FECHA PREDETERMINADA
       ========================================================= */

    if (inlineDate) {

        inlineDate.value =
            new Date()
                .toISOString()
                .split("T")[0];

    }


    /* =========================================================
       INICIALIZACIÓN
       ========================================================= */

    createInitialData();


    views.forEach(
        view => {

            view.style.display =
                "none";

        }
    );


    const initialView =
        document.getElementById(
            "view-dashboard"
        );


    if (initialView) {

        initialView.style.display =
            "block";

        initialView.classList.add(
            "active"
        );

    }


    updateAll();


    loadPreloadedTasksFromJSON();

});