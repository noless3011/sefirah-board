import { Router } from 'express';

const router = Router();

// Domain: Authentication
router.post('/register', (req, res) => { res.send('Not implemented'); });
router.post('/login', (req, res) => { res.send('Not implemented'); });
router.post('/oauth/google', (req, res) => { res.send('Not implemented'); });
router.post('/oauth/github', (req, res) => { res.send('Not implemented'); });
router.post('/refresh-token', (req, res) => { res.send('Not implemented'); });
router.post('/forgot-password', (req, res) => { res.send('Not implemented'); });
router.post('/reset-password', (req, res) => { res.send('Not implemented'); });

export default router;
