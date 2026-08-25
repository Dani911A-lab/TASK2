const express = require("express");
const pool = require("../config/db");
const handleDatabaseError = require("../utils/databaseError");
const generateId = require("../utils/generateId");

const router = express.Router();


/* =========================================================
   OBTENER TODOS LOS COLABORADORES
   GET /api/collaborators
   ========================================================= */

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                id,
                name,
                role,
                email,
                created_at
            FROM collaborators
            ORDER BY created_at DESC
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(
            "Error obteniendo colaboradores:",
            error
        );

        return handleDatabaseError(
            error,
            res
        );

    }

});


/* =========================================================
   CREAR COLABORADOR
   POST /api/collaborators
   ========================================================= */

router.post("/", async (req, res) => {

    try {

        const {
            id,
            name,
            role,
            email
        } = req.body;


        /* -----------------------------------------------------
           VALIDAR NOMBRE
           ----------------------------------------------------- */

        const cleanName =
            typeof name === "string"
                ? name.trim()
                : "";


        if (!cleanName) {

            return res.status(400).json({
                message:
                    "El nombre del colaborador es obligatorio"
            });

        }


        /* -----------------------------------------------------
           GENERAR ID AUTOMÁTICAMENTE
           ----------------------------------------------------- */

        const collaboratorId =
            id ||
            generateId(
                "collaborator"
            );


        /* -----------------------------------------------------
           NORMALIZAR CAMPOS OPCIONALES
           ----------------------------------------------------- */

        const cleanRole =
            typeof role === "string" &&
            role.trim()
                ? role.trim()
                : null;


        const cleanEmail =
            typeof email === "string" &&
            email.trim()
                ? email.trim()
                : null;


        /* -----------------------------------------------------
           INSERTAR EN POSTGRESQL
           ----------------------------------------------------- */

        const result =
            await pool.query(
                `
                INSERT INTO collaborators (
                    id,
                    name,
                    role,
                    email
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
                    role,
                    email,
                    created_at
                `,
                [
                    collaboratorId,
                    cleanName,
                    cleanRole,
                    cleanEmail
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
   ACTUALIZAR COLABORADOR
   PUT /api/collaborators/:id
   ========================================================= */

router.put("/:id", async (req, res) => {

    try {

        const { id } =
            req.params;


        const {
            name,
            role,
            email
        } = req.body;


        /* -----------------------------------------------------
           VALIDAR NOMBRE
           ----------------------------------------------------- */

        const cleanName =
            typeof name === "string"
                ? name.trim()
                : "";


        if (!cleanName) {

            return res.status(400).json({
                message:
                    "El nombre del colaborador es obligatorio"
            });

        }


        /* -----------------------------------------------------
           NORMALIZAR CAMPOS
           ----------------------------------------------------- */

        const cleanRole =
            typeof role === "string" &&
            role.trim()
                ? role.trim()
                : null;


        const cleanEmail =
            typeof email === "string" &&
            email.trim()
                ? email.trim()
                : null;


        /* -----------------------------------------------------
           ACTUALIZAR EN POSTGRESQL
           ----------------------------------------------------- */

        const result =
            await pool.query(
                `
                UPDATE collaborators

                SET
                    name = $1,
                    role = $2,
                    email = $3

                WHERE id = $4

                RETURNING
                    id,
                    name,
                    role,
                    email,
                    created_at
                `,
                [
                    cleanName,
                    cleanRole,
                    cleanEmail,
                    id
                ]
            );


        /* -----------------------------------------------------
           VALIDAR EXISTENCIA
           ----------------------------------------------------- */

        if (
            result.rows.length ===
            0
        ) {

            return res
                .status(404)
                .json({
                    message:
                        "Colaborador no encontrado"
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
   ELIMINAR COLABORADOR
   DELETE /api/collaborators/:id
   ========================================================= */

router.delete("/:id", async (req, res) => {

    try {

        const { id } =
            req.params;


        const result =
            await pool.query(
                `
                DELETE FROM collaborators

                WHERE id = $1

                RETURNING
                    id,
                    name,
                    role,
                    email,
                    created_at
                `,
                [id]
            );


        /* -----------------------------------------------------
           VALIDAR EXISTENCIA
           ----------------------------------------------------- */

        if (
            result.rows.length ===
            0
        ) {

            return res
                .status(404)
                .json({
                    message:
                        "Colaborador no encontrado"
                });

        }


        return res.json({

            message:
                "Colaborador eliminado correctamente",

            collaborator:
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