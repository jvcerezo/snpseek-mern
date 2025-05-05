import express from 'express'; 

import { getMyLists, 
         createList, 
         resolveIds,
         updateList,
         deleteList,
         getInternalListDetails
    } from '../controllers/listController.js';
import { protect}  from '../middleware/authMiddleware.js'; // Import the auth middleware

const router = express.Router();

router.use(protect); // Apply the auth middleware to all routes in this router

// Define the GET route to fetch all lists
router.get('/mine', protect, getMyLists); // Fetch all lists for the authenticated user
router.post('/create-list', createList); // Create a new list for the authenticated user
router.post('/resolve-ids', resolveIds); // Resolve IDs for the authenticated user
router.put('/update-list/:id', updateList); // Update a list for the authenticated user
router.delete('/delete-list/:id', deleteList); // Delete a list for the authenticated user
router.get('/internal/:id', getInternalListDetails); // Fetch internal list details for the authenticated user

export default router;