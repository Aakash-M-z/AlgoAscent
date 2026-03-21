import { Router } from 'express';
import { storage } from './storage.js';
import { verifyToken, extractBearer } from './jwt.js';

const router = Router();

/**
 * Middleware to authenticate requests using JWT.
 * Attaches user to req.user.
 */
export async function authenticate(req: any, res: any, next: any) {
    const token = extractBearer(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Missing authentication token' });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

    const user = await storage.getUser(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
}

/**
 * GET /api/user/profile
 * Returns the current user's profile information.
 */
router.get('/profile', authenticate, (req: any, res: any) => {
    const { password, ...safeUser } = req.user;
    res.json(safeUser);
});

/**
 * PUT /api/user/profile
 * Updates the current user's profile information.
 */
router.put('/profile', authenticate, async (req: any, res: any) => {
    try {
        const { name, email, profileImage, learningGoal } = req.body;
        
        // Validation
        if (email && !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const currentId = req.user.id;
        
        // Construct update object
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (profileImage !== undefined) updateData.profileImage = profileImage;
        if (learningGoal !== undefined) updateData.learningGoal = learningGoal;

        const updatedUser = await storage.updateUser(currentId, updateData);
        if (!updatedUser) {
            return res.status(500).json({ error: 'Failed to update user' });
        }

        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
