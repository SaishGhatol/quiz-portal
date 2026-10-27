const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/org.controller');
const { authenticateJWT, isOrgAdmin } = require('../middleware/auth.middleware');
const { objectIdParam } = require('../middleware/objectId.middleware');

router.use(authenticateJWT);

// Malformed ids answer 400 instead of reaching Mongoose
router.param('id',        objectIdParam);
router.param('studentId', objectIdParam);

// ── Organisation ──────────────────────────────────────────────────────────
router.post  ('/create',            ctrl.createOrg);
router.post  ('/setup',             ctrl.createOrg);   // alias used by the frontend
router.get   ('/me',                ctrl.getMyOrg);
router.put   ('/me',                isOrgAdmin, ctrl.updateOrg);
router.post  ('/join',              ctrl.joinOrg);
router.post  ('/invite/regenerate', isOrgAdmin, ctrl.regenerateInviteCode);

// ── Batches ───────────────────────────────────────────────────────────────
router.get   ('/batches',                    ctrl.getBatches);
router.post  ('/batches',                    isOrgAdmin, ctrl.createBatch);
router.get   ('/batches/:id',                ctrl.getBatchById);
router.put   ('/batches/:id',                isOrgAdmin, ctrl.updateBatch);
router.delete('/batches/:id',                isOrgAdmin, ctrl.deleteBatch);
router.post  ('/batches/:id/students',       isOrgAdmin, ctrl.addStudentToBatch);
router.delete('/batches/:id/students/:studentId', isOrgAdmin, ctrl.removeStudentFromBatch);

// ── Students ──────────────────────────────────────────────────────────────
router.get   ('/students',              isOrgAdmin, ctrl.getOrgStudents);
router.delete('/students/:studentId',   isOrgAdmin, ctrl.removeStudentFromOrg);

// ── Assignments ───────────────────────────────────────────────────────────
router.get   ('/assignments',      ctrl.getAssignments);          // org admins see all; students see own
router.post  ('/assignments',      isOrgAdmin, ctrl.createAssignment);
router.put   ('/assignments/:id',  isOrgAdmin, ctrl.updateAssignment);
router.delete('/assignments/:id',  isOrgAdmin, ctrl.deleteAssignment);
router.get   ('/my-assignments',   ctrl.getMyAssignments);

// ── Announcements ─────────────────────────────────────────────────────────
router.get   ('/announcements',    ctrl.getAnnouncements);
router.post  ('/announcements',    isOrgAdmin, ctrl.createAnnouncement);
router.delete('/announcements/:id',isOrgAdmin, ctrl.deleteAnnouncement);

// ── Analytics ─────────────────────────────────────────────────────────────
router.get   ('/analytics', isOrgAdmin, ctrl.getOrgAnalytics);

module.exports = router;
