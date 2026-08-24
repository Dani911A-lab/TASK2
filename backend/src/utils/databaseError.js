function handleDatabaseError(error, res) {

    // Registro duplicado
    if (error.code === '23505') {
        return res.status(409).json({
            message: 'Ya existe un registro con ese identificador'
        });
    }

    // Foreign Key inválida
    if (error.code === '23503') {
        return res.status(400).json({
            message: 'Uno de los registros relacionados no existe'
        });
    }

    console.error('Error de base de datos:', error);

    return res.status(500).json({
        message: 'Error interno del servidor'
    });
}

module.exports = handleDatabaseError;