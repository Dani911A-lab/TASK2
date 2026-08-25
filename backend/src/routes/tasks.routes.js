const express = require("express");
const pool = require("../config/db");
const handleDatabaseError = require("../utils/databaseError");
const generateId = require("../utils/generateId");

const router = express.Router();


/* =========================================================
   OBTENER TODAS LAS TAREAS
   GET /api/tasks
   ========================================================= */

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                t.*,
                p.name AS project_name,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'role', c.role,
                            'email', c.email
                        )
                    ) FILTER (
                        WHERE c.id IS NOT NULL
                    ),
                    '[]'::json
                ) AS members

            FROM tasks t

            LEFT JOIN projects p
                ON t.project_id = p.id

            LEFT JOIN task_collaborators tc
                ON t.id = tc.task_id

            LEFT JOIN collaborators c
                ON tc.collaborator_id = c.id

            GROUP BY
                t.id,
                p.name

            ORDER BY
                t.created_at DESC
        `);


        return res.json(
            result.rows
        );


    } catch (error) {

        console.error(
            "Error obteniendo tareas:",
            error
        );

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   CREAR UNA TAREA
   POST /api/tasks
   ========================================================= */

router.post("/", async (req, res) => {

    try {

        const {
            id,
            title,
            secondaryTask,
            company,
            observations,
            priority,
            projectId,
            date
        } = req.body;


        /* -----------------------------------------------------
           VALIDAR TÍTULO
           ----------------------------------------------------- */

        const cleanTitle =
            typeof title === "string"
                ? title.trim()
                : "";


        if (!cleanTitle) {

            return res
                .status(400)
                .json({
                    message:
                        "El título es obligatorio"
                });

        }


        /* -----------------------------------------------------
           GENERAR ID
           ----------------------------------------------------- */

        const taskId =
            id ||
            generateId(
                "task"
            );


        /* -----------------------------------------------------
           NORMALIZAR DATOS
           ----------------------------------------------------- */

        const cleanSecondaryTask =
            typeof secondaryTask === "string" &&
            secondaryTask.trim()
                ? secondaryTask.trim()
                : null;


        const cleanCompany =
            typeof company === "string" &&
            company.trim()
                ? company.trim()
                : null;


        const cleanObservations =
            typeof observations === "string" &&
            observations.trim()
                ? observations.trim()
                : null;


        const cleanPriority =
            typeof priority === "string" &&
            priority.trim()
                ? priority.trim().toLowerCase()
                : "media";


        const cleanProjectId =
            projectId ||
            null;


        const cleanDate =
            date ||
            null;


        /* -----------------------------------------------------
           INSERTAR TAREA
           ----------------------------------------------------- */

        const result =
            await pool.query(
                `
                INSERT INTO tasks (
                    id,
                    title,
                    secondary_task,
                    company,
                    observations,
                    priority,
                    project_id,
                    task_date
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8
                )

                RETURNING *
                `,
                [
                    taskId,
                    cleanTitle,
                    cleanSecondaryTask,
                    cleanCompany,
                    cleanObservations,
                    cleanPriority,
                    cleanProjectId,
                    cleanDate
                ]
            );


        /*
         * La tarea acaba de crearse,
         * por lo que todavía no tiene miembros.
         */

        const task = {
            ...result.rows[0],
            members: []
        };


        return res
            .status(201)
            .json(
                task
            );


    } catch (error) {

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   ACTUALIZAR UNA TAREA
   PUT /api/tasks/:id
   ========================================================= */

router.put("/:id", async (req, res) => {

    try {

        const { id } =
            req.params;


        const {
            title,
            secondaryTask,
            company,
            observations,
            priority,
            projectId,
            date
        } = req.body;


        /* -----------------------------------------------------
           VALIDAR TÍTULO
           ----------------------------------------------------- */

        const cleanTitle =
            typeof title === "string"
                ? title.trim()
                : "";


        if (!cleanTitle) {

            return res
                .status(400)
                .json({
                    message:
                        "El título es obligatorio"
                });

        }


        /* -----------------------------------------------------
           NORMALIZAR DATOS
           ----------------------------------------------------- */

        const cleanSecondaryTask =
            typeof secondaryTask === "string" &&
            secondaryTask.trim()
                ? secondaryTask.trim()
                : null;


        const cleanCompany =
            typeof company === "string" &&
            company.trim()
                ? company.trim()
                : null;


        const cleanObservations =
            typeof observations === "string" &&
            observations.trim()
                ? observations.trim()
                : null;


        const cleanPriority =
            typeof priority === "string" &&
            priority.trim()
                ? priority.trim().toLowerCase()
                : "media";


        const cleanProjectId =
            projectId ||
            null;


        const cleanDate =
            date ||
            null;


        /* -----------------------------------------------------
           ACTUALIZAR TAREA
           ----------------------------------------------------- */

        const result =
            await pool.query(
                `
                UPDATE tasks

                SET
                    title = $1,
                    secondary_task = $2,
                    company = $3,
                    observations = $4,
                    priority = $5,
                    project_id = $6,
                    task_date = $7

                WHERE id = $8

                RETURNING *
                `,
                [
                    cleanTitle,
                    cleanSecondaryTask,
                    cleanCompany,
                    cleanObservations,
                    cleanPriority,
                    cleanProjectId,
                    cleanDate,
                    id
                ]
            );


        if (
            result.rows.length ===
            0
        ) {

            return res
                .status(404)
                .json({
                    message:
                        "Tarea no encontrada"
                });

        }


        /*
         * Recuperamos también los colaboradores
         * asignados para devolver una tarea completa.
         */

        const membersResult =
            await pool.query(
                `
                SELECT
                    c.id,
                    c.name,
                    c.role,
                    c.email

                FROM task_collaborators tc

                INNER JOIN collaborators c
                    ON c.id = tc.collaborator_id

                WHERE tc.task_id = $1
                `,
                [id]
            );


        const task = {
            ...result.rows[0],
            members:
                membersResult.rows
        };


        return res.json(
            task
        );


    } catch (error) {

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   MARCAR TAREA COMO FINALIZADA
   PATCH /api/tasks/:id/complete
   ========================================================= */

router.patch("/:id/complete", async (req, res) => {

    try {

        const { id } =
            req.params;


        const result =
            await pool.query(
                `
                UPDATE tasks

                SET
                    completed = TRUE,
                    completed_at = CURRENT_TIMESTAMP

                WHERE id = $1

                RETURNING *
                `,
                [id]
            );


        if (
            result.rows.length ===
            0
        ) {

            return res
                .status(404)
                .json({
                    message:
                        "Tarea no encontrada"
                });

        }


        return res.json({

            message:
                "Tarea finalizada correctamente",

            task:
                result.rows[0]

        });


    } catch (error) {

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   REABRIR UNA TAREA
   PATCH /api/tasks/:id/reopen
   ========================================================= */

router.patch("/:id/reopen", async (req, res) => {

    try {

        const { id } =
            req.params;


        const result =
            await pool.query(
                `
                UPDATE tasks

                SET
                    completed = FALSE,
                    completed_at = NULL

                WHERE id = $1

                RETURNING *
                `,
                [id]
            );


        if (
            result.rows.length ===
            0
        ) {

            return res
                .status(404)
                .json({
                    message:
                        "Tarea no encontrada"
                });

        }


        return res.json({

            message:
                "Tarea reabierta correctamente",

            task:
                result.rows[0]

        });


    } catch (error) {

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   ASIGNAR COLABORADOR A UNA TAREA
   POST /api/tasks/:taskId/collaborators/:collaboratorId
   ========================================================= */

router.post(
    "/:taskId/collaborators/:collaboratorId",
    async (req, res) => {

        try {

            const {
                taskId,
                collaboratorId
            } = req.params;


            /* -------------------------------------------------
               COMPROBAR QUE LA TAREA EXISTE
               ------------------------------------------------- */

            const taskCheck =
                await pool.query(
                    `
                    SELECT id
                    FROM tasks
                    WHERE id = $1
                    `,
                    [taskId]
                );


            if (
                taskCheck.rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Tarea no encontrada"
                    });

            }


            /* -------------------------------------------------
               COMPROBAR QUE EL COLABORADOR EXISTE
               ------------------------------------------------- */

            const collaboratorCheck =
                await pool.query(
                    `
                    SELECT id
                    FROM collaborators
                    WHERE id = $1
                    `,
                    [collaboratorId]
                );


            if (
                collaboratorCheck.rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Colaborador no encontrado"
                    });

            }


            /* -------------------------------------------------
               EVITAR ASIGNACIONES DUPLICADAS
               ------------------------------------------------- */

            const existing =
                await pool.query(
                    `
                    SELECT
                        task_id,
                        collaborator_id

                    FROM task_collaborators

                    WHERE
                        task_id = $1
                        AND collaborator_id = $2
                    `,
                    [
                        taskId,
                        collaboratorId
                    ]
                );


            if (
                existing.rows.length >
                0
            ) {

                /*
                 * No lo tratamos como error.
                 * La asignación ya existe,
                 * así que el estado deseado
                 * ya se encuentra cumplido.
                 */

                return res.json({

                    message:
                        "El colaborador ya está asignado a la tarea",

                    assignment:
                        existing.rows[0]

                });

            }


            /* -------------------------------------------------
               CREAR ASIGNACIÓN
               ------------------------------------------------- */

            const result =
                await pool.query(
                    `
                    INSERT INTO task_collaborators (
                        task_id,
                        collaborator_id
                    )

                    VALUES (
                        $1,
                        $2
                    )

                    RETURNING *
                    `,
                    [
                        taskId,
                        collaboratorId
                    ]
                );


            return res
                .status(201)
                .json({

                    message:
                        "Colaborador asignado correctamente",

                    assignment:
                        result.rows[0]

                });


        } catch (error) {

            return handleDatabaseError(
                error,
                res
            );

        }

    }
);


/* =========================================================
   QUITAR COLABORADOR DE UNA TAREA
   DELETE /api/tasks/:taskId/collaborators/:collaboratorId
   ========================================================= */

router.delete(
    "/:taskId/collaborators/:collaboratorId",
    async (req, res) => {

        try {

            const {
                taskId,
                collaboratorId
            } = req.params;


            const result =
                await pool.query(
                    `
                    DELETE FROM task_collaborators

                    WHERE
                        task_id = $1
                        AND collaborator_id = $2

                    RETURNING *
                    `,
                    [
                        taskId,
                        collaboratorId
                    ]
                );


            if (
                result.rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "La asignación no existe"
                    });

            }


            return res.json({

                message:
                    "Colaborador retirado de la tarea correctamente",

                assignment:
                    result.rows[0]

            });


        } catch (error) {

            return handleDatabaseError(
                error,
                res
            );

        }

    }
);


/* =========================================================
   ELIMINAR UNA TAREA
   DELETE /api/tasks/:id
   ========================================================= */

router.delete("/:id", async (req, res) => {

    /*
     * Utilizamos una transacción porque primero
     * eliminamos las relaciones con colaboradores
     * y después la tarea.
     */

    const client =
        await pool.connect();


    try {

        const { id } =
            req.params;


        await client.query(
            "BEGIN"
        );


        /* -----------------------------------------------------
           ELIMINAR ASIGNACIONES
           ----------------------------------------------------- */

        await client.query(
            `
            DELETE FROM task_collaborators
            WHERE task_id = $1
            `,
            [id]
        );


        /* -----------------------------------------------------
           ELIMINAR TAREA
           ----------------------------------------------------- */

        const result =
            await client.query(
                `
                DELETE FROM tasks

                WHERE id = $1

                RETURNING *
                `,
                [id]
            );


        if (
            result.rows.length ===
            0
        ) {

            await client.query(
                "ROLLBACK"
            );


            return res
                .status(404)
                .json({
                    message:
                        "Tarea no encontrada"
                });

        }


        await client.query(
            "COMMIT"
        );


        return res.json({

            message:
                "Tarea eliminada correctamente",

            task:
                result.rows[0]

        });


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );


        return handleDatabaseError(
            error,
            res
        );


    } finally {

        client.release();

    }

});


/* =========================================================
   EXPORTAR ROUTER
   ========================================================= */

module.exports = router;