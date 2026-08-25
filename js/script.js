document.addEventListener("DOMContentLoaded", async () => {

    let tasks = [];
    let collaborators = [];
    let projects = [];

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

    /*
     * Los datos principales NO se almacenan en localStorage.
     * PostgreSQL / Neon es la fuente oficial.
     */

    function saveData() {
        // Se conserva temporalmente porque algunas
        // funciones antiguas pueden llamarla.
        // No almacena absolutamente nada.
    }

    async function loadDataFromAPI() {
        try {
            const [
                apiTasks,
                apiProjects,
                apiCollaborators
            ] = await Promise.all([
                TaskFlowAPI.getTasks(),
                TaskFlowAPI.getProjects(),
                TaskFlowAPI.getCollaborators()
            ]);

            tasks =
                apiTasks.map(
                    normalizeTask
                );

            projects =
                apiProjects.map(
                    project => ({
                        ...project,
                        icon:
                            getProjectIcon(
                                project
                            )
                    })
                );

            collaborators =
                apiCollaborators;

            console.log(
                "Datos cargados desde PostgreSQL:",
                {
                    tasks,
                    projects,
                    collaborators
                }
            );

            return true;

        } catch (error) {
            console.error(
                "Error cargando datos desde PostgreSQL:",
                error
            );

            showToast(
                "No se pudo conectar con el servidor.",
                "error"
            );

            return false;
        }
    }

    let currentMembersTaskId =
        null;

    let currentEditingTaskId =
        null;

    let currentEditingProjectId =
        null;

    let selectedMembers =
        [];

    /*
     * El filtro comienza siempre en newest.
     * Ya NO utilizamos localStorage.
     */
    let currentTaskFilter =
        "newest";

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

    const projectCount =
        document.getElementById(
            "projectCount"
        );

    const projectSearch =
        document.getElementById(
            "projectSearch"
        );

    const completedList =
        document.getElementById(
            "completedList"
        );

    const emptyCompleted =
        document.getElementById(
            "emptyCompleted"
        );

    const completedSearch =
        document.getElementById(
            "completedSearch"
        );

    const completedProjectFilter =
        document.getElementById(
            "completedProjectFilter"
        );

    const completedCount =
        document.getElementById(
            "completedCount"
        );

    const membersModal =
        document.getElementById(
            "membersModal"
        );

    const membersTaskTitle =
        document.getElementById(
            "membersTaskTitle"
        );

    const membersSearch =
        document.getElementById(
            "membersSearch"
        );

    const membersList =
        document.getElementById(
            "membersList"
        );

    const saveMembers =
        document.getElementById(
            "saveMembers"
        );

    const taskEditModal =
        document.getElementById(
            "taskEditModal"
        );

    const taskEditForm =
        document.getElementById(
            "taskEditForm"
        );

    const taskEditTitle =
        document.getElementById(
            "taskEditTitle"
        );

    const taskEditSecondary =
        document.getElementById(
            "taskEditSecondary"
        );

    const taskEditPriority =
        document.getElementById(
            "taskEditPriority"
        );

    const taskEditProject =
        document.getElementById(
            "taskEditProject"
        );

    const taskEditDate =
        document.getElementById(
            "taskEditDate"
        );

    const projectEditModal =
        document.getElementById(
            "projectEditModal"
        );

    const projectEditForm =
        document.getElementById(
            "projectEditForm"
        );

    const projectEditName =
        document.getElementById(
            "projectEditName"
        );

    const projectEditDescription =
        document.getElementById(
            "projectEditDescription"
        );

    const projectEditIcon =
        document.getElementById(
            "projectEditIcon"
        );

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

    const globalSearch =
        document.getElementById(
            "globalSearch"
        );

    const globalSearchInput =
        document.getElementById(
            "globalSearchInput"
        );

    const globalSearchResults =
        document.getElementById(
            "globalSearchResults"
        );

    const searchOverlay =
        document.getElementById(
            "searchOverlay"
        );

    const newTaskButton =
        document.getElementById(
            "newTaskButton"
        );

    const newProjectButton =
        document.getElementById(
            "newProjectButton"
        );

    const newCollaboratorButton =
        document.getElementById(
            "newCollaboratorButton"
        );

    /* =========================================================
       FUNCIONES GENERALES
       ========================================================= */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getInitials(name) {
        return String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part =>
                part.charAt(0)
                    .toUpperCase()
            )
            .join("");
    }

    function formatDate(value) {
        if (!value) {
            return "Sin fecha";
        }

        const date =
            String(value);

        if (date.includes("/")) {
            return date;
        }

        const cleanDate =
            date.split("T")[0];

        const parts =
            cleanDate.split("-");

        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        return date;
    }

    function getProject(id) {
        return projects.find(
            project =>
                project.id === id
        );
    }

    function getProjectName(id) {
        if (!id) {
            return "Sin proyecto";
        }

        const project =
            getProject(id);

        return project
            ? project.name
            : "Sin proyecto";
    }

    function getCollaborator(id) {
        return collaborators.find(
            collaborator =>
                collaborator.id === id
        );
    }

    function showToast(
        message,
        type = "success"
    ) {
        let container =
            document.getElementById(
                "toastContainer"
            );

        if (!container) {
            container =
                document.createElement(
                    "div"
                );

            container.id =
                "toastContainer";

            container.className =
                "toast-container";

            document.body.appendChild(
                container
            );
        }

        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            `toast ${type}`;

        toast.innerHTML = `
            <span>${escapeHTML(message)}</span>
        `;

        container.appendChild(
            toast
        );

        requestAnimationFrame(
            () => {
                toast.classList.add(
                    "show"
                );
            }
        );

        setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );

                setTimeout(
                    () => {
                        toast.remove();
                    },
                    250
                );
            },
            3000
        );
    }

    function closeModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.remove(
            "active"
        );
    }

    function openModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.add(
            "active"
        );
    }

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const modal =
                        button.closest(
                            ".modal-overlay"
                        );

                    closeModal(
                        modal
                    );
                }
            );
        });

    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(modal => {
            modal.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        modal
                    ) {
                        closeModal(
                            modal
                        );
                    }
                }
            );
        });

    /* =========================================================
       ICONOS DE PROYECTOS
       ========================================================= */

    function renderProjectIconSelector(
        selectedIcon =
            DEFAULT_PROJECT_ICON
    ) {
        if (!projectIconSelector) {
            return;
        }

        selectedIcon =
            normalizeProjectIcon(
                selectedIcon
            );

        projectIconSelector.innerHTML =
            "";

        PROJECT_ICONS.forEach(icon => {
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

            button.innerHTML = `
                <i class="fa-solid ${escapeHTML(icon)}"></i>
            `;

            if (
                icon ===
                selectedIcon
            ) {
                button.classList.add(
                    "active"
                );
            }

            button.addEventListener(
                "click",
                () => {
                    selectProjectIcon(
                        icon
                    );
                }
            );

            projectIconSelector
                .appendChild(
                    button
                );
        });

        updateProjectIconPreview(
            selectedIcon
        );
    }

    function selectProjectIcon(icon) {
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

    async function createTask() {
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
            completedAt: null
        };

        try {
            const createdTask =
                await TaskFlowAPI.createTask(
                    task
                );

            tasks.push(
                normalizeTask(
                    createdTask
                )
            );

            inlineTaskInput.value =
                "";

            inlinePriority.value =
                "media";

            inlineProject.value =
                "";

            inlineDate.value =
                new Date()
                    .toISOString()
                    .split("T")[0];

            updateAll();

            showToast(
                "Tarea creada correctamente."
            );

        } catch (error) {
            console.error(
                "Error creando tarea:",
                error
            );

            showToast(
                error.message ||
                "No se pudo crear la tarea.",
                "error"
            );
        }
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

    async function completeTask(id) {
        const task =
            tasks.find(
                t => t.id === id
            );

        if (!task) return;

        try {
            const updated =
                await TaskFlowAPI.completeTask(
                    id
                );

            const previousMembers =
                Array.isArray(task.members)
                    ? [...task.members]
                    : [];

            Object.assign(
                task,
                normalizeTask(updated)
            );

            task.members =
                previousMembers;

            updateAll();

            showToast(
                "Tarea completada."
            );

        } catch (error) {
            console.error(
                "Error completando tarea:",
                error
            );

            showToast(
                error.message ||
                "No se pudo completar la tarea.",
                "error"
            );

            renderTasks();
        }
    }

    async function restoreTask(id) {
        const task =
            tasks.find(
                t => t.id === id
            );

        if (!task) return;

        try {
            const updated =
                await TaskFlowAPI.reopenTask(
                    id
                );

            const previousMembers =
                Array.isArray(task.members)
                    ? [...task.members]
                    : [];

            Object.assign(
                task,
                normalizeTask(updated)
            );

            task.members =
                previousMembers;

            updateAll();

            showToast(
                "Tarea restaurada correctamente."
            );

        } catch (error) {
            console.error(
                "Error restaurando tarea:",
                error
            );

            showToast(
                error.message ||
                "No se pudo restaurar la tarea.",
                "error"
            );
        }
    }

    async function deleteTask(id) {
        const task =
            tasks.find(
                t => t.id === id
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

        try {
            await TaskFlowAPI.deleteTask(
                id
            );

            tasks =
                tasks.filter(
                    t => t.id !== id
                );

            updateAll();

            showToast(
                "Tarea eliminada."
            );

        } catch (error) {
            console.error(
                "Error eliminando tarea:",
                error
            );

            showToast(
                error.message ||
                "No se pudo eliminar la tarea.",
                "error"
            );
        }
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
                    Mostrar por fecha de registro
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

                        /*
                         * Ya NO guardamos el filtro
                         * en localStorage.
                         */

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

    createFiltersPanel();

        /* =========================================================
       EDITAR TAREA
       ========================================================= */

    function openTaskEdit(id) {
        const task =
            tasks.find(
                t => t.id === id
            );

        if (!task) {
            return;
        }

        currentEditingTaskId =
            id;

        if (taskEditTitle) {
            taskEditTitle.value =
                task.title ||
                task["TAREA PRINCIPAL"] ||
                "";
        }

        if (taskEditSecondary) {
            taskEditSecondary.value =
                task.secondaryTask ||
                task.secondary_task ||
                task["TAREA SECUNDARIA"] ||
                "";
        }

        if (taskEditPriority) {
            taskEditPriority.value =
                task.priority ||
                "media";
        }

        if (taskEditProject) {
            taskEditProject.value =
                task.projectId ||
                "";
        }

        if (taskEditDate) {
            taskEditDate.value =
                task.date
                    ? String(task.date)
                        .split("T")[0]
                    : "";
        }

        openModal(
            taskEditModal
        );
    }

    if (taskEditForm) {
        taskEditForm.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const task =
                    tasks.find(
                        t =>
                            t.id ===
                            currentEditingTaskId
                    );

                if (!task) {
                    return;
                }

                const title =
                    taskEditTitle
                        ?.value
                        .trim() ||
                    "";

                if (!title) {
                    showToast(
                        "El nombre de la tarea es obligatorio.",
                        "warning"
                    );

                    return;
                }

                const changes = {
                    title,
                    secondaryTask:
                        taskEditSecondary
                            ?.value
                            .trim() ||
                        "",
                    priority:
                        taskEditPriority
                            ?.value ||
                        "media",
                    projectId:
                        taskEditProject
                            ?.value ||
                        "",
                    date:
                        taskEditDate
                            ?.value ||
                        ""
                };

                try {
                    const updated =
                        await TaskFlowAPI.updateTask(
                            task.id,
                            changes
                        );

                    const previousMembers =
                        Array.isArray(
                            task.members
                        )
                            ? [...task.members]
                            : [];

                    Object.assign(
                        task,
                        normalizeTask(
                            updated
                        )
                    );

                    task.members =
                        previousMembers;

                    closeModal(
                        taskEditModal
                    );

                    currentEditingTaskId =
                        null;

                    updateAll();

                    showToast(
                        "Tarea actualizada correctamente."
                    );

                } catch (error) {
                    console.error(
                        "Error actualizando tarea:",
                        error
                    );

                    showToast(
                        error.message ||
                        "No se pudo actualizar la tarea.",
                        "error"
                    );
                }
            }
        );
    }

    /* =========================================================
       ASIGNAR COLABORADORES A TAREAS
       ========================================================= */

    function openMembersModal(id) {
        const task =
            tasks.find(
                t => t.id === id
            );

        if (!task) {
            return;
        }

        currentMembersTaskId =
            id;

        selectedMembers =
            Array.isArray(
                task.members
            )
                ? [...task.members]
                : [];

        if (membersTaskTitle) {
            membersTaskTitle.textContent =
                task.title ||
                task["TAREA PRINCIPAL"] ||
                "Tarea";
        }

        if (membersSearch) {
            membersSearch.value =
                "";
        }

        renderMembersModal();

        openModal(
            membersModal
        );
    }

    function renderMembersModal() {
        if (!membersList) {
            return;
        }

        const query =
            String(
                membersSearch?.value ||
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

                    const email =
                        String(
                            collaborator.email ||
                            ""
                        ).toLowerCase();

                    return (
                        !query ||
                        name.includes(
                            query
                        ) ||
                        role.includes(
                            query
                        ) ||
                        email.includes(
                            query
                        )
                    );
                }
            );

        membersList.innerHTML =
            "";

        if (!filtered.length) {
            membersList.innerHTML = `
                <div class="members-empty">
                    No se encontraron colaboradores.
                </div>
            `;

            return;
        }

        filtered.forEach(
            collaborator => {
                const selected =
                    selectedMembers.includes(
                        collaborator.id
                    );

                const item =
                    document.createElement(
                        "label"
                    );

                item.className =
                    "member-select-item";

                if (selected) {
                    item.classList.add(
                        "selected"
                    );
                }

                item.innerHTML = `
                    <input
                        type="checkbox"
                        value="${escapeHTML(collaborator.id)}"
                        ${
                            selected
                                ? "checked"
                                : ""
                        }
                    >

                    <span class="member-avatar">
                        ${escapeHTML(
                            getInitials(
                                collaborator.name
                            )
                        )}
                    </span>

                    <span class="member-select-info">
                        <strong>
                            ${escapeHTML(
                                collaborator.name
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                collaborator.role ||
                                "Sin cargo"
                            )}
                        </small>
                    </span>
                `;

                const checkbox =
                    item.querySelector(
                        'input[type="checkbox"]'
                    );

                checkbox?.addEventListener(
                    "change",
                    () => {
                        if (
                            checkbox.checked
                        ) {
                            if (
                                !selectedMembers.includes(
                                    collaborator.id
                                )
                            ) {
                                selectedMembers.push(
                                    collaborator.id
                                );
                            }
                        } else {
                            selectedMembers =
                                selectedMembers.filter(
                                    memberId =>
                                        memberId !==
                                        collaborator.id
                                );
                        }

                        item.classList.toggle(
                            "selected",
                            checkbox.checked
                        );
                    }
                );

                membersList.appendChild(
                    item
                );
            }
        );
    }

    if (membersSearch) {
        membersSearch.addEventListener(
            "input",
            renderMembersModal
        );
    }

    if (saveMembers) {
        saveMembers.addEventListener(
            "click",
            async () => {
                const task =
                    tasks.find(
                        t =>
                            t.id ===
                            currentMembersTaskId
                    );

                if (!task) {
                    return;
                }

                try {
                    /*
                     * Primero consultamos las asignaciones
                     * actuales que conoce el frontend.
                     */
                    const previousMembers =
                        Array.isArray(
                            task.members
                        )
                            ? [...task.members]
                            : [];

                    const membersToAdd =
                        selectedMembers.filter(
                            id =>
                                !previousMembers.includes(
                                    id
                                )
                        );

                    const membersToRemove =
                        previousMembers.filter(
                            id =>
                                !selectedMembers.includes(
                                    id
                                )
                        );

                    /*
                     * Guardamos cada nueva asignación
                     * mediante la API.
                     */
                    for (
                        const collaboratorId
                        of membersToAdd
                    ) {
                        await TaskFlowAPI
                            .assignCollaborator(
                                task.id,
                                collaboratorId
                            );
                    }

                    /*
                     * Eliminamos las asignaciones
                     * que el usuario quitó.
                     */
                    for (
                        const collaboratorId
                        of membersToRemove
                    ) {
                        await TaskFlowAPI
                            .removeCollaborator(
                                task.id,
                                collaboratorId
                            );
                    }

                    task.members =
                        [...selectedMembers];

                    closeModal(
                        membersModal
                    );

                    currentMembersTaskId =
                        null;

                    updateAll();

                    showToast(
                        "Colaboradores actualizados."
                    );

                } catch (error) {
                    console.error(
                        "Error guardando colaboradores:",
                        error
                    );

                    showToast(
                        error.message ||
                        "No se pudieron guardar los colaboradores.",
                        "error"
                    );
                }
            }
        );
    }

    /* =========================================================
       PROYECTOS - SELECTORES
       ========================================================= */

    function renderProjectSelects() {
        const selects = [
            inlineProject,
            taskFilterProject,
            completedProjectFilter,
            taskEditProject
        ].filter(Boolean);

        selects.forEach(
            select => {
                const currentValue =
                    select.value;

                const isFilter =
                    select ===
                        taskFilterProject ||
                    select ===
                        completedProjectFilter;

                select.innerHTML =
                    "";

                const defaultOption =
                    document.createElement(
                        "option"
                    );

                defaultOption.value =
                    isFilter
                        ? "all"
                        : "";

                defaultOption.textContent =
                    isFilter
                        ? "Todos los proyectos"
                        : "Sin proyecto";

                select.appendChild(
                    defaultOption
                );

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

                const exists =
                    [...select.options]
                        .some(
                            option =>
                                option.value ===
                                currentValue
                        );

                if (exists) {
                    select.value =
                        currentValue;
                }
            }
        );
    }

    /* =========================================================
       RENDERIZAR PROYECTOS
       ========================================================= */

    function renderProjects() {
        if (!projectsGrid) {
            return;
        }

        const query =
            String(
                projectSearch?.value ||
                ""
            )
                .toLowerCase()
                .trim();

        const filtered =
            projects.filter(
                project => {
                    const name =
                        String(
                            project.name ||
                            ""
                        ).toLowerCase();

                    const description =
                        String(
                            project.description ||
                            ""
                        ).toLowerCase();

                    return (
                        !query ||
                        name.includes(
                            query
                        ) ||
                        description.includes(
                            query
                        )
                    );
                }
            );

        projectsGrid.innerHTML =
            "";

        if (emptyProjects) {
            emptyProjects.style.display =
                filtered.length
                    ? "none"
                    : "flex";
        }

        if (projectCount) {
            projectCount.textContent =
                projects.length;
        }

        filtered.forEach(
            project => {
                const projectTasks =
                    tasks.filter(
                        task =>
                            task.projectId ===
                            project.id
                    );

                const total =
                    projectTasks.length;

                const completed =
                    projectTasks.filter(
                        task =>
                            isTaskCompleted(
                                task
                            )
                    ).length;

                const progress =
                    total
                        ? Math.round(
                            completed /
                            total *
                            100
                        )
                        : 0;

                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "project-card";

                card.dataset.projectId =
                    project.id;

                const icon =
                    getProjectIcon(
                        project
                    );

                card.innerHTML = `
                    <div class="project-card-header">

                        <div class="project-card-icon">
                            <i class="fa-solid ${escapeHTML(icon)}"></i>
                        </div>

                        <div class="project-card-actions">

                            <button
                                type="button"
                                class="project-action"
                                data-edit-project="${escapeHTML(project.id)}"
                                title="Editar proyecto"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="project-action danger"
                                data-delete-project="${escapeHTML(project.id)}"
                                title="Eliminar proyecto"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>

                    </div>

                    <div class="project-card-body">

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

                    </div>

                    <div class="project-progress">

                        <div class="project-progress-header">

                            <span>
                                Progreso
                            </span>

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

                projectsGrid.appendChild(
                    card
                );
            }
        );

        projectsGrid
            .querySelectorAll(
                "[data-edit-project]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            openProjectEdit(
                                button.dataset
                                    .editProject
                            );
                        }
                    );
                }
            );

        projectsGrid
            .querySelectorAll(
                "[data-delete-project]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            deleteProject(
                                button.dataset
                                    .deleteProject
                            );
                        }
                    );
                }
            );
    }

    if (projectSearch) {
        projectSearch.addEventListener(
            "input",
            renderProjects
        );
    }

    /* =========================================================
       CREAR PROYECTO
       ========================================================= */

    document
        .getElementById(
            "projectForm"
        )
        ?.addEventListener(
            "submit",
            async event => {
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
                        .trim() ||
                    "";

                const icon =
                    normalizeProjectIcon(
                        projectIconInput
                            ?.value ||
                        DEFAULT_PROJECT_ICON
                    );

                if (!name) {
                    showToast(
                        "El nombre del proyecto es obligatorio.",
                        "warning"
                    );

                    return;
                }

                const project = {
                    name,
                    description,
                    icon
                };

                try {
                    const created =
                        await TaskFlowAPI
                            .createProject(
                                project
                            );

                    projects.push({
                        ...created,
                        icon:
                            getProjectIcon(
                                created
                            )
                    });

                    event.target.reset();

                    if (
                        projectIconInput
                    ) {
                        projectIconInput.value =
                            DEFAULT_PROJECT_ICON;
                    }

                    renderProjectIconSelector(
                        DEFAULT_PROJECT_ICON
                    );

                    document
                        .getElementById(
                            "projectModal"
                        )
                        ?.classList
                        .remove(
                            "active"
                        );

                    updateAll();

                    showToast(
                        "Proyecto creado correctamente."
                    );

                } catch (error) {
                    console.error(
                        "Error creando proyecto:",
                        error
                    );

                    showToast(
                        error.message ||
                        "No se pudo crear el proyecto.",
                        "error"
                    );
                }
            }
        );

    /* =========================================================
       EDITAR PROYECTO
       ========================================================= */

    function openProjectEdit(id) {
        const project =
            projects.find(
                p => p.id === id
            );

        if (!project) {
            return;
        }

        currentEditingProjectId =
            id;

        if (projectEditName) {
            projectEditName.value =
                project.name ||
                "";
        }

        if (projectEditDescription) {
            projectEditDescription.value =
                project.description ||
                "";
        }

        if (projectEditIcon) {
            projectEditIcon.value =
                getProjectIcon(
                    project
                );
        }

        openModal(
            projectEditModal
        );
    }

    if (projectEditForm) {
        projectEditForm.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const project =
                    projects.find(
                        p =>
                            p.id ===
                            currentEditingProjectId
                    );

                if (!project) {
                    return;
                }

                const name =
                    projectEditName
                        ?.value
                        .trim() ||
                    "";

                if (!name) {
                    showToast(
                        "El nombre del proyecto es obligatorio.",
                        "warning"
                    );

                    return;
                }

                const changes = {
                    name,
                    description:
                        projectEditDescription
                            ?.value
                            .trim() ||
                        "",
                    icon:
                        normalizeProjectIcon(
                            projectEditIcon
                                ?.value ||
                            getProjectIcon(
                                project
                            )
                        )
                };

                try {
                    const updated =
                        await TaskFlowAPI
                            .updateProject(
                                project.id,
                                changes
                            );

                    Object.assign(
                        project,
                        updated,
                        {
                            icon:
                                getProjectIcon(
                                    updated
                                )
                        }
                    );

                    closeModal(
                        projectEditModal
                    );

                    currentEditingProjectId =
                        null;

                    updateAll();

                    showToast(
                        "Proyecto actualizado."
                    );

                } catch (error) {
                    console.error(
                        "Error actualizando proyecto:",
                        error
                    );

                    showToast(
                        error.message ||
                        "No se pudo actualizar el proyecto.",
                        "error"
                    );
                }
            }
        );
    }

    /* =========================================================
       ELIMINAR PROYECTO
       ========================================================= */

    async function deleteProject(id) {
        const project =
            projects.find(
                p => p.id === id
            );

        if (!project) {
            return;
        }

        const hasTasks =
            tasks.some(
                task =>
                    task.projectId ===
                    id
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

        try {
            await TaskFlowAPI
                .deleteProject(
                    id
                );

            projects =
                projects.filter(
                    p => p.id !== id
                );

            updateAll();

            showToast(
                "Proyecto eliminado."
            );

        } catch (error) {
            console.error(
                "Error eliminando proyecto:",
                error
            );

            showToast(
                error.message ||
                "No se pudo eliminar el proyecto.",
                "error"
            );
        }
    }

    /* =========================================================
       COLABORADORES
       ========================================================= */

    function renderCollaborators() {
        if (!collaboratorsGrid) {
            return;
        }

        const query =
            String(
                collaboratorSearch
                    ?.value ||
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

                    const email =
                        String(
                            collaborator.email ||
                            ""
                        ).toLowerCase();

                    return (
                        !query ||
                        name.includes(
                            query
                        ) ||
                        role.includes(
                            query
                        ) ||
                        email.includes(
                            query
                        )
                    );
                }
            );

        collaboratorsGrid.innerHTML =
            "";

        if (emptyCollaborators) {
            emptyCollaborators
                .style
                .display =
                filtered.length
                    ? "none"
                    : "flex";
        }

        if (collaboratorCount) {
            collaboratorCount.textContent =
                collaborators.length;
        }

        filtered.forEach(
            collaborator => {
                const assignedTasks =
                    tasks.filter(
                        task =>
                            Array.isArray(
                                task.members
                            ) &&
                            task.members.includes(
                                collaborator.id
                            )
                    ).length;

                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "collaborator-card";

                card.innerHTML = `
                    <div class="collaborator-card-header">

                        <div class="collaborator-avatar">
                            ${escapeHTML(
                                getInitials(
                                    collaborator.name
                                )
                            )}
                        </div>

                        <button
                            type="button"
                            class="collaborator-delete"
                            data-delete-collaborator="${escapeHTML(collaborator.id)}"
                            title="Eliminar colaborador"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                    <div class="collaborator-card-body">

                        <h3>
                            ${escapeHTML(
                                collaborator.name
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                collaborator.role ||
                                "Sin cargo"
                            )}
                        </p>

                        ${
                            collaborator.email
                                ? `
                                    <span class="collaborator-email">
                                        ${escapeHTML(
                                            collaborator.email
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                    <div class="collaborator-card-footer">

                        <span>
                            ${assignedTasks}
                            ${
                                assignedTasks === 1
                                    ? "tarea asignada"
                                    : "tareas asignadas"
                            }
                        </span>

                    </div>
                `;

                collaboratorsGrid
                    .appendChild(
                        card
                    );
            }
        );

        collaboratorsGrid
            .querySelectorAll(
                "[data-delete-collaborator]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            deleteCollaborator(
                                button.dataset
                                    .deleteCollaborator
                            );
                        }
                    );
                }
            );
    }

    if (collaboratorSearch) {
        collaboratorSearch
            .addEventListener(
                "input",
                renderCollaborators
            );
    }

    /* =========================================================
       CREAR COLABORADOR
       ========================================================= */

    document
        .getElementById(
            "collaboratorForm"
        )
        ?.addEventListener(
            "submit",
            async event => {
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
                        .trim() ||
                    "";

                const email =
                    document
                        .getElementById(
                            "collaboratorEmail"
                        )
                        ?.value
                        .trim() ||
                    "";

                if (!name) {
                    showToast(
                        "El nombre del colaborador es obligatorio.",
                        "warning"
                    );

                    return;
                }

                const collaborator = {
                    name,
                    role,
                    email
                };

                try {
                    const created =
                        await TaskFlowAPI
                            .createCollaborator(
                                collaborator
                            );

                    collaborators.push(
                        created
                    );

                    event.target.reset();

                    document
                        .getElementById(
                            "collaboratorModal"
                        )
                        ?.classList
                        .remove(
                            "active"
                        );

                    updateAll();

                    showToast(
                        "Colaborador creado correctamente."
                    );

                } catch (error) {
                    console.error(
                        "Error creando colaborador:",
                        error
                    );

                    showToast(
                        error.message ||
                        "No se pudo crear el colaborador.",
                        "error"
                    );
                }
            }
        );

    /* =========================================================
       ELIMINAR COLABORADOR
       ========================================================= */

    async function deleteCollaborator(
        id
    ) {
        const collaborator =
            collaborators.find(
                c => c.id === id
            );

        if (!collaborator) {
            return;
        }

        if (
            !confirm(
                `¿Eliminar a ${collaborator.name}?`
            )
        ) {
            return;
        }

        try {
            await TaskFlowAPI
                .deleteCollaborator(
                    id
                );

            collaborators =
                collaborators.filter(
                    c => c.id !== id
                );

            /*
             * La BD debe eliminar las asignaciones
             * relacionadas. También actualizamos
             * la copia en memoria para reflejarlo
             * inmediatamente en la interfaz.
             */
            tasks.forEach(
                task => {
                    if (
                        Array.isArray(
                            task.members
                        )
                    ) {
                        task.members =
                            task.members.filter(
                                memberId =>
                                    memberId !==
                                    id
                            );
                    }
                }
            );

            updateAll();

            showToast(
                "Colaborador eliminado."
            );

        } catch (error) {
            console.error(
                "Error eliminando colaborador:",
                error
            );

            showToast(
                error.message ||
                "No se pudo eliminar el colaborador.",
                "error"
            );
        }
    }

    /* =========================================================
       BOTONES NUEVO PROYECTO / COLABORADOR
       ========================================================= */

    if (newProjectButton) {
        newProjectButton
            .addEventListener(
                "click",
                () => {
                    const modal =
                        document.getElementById(
                            "projectModal"
                        );

                    if (
                        projectIconInput
                    ) {
                        projectIconInput.value =
                            DEFAULT_PROJECT_ICON;
                    }

                    initializeProjectIconSelector();

                    openModal(
                        modal
                    );
                }
            );
    }

    if (newCollaboratorButton) {
        newCollaboratorButton
            .addEventListener(
                "click",
                () => {
                    openModal(
                        document.getElementById(
                            "collaboratorModal"
                        )
                    );
                }
            );
    }

        /* =========================================================
       TAREAS COMPLETADAS
       ========================================================= */

    function getFilteredCompletedTasks() {
        const query =
            String(
                completedSearch?.value ||
                ""
            )
                .toLowerCase()
                .trim();

        const projectFilter =
            completedProjectFilter?.value ||
            "all";

        return tasks
            .filter(task => {
                if (
                    !isTaskCompleted(
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

                const secondary =
                    String(
                        task.secondaryTask ||
                        task.secondary_task ||
                        task["TAREA SECUNDARIA"] ||
                        ""
                    ).toLowerCase();

                const projectName =
                    getProjectName(
                        task.projectId
                    ).toLowerCase();

                const matchesSearch =
                    !query ||
                    title.includes(query) ||
                    secondary.includes(query) ||
                    projectName.includes(query);

                const matchesProject =
                    projectFilter === "all" ||
                    task.projectId ===
                        projectFilter;

                return (
                    matchesSearch &&
                    matchesProject
                );
            })
            .sort(
                (a, b) => {
                    const dateA =
                        a.completedAt
                            ? new Date(
                                a.completedAt
                            ).getTime()
                            : 0;

                    const dateB =
                        b.completedAt
                            ? new Date(
                                b.completedAt
                            ).getTime()
                            : 0;

                    return (
                        dateB -
                        dateA
                    );
                }
            );
    }

    function renderCompleted() {
        if (!completedList) {
            return;
        }

        const completed =
            getFilteredCompletedTasks();

        completedList.innerHTML =
            "";

        if (emptyCompleted) {
            emptyCompleted.style.display =
                completed.length
                    ? "none"
                    : "flex";
        }

        if (completedCount) {
            completedCount.textContent =
                completed.length;
        }

        completed.forEach(
            task => {
                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "completed-item";

                item.dataset.id =
                    task.id;

                const title =
                    task.title ||
                    task["TAREA PRINCIPAL"] ||
                    "Sin título";

                const projectName =
                    getProjectName(
                        task.projectId
                    );

                const completedDate =
                    task.completedAt
                        ? formatDate(
                            String(
                                task.completedAt
                            ).split("T")[0]
                        )
                        : "Sin fecha";

                let membersHTML =
                    "";

                if (
                    Array.isArray(
                        task.members
                    ) &&
                    task.members.length
                ) {
                    membersHTML = `
                        <div class="completed-members">
                    `;

                    task.members
                        .slice(0, 4)
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
                        4
                    ) {
                        membersHTML += `
                            <span class="member-more">
                                +${task.members.length - 4}
                            </span>
                        `;
                    }

                    membersHTML +=
                        "</div>";
                }

                item.innerHTML = `
                    <div class="completed-check">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>

                    <div class="completed-main">

                        <div class="completed-title">
                            ${escapeHTML(
                                title
                            )}
                        </div>

                        <div class="completed-meta">

                            <span>
                                <i class="fa-solid fa-folder"></i>
                                ${escapeHTML(
                                    projectName
                                )}
                            </span>

                            <span>
                                <i class="fa-solid fa-calendar-check"></i>
                                ${escapeHTML(
                                    completedDate
                                )}
                            </span>

                            ${membersHTML}

                        </div>

                    </div>

                    <div class="completed-actions">

                        <button
                            type="button"
                            class="completed-action restore"
                            data-restore-task="${escapeHTML(task.id)}"
                            title="Restaurar tarea"
                        >
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>

                        <button
                            type="button"
                            class="completed-action danger"
                            data-delete-completed="${escapeHTML(task.id)}"
                            title="Eliminar tarea"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                `;

                completedList.appendChild(
                    item
                );
            }
        );

        completedList
            .querySelectorAll(
                "[data-restore-task]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            restoreTask(
                                button.dataset
                                    .restoreTask
                            );
                        }
                    );
                }
            );

        completedList
            .querySelectorAll(
                "[data-delete-completed]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            deleteTask(
                                button.dataset
                                    .deleteCompleted
                            );
                        }
                    );
                }
            );
    }

    if (completedSearch) {
        completedSearch.addEventListener(
            "input",
            renderCompleted
        );
    }

    if (completedProjectFilter) {
        completedProjectFilter
            .addEventListener(
                "change",
                renderCompleted
            );
    }

    /* =========================================================
       ESTADÍSTICAS
       ========================================================= */

    function updateStats() {
        const total =
            tasks.length;

        const completed =
            tasks.filter(
                task =>
                    isTaskCompleted(
                        task
                    )
            ).length;

        const pending =
            total -
            completed;

        if (totalTasks) {
            totalTasks.textContent =
                total;
        }

        if (pendingTasks) {
            pendingTasks.textContent =
                pending;
        }

        if (completedTasks) {
            completedTasks.textContent =
                completed;
        }

        if (taskProgress) {
            const percentage =
                total
                    ? Math.round(
                        completed /
                        total *
                        100
                    )
                    : 0;

            taskProgress.style.width =
                `${percentage}%`;

            taskProgress.setAttribute(
                "aria-valuenow",
                percentage
            );
        }
    }

    /* =========================================================
       BÚSQUEDA GLOBAL
       ========================================================= */

    function closeGlobalSearch() {
        if (globalSearch) {
            globalSearch.classList.remove(
                "active"
            );
        }

        if (searchOverlay) {
            searchOverlay.classList.remove(
                "active"
            );
        }

        if (globalSearchResults) {
            globalSearchResults.innerHTML =
                "";
        }
    }

    function openGlobalSearch() {
        if (globalSearch) {
            globalSearch.classList.add(
                "active"
            );
        }

        if (searchOverlay) {
            searchOverlay.classList.add(
                "active"
            );
        }

        setTimeout(
            () => {
                globalSearchInput
                    ?.focus();
            },
            50
        );
    }

    function renderGlobalSearch() {
        if (
            !globalSearchResults ||
            !globalSearchInput
        ) {
            return;
        }

        const query =
            globalSearchInput
                .value
                .toLowerCase()
                .trim();

        globalSearchResults.innerHTML =
            "";

        if (!query) {
            globalSearchResults.innerHTML = `
                <div class="global-search-empty">
                    Escribe para buscar tareas,
                    proyectos o colaboradores.
                </div>
            `;

            return;
        }

        const taskResults =
            tasks
                .filter(
                    task => {
                        const title =
                            String(
                                task.title ||
                                task["TAREA PRINCIPAL"] ||
                                ""
                            ).toLowerCase();

                        return title.includes(
                            query
                        );
                    }
                )
                .slice(
                    0,
                    10
                );

        const projectResults =
            projects
                .filter(
                    project =>
                        String(
                            project.name ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                query
                            )
                )
                .slice(
                    0,
                    10
                );

        const collaboratorResults =
            collaborators
                .filter(
                    collaborator =>
                        String(
                            collaborator.name ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                query
                            )
                )
                .slice(
                    0,
                    10
                );

        if (
            !taskResults.length &&
            !projectResults.length &&
            !collaboratorResults.length
        ) {
            globalSearchResults.innerHTML = `
                <div class="global-search-empty">
                    No se encontraron resultados.
                </div>
            `;

            return;
        }

        if (taskResults.length) {
            const section =
                document.createElement(
                    "div"
                );

            section.className =
                "global-search-section";

            section.innerHTML = `
                <div class="global-search-section-title">
                    Tareas
                </div>
            `;

            taskResults.forEach(
                task => {
                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "global-search-result";

                    button.innerHTML = `
                        <span class="global-search-icon">
                            <i class="fa-solid fa-list-check"></i>
                        </span>

                        <span class="global-search-info">

                            <strong>
                                ${escapeHTML(
                                    task.title ||
                                    task["TAREA PRINCIPAL"] ||
                                    "Sin título"
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    getProjectName(
                                        task.projectId
                                    )
                                )}
                            </small>

                        </span>
                    `;

                    button.addEventListener(
                        "click",
                        () => {
                            closeGlobalSearch();

                            if (
                                isTaskCompleted(
                                    task
                                )
                            ) {
                                changeView(
                                    "completadas"
                                );
                            } else {
                                changeView(
                                    "tareas"
                                );
                            }
                        }
                    );

                    section.appendChild(
                        button
                    );
                }
            );

            globalSearchResults
                .appendChild(
                    section
                );
        }

        if (projectResults.length) {
            const section =
                document.createElement(
                    "div"
                );

            section.className =
                "global-search-section";

            section.innerHTML = `
                <div class="global-search-section-title">
                    Proyectos
                </div>
            `;

            projectResults.forEach(
                project => {
                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "global-search-result";

                    button.innerHTML = `
                        <span class="global-search-icon">
                            <i class="fa-solid ${escapeHTML(
                                getProjectIcon(
                                    project
                                )
                            )}"></i>
                        </span>

                        <span class="global-search-info">

                            <strong>
                                ${escapeHTML(
                                    project.name
                                )}
                            </strong>

                            <small>
                                Proyecto
                            </small>

                        </span>
                    `;

                    button.addEventListener(
                        "click",
                        () => {
                            closeGlobalSearch();

                            changeView(
                                "proyectos"
                            );
                        }
                    );

                    section.appendChild(
                        button
                    );
                }
            );

            globalSearchResults
                .appendChild(
                    section
                );
        }

        if (
            collaboratorResults.length
        ) {
            const section =
                document.createElement(
                    "div"
                );

            section.className =
                "global-search-section";

            section.innerHTML = `
                <div class="global-search-section-title">
                    Colaboradores
                </div>
            `;

            collaboratorResults.forEach(
                collaborator => {
                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "global-search-result";

                    button.innerHTML = `
                        <span class="global-search-icon">
                            <i class="fa-solid fa-user"></i>
                        </span>

                        <span class="global-search-info">

                            <strong>
                                ${escapeHTML(
                                    collaborator.name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    collaborator.role ||
                                    "Colaborador"
                                )}
                            </small>

                        </span>
                    `;

                    button.addEventListener(
                        "click",
                        () => {
                            closeGlobalSearch();

                            changeView(
                                "colaboradores"
                            );
                        }
                    );

                    section.appendChild(
                        button
                    );
                }
            );

            globalSearchResults
                .appendChild(
                    section
                );
        }
    }

    if (globalSearchInput) {
        globalSearchInput
            .addEventListener(
                "input",
                renderGlobalSearch
            );
    }

    if (searchOverlay) {
        searchOverlay.addEventListener(
            "click",
            closeGlobalSearch
        );
    }

    document.addEventListener(
        "keydown",
        event => {
            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key.toLowerCase() ===
                    "k"
            ) {
                event.preventDefault();

                openGlobalSearch();
            }

            if (
                event.key ===
                "Escape"
            ) {
                closeGlobalSearch();

                document
                    .querySelectorAll(
                        ".modal-overlay.active"
                    )
                    .forEach(
                        modal => {
                            closeModal(
                                modal
                            );
                        }
                    );
            }
        }
    );

    /* =========================================================
       ACTUALIZAR SELECTORES
       ========================================================= */

    function updateSelectOptions() {
        renderProjectSelects();
    }

    /* =========================================================
       ACTUALIZACIÓN GENERAL
       ========================================================= */

    function updateAll() {
        updateSelectOptions();

        renderTasks();

        renderProjects();

        renderCollaborators();

        renderCompleted();

        updateStats();

        updateFilterSwitches();
    }

    /* =========================================================
       ESTADO DE CONEXIÓN
       ========================================================= */

    function showConnectionError() {
        const existing =
            document.getElementById(
                "databaseConnectionError"
            );

        if (existing) {
            return;
        }

        const warning =
            document.createElement(
                "div"
            );

        warning.id =
            "databaseConnectionError";

        warning.className =
            "database-connection-error";

        warning.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>

            <span>
                No fue posible conectar con el servidor.
                Revisa que el backend esté ejecutándose.
            </span>
        `;

        document.body.prepend(
            warning
        );
    }

    function removeConnectionError() {
        document
            .getElementById(
                "databaseConnectionError"
            )
            ?.remove();
    }

    /* =========================================================
       INICIALIZACIÓN DE FECHA
       ========================================================= */

    function initializeDates() {
        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        if (
            inlineDate &&
            !inlineDate.value
        ) {
            inlineDate.value =
                today;
        }
    }

    /* =========================================================
       INICIALIZAR MODALES
       ========================================================= */

    function initializeModals() {
        document
            .querySelectorAll(
                "[data-modal]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            const modalId =
                                button.dataset
                                    .modal;

                            const modal =
                                document.getElementById(
                                    modalId
                                );

                            if (
                                modalId ===
                                "projectModal"
                            ) {
                                initializeProjectIconSelector();
                            }

                            openModal(
                                modal
                            );
                        }
                    );
                }
            );
    }

    /* =========================================================
       SEGURIDAD CONTRA DOBLE ENVÍO
       ========================================================= */

    function setButtonLoading(
        button,
        loading
    ) {
        if (!button) {
            return;
        }

        if (loading) {
            button.dataset.originalHtml =
                button.innerHTML;

            button.disabled =
                true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
            `;
        } else {
            button.disabled =
                false;

            if (
                button.dataset
                    .originalHtml
            ) {
                button.innerHTML =
                    button.dataset
                        .originalHtml;

                delete button.dataset
                    .originalHtml;
            }
        }
    }

    /* =========================================================
       SINCRONIZACIÓN MANUAL
       ========================================================= */

    async function reloadFromDatabase() {
        try {
            const connected =
                await loadDataFromAPI();

            if (!connected) {
                showConnectionError();
                return false;
            }

            removeConnectionError();

            updateAll();

            return true;

        } catch (error) {
            console.error(
                "Error sincronizando datos:",
                error
            );

            showConnectionError();

            return false;
        }
    }

    /*
     * Dejamos esta función disponible para depuración
     * desde la consola del navegador:
     *
     * await TaskFlowReload()
     */
    window.TaskFlowReload =
        reloadFromDatabase;

    /* =========================================================
       COMPROBACIÓN DE API
       ========================================================= */

    async function verifyAPI() {
        if (
            typeof TaskFlowAPI ===
            "undefined"
        ) {
            console.error(
                "TaskFlowAPI no está disponible. Comprueba que api.js se cargue antes que script.js."
            );

            showToast(
                "No se encontró la API de TaskFlow.",
                "error"
            );

            return false;
        }

        return true;
    }

    /* =========================================================
       INICIALIZACIÓN PRINCIPAL
       ========================================================= */

    async function initializeApp() {
        initializeDates();

        initializeModals();

        initializeProjectIconSelector();

        const apiAvailable =
            await verifyAPI();

        if (!apiAvailable) {
            showConnectionError();
            return;
        }

        /*
         * PostgreSQL / Neon es la única fuente
         * de tareas, proyectos y colaboradores.
         *
         * Ya no se cargan datos desde:
         *
         * - localStorage
         * - data.json
         * - arreglos precargados
         */

        const connected =
            await loadDataFromAPI();

        if (!connected) {
            showConnectionError();

            /*
             * Aunque no haya conexión, dibujamos
             * la aplicación vacía para evitar
             * errores visuales.
             */
            updateAll();

            return;
        }

        removeConnectionError();

        updateAll();

        console.log(
            "TaskFlow conectado a PostgreSQL correctamente."
        );
    }

    /* =========================================================
       ARRANQUE
       ========================================================= */

    await initializeApp();

});