const express = require('express');

module.exports = (database) => {
    const router = express.Router();

    // Middleware to check for Admin "Authentication" (Simplified for this request)
    const isAdmin = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // Accept if it's the special Admin Code (in a real app, this would be a signed JWT)
        if (token === 'NEXUS-MASTER-ADMIN-8821') {
            return next();
        }

        return res.status(403).json({
            success: false,
            error: 'ACCESS_DENIED',
            message: 'Admin privileges required'
        });
    };

    router.use(isAdmin);

    // GET /api/v1/admin/activity
    router.get('/activity', async (req, res) => {
        try {
            const { limit = 50 } = req.query;
            const activity = await database.getActivityFeed(parseInt(limit));

            res.json({
                success: true,
                data: activity
            });

        } catch (error) {
            console.error('Admin Activity Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // GET /api/v1/admin/leaderboard
    router.get('/leaderboard', async (req, res) => {
        try {
            const { limit = 100 } = req.query;
            // Assuming getLeaderboard returns { leaderboard: [...] } structure from database.js
            const result = await database.getLeaderboard(parseInt(limit));

            res.json({
                success: true,
                data: result.leaderboard || result // Handle both formats just in case
            });
        } catch (error) {
            console.error('Leaderboard Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    return router;
};
