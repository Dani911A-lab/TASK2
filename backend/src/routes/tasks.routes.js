const express = require('express');
const pool = require('../config/db');
const handleDatabaseError = require('../utils/databaseError');
const generateId = require('../utils/generateId');

const router = express.Router();


// OBTENER TODAS LAS TAREAS
router.get('/', async (req, res) => {
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
                    ) FILTER (WHERE c.id IS NOT NULL),
                    '[]'
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

            ORDER BY t.created_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo tareas:', error);

        res.status(500).json({
            message: 'Error obteniendo tareas'
        });
    }
});

// CREAR UNA TAREA
router.post('/', async (req, res) => {
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

        const taskId = id || generateId('task');
        
        if (!title) {
            return res.status(400).json({
                message: 'El título es obligatorio'
            });
        }

        const result = await pool.query(
            `INSERT INTO tasks (
                id,
                title,
                secondary_task,
                company,
                observations,
                priority,
                project_id,
                task_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                taskId,
                title,
                secondaryTask || null,
                company || null,
                observations || null,
                priority || 'media',
                projectId || null,
                date || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
    return handleDatabaseError(error, res);
}
});


// ASIGNAR UN COLABORADOR A UNA TAREA
router.post('/:taskId/collaborators/:collaboratorId', async (req, res) => {
    try {
        const { taskId, collaboratorId } = req.params;

        const result = await pool.query(
            `INSERT INTO task_collaborators (
                task_id,
                collaborator_id
            )
            VALUES ($1, $2)
            RETURNING *`,
            [taskId, collaboratorId]
        );

        res.status(201).json({
            message: 'Colaborador asignado correctamente',
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error('Error asignando colaborador:', error);

        res.status(500).json({
            message: 'Error asignando colaborador'
        });
    }
});

// ACTUALIZAR UNA TAREA
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            secondaryTask,
            company,
            observations,
            priority,
            projectId,
            date
        } = req.body;

        if (!title) {
            return res.status(400).json({
                message: 'El título es obligatorio'
            });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET title = $1,
                 secondary_task = $2,
                 company = $3,
                 observations = $4,
                 priority = $5,
                 project_id = $6,
                 task_date = $7
             WHERE id = $8
             RETURNING *`,
            [
                title,
                secondaryTask || null,
                company || null,
                observations || null,
                priority || 'media',
                projectId || null,
                date || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Tarea no encontrada'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error actualizando tarea:', error);

        res.status(500).json({
            message: 'Error actualizando tarea'
        });
    }
});

// MARCAR UNA TAREA COMO FINALIZADA
router.patch('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE tasks
             SET completed = TRUE,
                 completed_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Tarea no encontrada'
            });
        }

        res.json({
            message: 'Tarea finalizada correctamente',
            task: result.rows[0]
        });

    } catch (error) {
        console.error('Error finalizando tarea:', error);

        res.status(500).json({
            message: 'Error finalizando tarea'
        });
    }
});

// REABRIR UNA TAREA
router.patch('/:id/reopen', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE tasks
             SET completed = FALSE,
                 completed_at = NULL
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Tarea no encontrada'
            });
        }

        res.json({
            message: 'Tarea reabierta correctamente',
            task: result.rows[0]
        });

    } catch (error) {
        console.error('Error reabriendo tarea:', error);

        res.status(500).json({
            message: 'Error reabriendo tarea'
        });
    }
});

// ELIMINAR UNA TAREA
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM tasks
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Tarea no encontrada'
            });
        }

        res.json({
            message: 'Tarea eliminada correctamente',
            task: result.rows[0]
        });

    } catch (error) {
        console.error('Error eliminando tarea:', error);

        res.status(500).json({
            message: 'Error eliminando tarea'
        });
    }
});

// QUITAR UN COLABORADOR DE UNA TAREA
router.delete('/:taskId/collaborators/:collaboratorId', async (req, res) => {
    try {
        const { taskId, collaboratorId } = req.params;

        const result = await pool.query(
            `DELETE FROM task_collaborators
             WHERE task_id = $1
               AND collaborator_id = $2
             RETURNING *`,
            [taskId, collaboratorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'La asignación no existe'
            });
        }

        res.json({
            message: 'Colaborador retirado de la tarea correctamente'
        });

    } catch (error) {
        return handleDatabaseError(error, res);
    }
});
module.exports = router;

