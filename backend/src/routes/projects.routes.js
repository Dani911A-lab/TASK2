const express = require("express");
const pool = require("../config/db");
const handleDatabaseError = require("../utils/databaseError");
const generateId = require("../utils/generateId");

const router = express.Router();


/* =========================================================
   OBTENER TODOS LOS PROYECTOS
   GET /api/projects
   ========================================================= */

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                id,
                name,
                description,
                icon,
                created_at
            FROM projects
            ORDER BY created_at DESC
        `);

        return res.json(
            result.rows
        );

    } catch (error) {

        console.error(
            "Error obteniendo proyectos:",
            error
        );

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   CREAR PROYECTO
   POST /api/projects
   ========================================================= */

router.post("/", async (req, res) => {

    try {

        const {
            id,
            name,
            description,
            icon
        } = req.body;


        /* -----------------------------------------------------
           VALIDAR NOMBRE
           ----------------------------------------------------- */

        const cleanName =
            typeof name === "string"
                ? name.trim()
                : "";


        if (!cleanName) {

            return res
                .status(400)
                .json({
                    message:
                        "El nombre del proyecto es obligatorio"
                });

        }


        /* -----------------------------------------------------
           GENERAR ID AUTOMÁTICAMENTE
           ----------------------------------------------------- */

        const projectId =
            id ||
            generateId(
                "project"
            );


        /* -----------------------------------------------------
           NORMALIZAR CAMPOS OPCIONALES
           ----------------------------------------------------- */

        const cleanDescription =
            typeof description === "string" &&
            description.trim()
                ? description.trim()
                : null;


        const cleanIcon =
            typeof icon === "string" &&
            icon.trim()
                ? icon.trim()
                : "fa-folder";


        /* -----------------------------------------------------
           INSERTAR EN POSTGRESQL
           ----------------------------------------------------- */

        const result =
            await pool.query(
                `
                INSERT INTO projects (
                    id,
                    name,
                    description,
                    icon
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )

                RETURNING
                    id,
                    name,
                    description,
                    icon,
                    created_at
                `,
                [
                    projectId,
                    cleanName,
                    cleanDescription,
                    cleanIcon
                ]
            );


        return res
            .status(201)
            .json(
                result.rows[0]
            );


    } catch (error) {

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   ACTUALIZAR PROYECTO
   PUT /api/projects/:id
   ========================================================= */

router.put("/:id", async (req, res) => {

    try {

        const { id } =
            req.params;


        const {
            name,
            description,
            icon
        } = req.body;


        /* -----------------------------------------------------
           VALIDAR NOMBRE
           ----------------------------------------------------- */

        const cleanName =
            typeof name === "string"
                ? name.trim()
                : "";


        if (!cleanName) {

            return res
                .status(400)
                .json({
                    message:
                        "El nombre del proyecto es obligatorio"
                });

        }


        /* -----------------------------------------------------
           NORMALIZAR CAMPOS
           ----------------------------------------------------- */

        const cleanDescription =
            typeof description === "string" &&
            description.trim()
                ? description.trim()
                : null;


        const cleanIcon =
            typeof icon === "string" &&
            icon.trim()
                ? icon.trim()
                : "fa-folder";


        /* -----------------------------------------------------
           ACTUALIZAR EN POSTGRESQL
           ----------------------------------------------------- */

        const result =
            await pool.query(
                `
                UPDATE projects

                SET
                    name = $1,
                    description = $2,
                    icon = $3

                WHERE id = $4

                RETURNING
                    id,
                    name,
                    description,
                    icon,
                    created_at
                `,
                [
                    cleanName,
                    cleanDescription,
                    cleanIcon,
                    id
                ]
            );


        /* -----------------------------------------------------
           PROYECTO NO ENCONTRADO
           ----------------------------------------------------- */

        if (
            result.rows.length ===
            0
        ) {

            return res
                .status(404)
                .json({
                    message:
                        "Proyecto no encontrado"
                });

        }


        return res.json(
            result.rows[0]
        );


    } catch (error) {

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   ELIMINAR PROYECTO
   DELETE /api/projects/:id
   ========================================================= */

router.delete("/:id", async (req, res) => {

    try {

        const { id } =
            req.params;


        /* -----------------------------------------------------
           COMPROBAR SI EL PROYECTO TIENE TAREAS
           ----------------------------------------------------- */

        const taskCheck =
            await pool.query(
                `
                SELECT COUNT(*)::int AS total
                FROM tasks
                WHERE project_id = $1
                `,
                [id]
            );


        if (
            taskCheck.rows[0].total >
            0
        ) {

            return res
                .status(409)
                .json({
                    message:
                        "No se puede eliminar el proyecto porque tiene tareas asociadas"
                });

        }


        /* -----------------------------------------------------
           ELIMINAR PROYECTO
           ----------------------------------------------------- */

        const result =
            await pool.query(
                `
                DELETE FROM projects

                WHERE id = $1

                RETURNING
                    id,
                    name,
                    description,
                    icon,
                    created_at
                `,
                [id]
            );


        /* -----------------------------------------------------
           PROYECTO NO ENCONTRADO
           ----------------------------------------------------- */

        if (
            result.rows.length ===
            0
        ) {

            return res
                .status(404)
                .json({
                    message:
                        "Proyecto no encontrado"
                });

        }


        return res.json({

            message:
                "Proyecto eliminado correctamente",

            project:
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
   EXPORTAR ROUTER
   ========================================================= */

module.exports = router;