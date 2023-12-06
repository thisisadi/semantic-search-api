import express from "express";
import recordsRouter from "./routes";
import cors from 'cors';
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/', recordsRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
