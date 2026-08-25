require("dotenv").config();

const express = require("express");
const cors = require("cors");

const pool = require("./config/db");

const projectsRoutes =
    require("./routes/projects.routes");

const tasksRoutes =
    require("./routes/tasks.routes");

const collaboratorsRoutes =
    require("./routes/collaborators.routes");


/* =========================================================
   CREAR APLICACIÓN EXPRESS
   ========================================================= */

const app = express();

const PORT =
    process.env.PORT || 3000;


/* =========================================================
   CORS
   ========================================================= */

/*
 * Durante el desarrollo permitimos solicitudes desde:
 *
 * - localhost
 * - Live Server
 * - IP local
 * - GitHub Pages
 *
 * Más adelante, cuando publiquemos el backend,
 * podremos restringirlo específicamente al dominio
 * de TaskFlow.
 */

app.use(
    cors({
        origin: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


/* =========================================================
   MIDDLEWARE JSON
   ========================================================= */

app.use(
    express.json({
        limit: "2mb"
    })
);


/* =========================================================
   RUTA PRINCIPAL
   ========================================================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        message:
            "Servidor TaskFlow funcionando"
    });

});


/* =========================================================
   INFORMACIÓN DE LA API
   ========================================================= */

app.get("/api", (req, res) => {

    res.json({
        success: true,
        message:
            "API de TaskFlow funcionando",

        endpoints: {
            projects:
                "/api/projects",

            tasks:
                "/api/tasks",

            collaborators:
                "/api/collaborators",

            database:
                "/api/db-test"
        }
    });

});


/* =========================================================
   COMPROBAR POSTGRESQL / NEON
   ========================================================= */

app.get(
    "/api/db-test",
    async (req, res) => {

        try {

            const result =
                await pool.query(`
                    SELECT
                        NOW() AS fecha_servidor
                `);


            return res.json({

                success: true,

                message:
                    "PostgreSQL / Neon conectado correctamente",

                databaseTime:
                    result.rows[0]
                        .fecha_servidor

            });


        } catch (error) {

            console.error(
                "Error de PostgreSQL:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Error al conectar con PostgreSQL"

                });

        }

    }
);


/* =========================================================
   RUTAS
   ========================================================= */

app.use(
    "/api/projects",
    projectsRoutes
);

app.use(
    "/api/tasks",
    tasksRoutes
);

app.use(
    "/api/collaborators",
    collaboratorsRoutes
);


/* =========================================================
   RUTA API NO ENCONTRADA
   ========================================================= */

app.use(
    "/api",
    (req, res) => {

        return res
            .status(404)
            .json({

                success: false,

                message:
                    "Ruta de API no encontrada"

            });

    }
);


/* =========================================================
   MANEJADOR GENERAL DE ERRORES
   ========================================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Error interno del servidor:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(
                error
            );

        }


        return res
            .status(500)
            .json({

                success: false,

                message:
                    "Error interno del servidor"

            });

    }
);


/* =========================================================
   INICIAR SERVIDOR
   ========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "===================================="
        );

        console.log(
            "🚀 TaskFlow Backend iniciado"
        );

        console.log(
            `📡 Puerto: ${PORT}`
        );

        console.log(
            `🔗 API local: http://localhost:${PORT}/api`
        );

        console.log(
            `🗄️  DB Test: http://localhost:${PORT}/api/db-test`
        );

        console.log(
            "===================================="
        );

    }
);