const express = require('express');

module.exports = (database) => {
    const router = express.Router();

    // Middleware to check for Admin "Authentication" (Simplified for this request)
    const isAdmin = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // Accept if it's the special Admin Code (in a real app, this would be a signed JWT)
        if (token === 'ADMIN-8821') {
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
            const result = await database.getLeaderboard(parseInt(limit));

            res.json({
                success: true,
                data: result.leaderboard || result
            });
        } catch (error) {
            console.error('Leaderboard Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // GET /api/v1/admin/teams
    router.get('/teams', async (req, res) => {
        try {
            const teams = await database.getTeams();

            res.json({
                success: true,
                data: teams
            });
        } catch (error) {
            console.error('Teams Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // POST /api/v1/admin/broadcast
    router.post('/broadcast', async (req, res) => {
        try {
            const { message } = req.body;
            
            res.json({
                success: true,
                message: 'Broadcast sent'
            });
        } catch (error) {
            console.error('Broadcast Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // POST /api/v1/admin/threat
    router.post('/threat', async (req, res) => {
        try {
            const { level } = req.body;
            
            res.json({
                success: true,
                level: level
            });
        } catch (error) {
            console.error('Threat Level Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // POST /api/v1/admin/reset
    router.post('/reset', async (req, res) => {
        try {
            res.json({
                success: true,
                message: 'System reset'
            });
        } catch (error) {
            console.error('Reset Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // POST /api/v1/admin/team/kick
    router.post('/team/kick', async (req, res) => {
        try {
            const { teamName } = req.body;
            
            res.json({
                success: true,
                message: `Team ${teamName} kicked`
            });
        } catch (error) {
            console.error('Kick Team Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // POST /api/v1/admin/team/reset
    router.post('/team/reset', async (req, res) => {
        try {
            const { teamName } = req.body;
            
            res.json({
                success: true,
                message: `Team ${teamName} reset`
            });
        } catch (error) {
            console.error('Reset Team Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    return router;
};
