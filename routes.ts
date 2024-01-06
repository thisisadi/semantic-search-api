import * as express from "express";
import { createEmbedding, createPgConnection } from './utils';
import { Pinecone } from '@pinecone-database/pinecone';
import type { Project } from "./types";
require('dotenv').config();

const router = express.Router();

require('dotenv').config();

router.get('/', async (req, res) => {
    const client = await createPgConnection();
    try {
        const result = await client.query("SELECT * FROM public.projects");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        client.release();
    }
});

// Route for handling search queries
router.get('/search', async (req, res) => {
    try {
        const query = req.query.query as string;
        const k = parseInt(req.query.k as string, 10) || 3; // Default to 3 if k isn't provided or not a valid number
        const pinecone = new Pinecone();
        const indexName = process.env.PINECONE_INDEX || '';
        const index = pinecone.index<Project>(indexName);

        // Create vector embeddings for the query
        const queryEmbedding = await createEmbedding(query);

        // Query the index using the query embeddings
        const results = await index.query({
            vector: queryEmbedding as Array<number>,
            topK: k,
            includeMetadata: true,
            includeValues: false
        });

        res.json(results.matches?.map((match) => match.metadata));

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;