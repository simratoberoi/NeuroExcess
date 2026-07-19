import express from 'express';
import { submitContact, getHealth } from '../controllers/contact.controller.js';

const router = express.Router();

// Define contact routes
router.post('/contact', submitContact);
router.get('/health', getHealth);

export default router;
