require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function initializeDatabase() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');

        const schema = fs.readFileSync(schemaPath, 'utf8');

        await pool.query(schema);

        console.log('Base de datos inicializada correctamente.');
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
    } finally {
        await pool.end();
    }
}

initializeDatabase();