const express = require('express');
const router = express.Router();
const pool = require('./db');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM ' + process.env.TABLE);
        const records = result.rows;
        client.release();
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
