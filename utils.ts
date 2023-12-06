import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const modelId = "sentence-transformers/all-MiniLM-L6-v2";
const hfToken = process.env.HFTOKEN;
const apiUrl = `https://api-inference.huggingface.co/pipeline/feature-extraction/${modelId}`;
const headers = { "Authorization": `Bearer ${hfToken}` };

async function createEmbedding(texts: string) {
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

async function createPgConnection() {
    const pool = new Pool({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDB,
        password: process.env.PGPASSWORD,
        port: Number(process.env.PGPORT),
    });
    const client = await pool.connect();
    return client;
}

export {
    createEmbedding,
    createPgConnection
};