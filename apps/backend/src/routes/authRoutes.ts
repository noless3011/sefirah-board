import { Router } from 'express';
import { googleOAuth, githubOAuth } from '../controllers/authController.js';

const router = Router();

// Domain: Authentication
router.post('/register', (req, res) => { res.send('Not implemented'); });
router.post('/login', (req, res) => { res.send('Not implemented'); });
router.post('/oauth/google', googleOAuth);
router.post('/oauth/github', githubOAuth);
router.post('/refresh-token', (req, res) => { res.send('Not implemented'); });
router.post('/forgot-password', (req, res) => { res.send('Not implemented'); });
router.post('/reset-password', (req, res) => { res.send('Not implemented'); });

export default router;
