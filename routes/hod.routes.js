const express = require('express');
const router = express.Router();
const { getHodReports, confirmMeeting, verifyReport } = require('../controllers/hod.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.get('/reports',              protect, allowRoles('hod'), getHodReports);
router.put('/confirm/:reportId',    protect, allowRoles('hod'), confirmMeeting);
router.put('/verify/:reportId',     protect, allowRoles('hod'), verifyReport);

module.exports = router;