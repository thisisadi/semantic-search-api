import * as express from "express";
import { createPgConnection } from './utils';
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

export default router;