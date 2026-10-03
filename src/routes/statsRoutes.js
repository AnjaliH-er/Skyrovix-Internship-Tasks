const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/stats', statsController.getDashboardStats);
router.get('/categories', statsController.getCategories);
router.get('/export/:type', statsController.exportData);
router.post('/seed/reset', statsController.resetDatabase);

module.exports = router;
