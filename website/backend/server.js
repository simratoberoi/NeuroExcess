import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import contactRoutes from './routes/contact.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI ;

// Middleware
app.use(cors({
  origin: '*', // For development, allow all. You can restrict this to specific origins in production.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });

// Mount Routes
app.use('/api', contactRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('NeuroAccess API Server is running. Access contact form submissions via POST /api/contact.');
});

// Global Error Handler Middleware (placed after routes)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
