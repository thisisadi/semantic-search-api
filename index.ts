import express from "express";
import recordsRouter from "./routes";
import { scheduleIndexingRecords } from './scheduler';
import cors from 'cors';

const app = express();
const PORT = 3000;

async function startServer() {
    await scheduleIndexingRecords();

    app.use(cors());
    app.use(express.json());
    app.use('/', recordsRouter);

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();
