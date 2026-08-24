require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const projectsRoutes = require('./routes/projects.routes');
const tasksRoutes = require('./routes/tasks.routes');
const collaboratorsRoutes = require('./routes/collaborators.routes');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/collaborators', collaboratorsRoutes);

// Ruta principal de la API
app.get('/api', (req, res) => {
    res.json({
        message: 'API de TaskFlow funcionando'
    });
});

// Comprobar conexión con PostgreSQL
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT NOW() AS fecha_servidor'
        );

        res.json({
            success: true,
            message: 'PostgreSQL conectado correctamente',
            databaseTime: result.rows[0].fecha_servidor
        });

    } catch (error) {
        console.error('Error de PostgreSQL:', error);

        res.status(500).json({
            success: false,
            message: 'Error al conectar con PostgreSQL'
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `Servidor TaskFlow ejecutándose en http://localhost:${PORT}`
    );
});