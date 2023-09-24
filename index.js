const express = require('express');
const recordsRouter = require('./routes');
const client = require('./elasticsearch/client');
const cors = require('cors');

const app = express();

app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Mount the routes
app.use('/', recordsRouter);

// Start the server
const PORT = 10000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
