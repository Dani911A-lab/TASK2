const express = require('express');
const pool = require('../config/db');
const handleDatabaseError = require('../utils/databaseError');
const generateId = require('../utils/generateId');

const router = express.Router();


// OBTENER TODOS LOS COLABORADORES
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM collaborators
            ORDER BY created_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo colaboradores:', error);

        res.status(500).json({
            message: 'Error obteniendo colaboradores'
        });
    }
});


// CREAR UN COLABORADOR
router.post('/', async (req, res) => {
    try {
        const { id, name, role, email } = req.body;
        const collaboratorId = id || generateId('collaborator');

        if (!name) {
            return res.status(400).json({
                message: 'El id y el nombre son obligatorios'
            });
        }

        const result = await pool.query(
            `INSERT INTO collaborators (
                id,
                name,
                role,
                email
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                collaboratorId,
                name,
                role || null,
                email || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
    return handleDatabaseError(error, res);
}
});
// ACTUALIZAR UN COLABORADOR
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, email } = req.body;

        if (!name) {
            return res.status(400).json({
                message: 'El nombre es obligatorio'
            });
        }

        const result = await pool.query(
            `UPDATE collaborators
             SET name = $1,
                 role = $2,
                 email = $3
             WHERE id = $4
             RETURNING *`,
            [
                name,
                role || null,
                email || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Colaborador no encontrado'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        return handleDatabaseError(error, res);
    }
});
// ELIMINAR UN COLABORADOR
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM collaborators
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Colaborador no encontrado'
            });
        }

        res.json({
            message: 'Colaborador eliminado correctamente',
            collaborator: result.rows[0]
        });

    } catch (error) {
        return handleDatabaseError(error, res);
    }
});

module.exports = router;