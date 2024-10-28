'use strict';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import config from './config/config.js'; // Ensure this is the correct path and name
import { router as studentRoutes } from './routes/student-routes.js'; // Update import

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use('/api', studentRoutes); // Use the student routes here

app.listen(config.port, () => console.log(`App is listening on port ${config.port}`));
