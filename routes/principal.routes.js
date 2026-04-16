const express = require('express');
const router = express.Router();
const { getPrincipalReports, confirmMeeting } = require('../controllers/principal.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.get('/reports',              protect, allowRoles('principal'), getPrincipalReports);
router.put('/confirm/:reportId',    protect, allowRoles('principal'), confirmMeeting);

module.exports = router;