import { Router } from 'express';

const router = Router();

// Domain: Board Management
router.get('/', (req, res) => { res.send('Not implemented'); });
router.post('/', (req, res) => { res.send('Not implemented'); });
router.get('/:boardId', (req, res) => { res.send('Not implemented'); });
router.patch('/:boardId', (req, res) => { res.send('Not implemented'); });
router.delete('/:boardId', (req, res) => { res.send('Not implemented'); });
router.post('/:boardId/thumbnail', (req, res) => { res.send('Not implemented'); });
router.post('/:boardId/export', (req, res) => { res.send('Not implemented'); });

// Domain: Collaboration & Sharing
router.get('/:boardId/collaborators', (req, res) => { res.send('Not implemented'); });
router.post('/:boardId/collaborators/invite', (req, res) => { res.send('Not implemented'); });
router.post('/:boardId/collaborators/link', (req, res) => { res.send('Not implemented'); });
router.patch('/:boardId/collaborators/:userId', (req, res) => { res.send('Not implemented'); });
router.delete('/:boardId/collaborators/:userId', (req, res) => { res.send('Not implemented'); });

// Standalone invite redeem (can also be in a generic invites router)
router.post('/api/v1/invites/redeem', (req, res) => { res.send('Not implemented'); });

// Domain: Canvas State REST
router.get('/:boardId/canvas/elements', (req, res) => { res.send('Not implemented'); });
router.put('/:boardId/canvas/snapshot', (req, res) => { res.send('Not implemented'); });

// Domain: Board History
router.get('/:boardId/history', (req, res) => { res.send('Not implemented'); });
router.get('/:boardId/history/:revisionId', (req, res) => { res.send('Not implemented'); });
router.post('/:boardId/history/restore', (req, res) => { res.send('Not implemented'); });

// Domain: Active Threads/Chat
router.get('/:boardId/threads', (req, res) => { res.send('Not implemented'); });
router.post('/:boardId/threads', (req, res) => { res.send('Not implemented'); });
router.post('/:boardId/threads/:threadId/reply', (req, res) => { res.send('Not implemented'); });
router.patch('/:boardId/threads/:threadId', (req, res) => { res.send('Not implemented'); });

export default router;
