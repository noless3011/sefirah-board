import { Router } from 'express';

const router = Router();

// Domain: User & Account Settings
// All these routes would require authentication middleware later
router.get('/me', (req, res) => { res.send('Not implemented'); });
router.patch('/me/profile', (req, res) => { res.send('Not implemented'); });
router.put('/me/password', (req, res) => { res.send('Not implemented'); });
router.patch('/me/preferences', (req, res) => { res.send('Not implemented'); });
router.delete('/me', (req, res) => { res.send('Not implemented'); });

export default router;
