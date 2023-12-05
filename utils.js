const { Pool } = require('pg');
const mysql = require('mysql2/promise');
require('dotenv').config();

const modelId = "sentence-transformers/all-MiniLM-L6-v2";
const hfToken = process.env.HFTOKEN;
const apiUrl = `https://api-inference.huggingface.co/pipeline/feature-extraction/${modelId}`;
const headers = { "Authorization": `Bearer ${hfToken}` };
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDB,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

async function createEmbedding(texts) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                "inputs": texts,
                "options": { "wait_for_model": true }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        throw new Error(`Error fetching data: ${error}`);
    }
}

async function getAllRecords() {
    const client = await pool.connect();

    try {
        const result = await client.query('SELECT * FROM ' + process.env.TABLE);
        return result.rows;
    } finally {
        client.release();
    }
}

module.exports = {
    getAllRecords, createEmbedding
};