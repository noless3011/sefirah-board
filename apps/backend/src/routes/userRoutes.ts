import { Router } from 'express';
import {
	getMe,
	updateMyProfile,
	updateMyPassword,
	updateMyPreferences,
	deactivateMyAccount,
} from '../controllers/userController.js';

const router = Router();

// Domain: User & Account Settings
// Access token validation is handled in controller for now.
router.get('/me', getMe);
router.patch('/me/profile', updateMyProfile);
router.put('/me/password', updateMyPassword);
router.patch('/me/preferences', updateMyPreferences);
router.delete('/me', deactivateMyAccount);

export default router;
