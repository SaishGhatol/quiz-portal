const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/assignment.controller');
const { authenticateJWT, isOrgAdmin } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

// Student: get their assignments
router.get('/my', ctrl.getMyAssignments);

// Org admin
router.get('/',    isOrgAdmin, ctrl.getAssignments);
router.post('/',   isOrgAdmin, ctrl.createAssignment);
router.put('/:id', isOrgAdmin, ctrl.updateAssignment);
router.delete('/:id', isOrgAdmin, ctrl.deleteAssignment);
router.get('/:id/results', isOrgAdmin, ctrl.getAssignmentResults);

module.exports = router;
