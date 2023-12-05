const express = require('express');
const router = express.Router();
const { getAllRecords } = require('./utils');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const records = await getAllRecords();
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;