const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/batch.controller');
const { authenticateJWT, isOrgAdmin } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

// Student: join via code
router.post('/join', ctrl.joinBatch);

// Org admin
router.get('/',    isOrgAdmin, ctrl.getBatches);
router.post('/',   isOrgAdmin, ctrl.createBatch);
router.get('/:id', isOrgAdmin, ctrl.getBatchById);
router.put('/:id', isOrgAdmin, ctrl.updateBatch);
router.delete('/:id', isOrgAdmin, ctrl.deleteBatch);

router.post('/:id/students',             isOrgAdmin, ctrl.addStudents);
router.delete('/:id/students/:userId',   isOrgAdmin, ctrl.removeStudent);
router.get('/:id/analytics',             isOrgAdmin, ctrl.getBatchAnalytics);

module.exports = router;
