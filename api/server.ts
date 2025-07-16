import express from 'express';
import itemRoutes from './src/routes/items';
import { errorHandler } from './src/middleware/errors';
import helmet from 'helmet';
import { createServer } from 'http';
import DB from './src/services/db';
// import dotenv from 'dotenv';
// dotenv.config();

const port = process.env.FGD_API_PORT || 3000;

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(helmet());


// Routes
app.use('/items/', itemRoutes);

// Routes
app.use('/register', itemRoutes);

app.use('/', (req, res) => {
  res.send(JSON.stringify({message:'Welcome to the API'})); 
});
// Global error handler (should be after routes)
// app.use(errorHandler);

httpServer.listen(port, () => {
  console.log(`application is running at: http://localhost:${port}`);
});
