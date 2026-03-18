const express = require('express');
const router = express.Router();
const { verifyReport, getStudents, getWarnings } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.put('/verify/:reportId', protect, allowRoles('admin'), verifyReport);
router.get('/users',            protect, allowRoles('admin'), getStudents);
router.get('/warnings',         protect, allowRoles('admin'), getWarnings);

module.exports = router;