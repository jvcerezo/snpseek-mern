import express from 'express'; 

import { getMyLists, createList, resolveIds} from '../controllers/listController.js';
import { protect}  from '../middleware/authMiddleware.js'; // Import the auth middleware

const router = express.Router();

router.use(protect); // Apply the auth middleware to all routes in this router

// Define the GET route to fetch all lists
router.get('/mine', protect, getMyLists); // Fetch all lists for the authenticated user
router.post('/create-list', createList); // Create a new list for the authenticated user
router.post('/resolve-ids', resolveIds); // Resolve IDs for the authenticated user


export default router;