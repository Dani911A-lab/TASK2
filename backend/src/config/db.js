const { Pool } = require("pg");

/* =========================================================
   CONEXIÓN A POSTGRESQL / NEON
   ========================================================= */

if (!process.env.DATABASE_URL) {
    console.error(
        "❌ ERROR: No se encontró la variable DATABASE_URL."
    );

    console.error(
        "Verifica que exista en el archivo .env o en las variables del servidor."
    );

    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    },

    max: 10,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 10000
});


/* =========================================================
   EVENTOS DE LA CONEXIÓN
   ========================================================= */

pool.on("connect", () => {
    console.log("✅ Conexión establecida con PostgreSQL / Neon");
});

pool.on("error", (error) => {
    console.error(
        "❌ Error inesperado en PostgreSQL:",
        error
    );
});


/* =========================================================
   EXPORTAR POOL
   ========================================================= */

module.exports = pool;