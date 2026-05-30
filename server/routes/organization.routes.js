const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/organization.controller');
const { authenticateJWT, isAdmin, isOrgAdmin } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

// Any authenticated user can create an org (they become org_admin)
router.post('/',     ctrl.createOrg);

// Org admin routes
router.get('/mine',  ctrl.getMyOrg);
router.put('/mine',  isOrgAdmin, ctrl.updateOrg);
router.get('/mine/stats', isOrgAdmin, ctrl.getOrgStats);
router.post('/mine/admins', isOrgAdmin, ctrl.addAdminUser);

// Platform admin only
router.get('/', isAdmin, ctrl.getAllOrgs);

module.exports = router;
