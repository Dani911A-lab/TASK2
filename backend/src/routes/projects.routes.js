const express = require('express');
const pool = require('../config/db');
const handleDatabaseError = require('../utils/databaseError');

const router = express.Router();


// OBTENER TODOS LOS PROYECTOS
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM projects
            ORDER BY created_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo proyectos:', error);

        res.status(500).json({
            message: 'Error obteniendo proyectos'
        });
    }
});


// CREAR UN PROYECTO
router.post('/', async (req, res) => {
    try {
        const { id, name, description, icon } = req.body;

        if (!id || !name) {
            return res.status(400).json({
                message: 'El id y el nombre son obligatorios'
            });
        }

        const result = await pool.query(
            `INSERT INTO projects (id, name, description, icon)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, name, description || null, icon || null]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
    return handleDatabaseError(error, res);
}
});


// ACTUALIZAR UN PROYECTO
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon } = req.body;

        if (!name) {
            return res.status(400).json({
                message: 'El nombre es obligatorio'
            });
        }

        const result = await pool.query(
            `UPDATE projects
             SET name = $1,
                 description = $2,
                 icon = $3
             WHERE id = $4
             RETURNING *`,
            [
                name,
                description || null,
                icon || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error actualizando proyecto:', error);

        res.status(500).json({
            message: 'Error actualizando proyecto'
        });
    }
});

// ELIMINAR UN PROYECTO
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM projects
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        res.json({
            message: 'Proyecto eliminado correctamente',
            project: result.rows[0]
        });

    } catch (error) {
        console.error('Error eliminando proyecto:', error);

        res.status(500).json({
            message: 'Error eliminando proyecto'
        });
    }
});

module.exports = router;