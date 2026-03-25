const express = require('express');
const router = express.Router();
const {
  verifyReport,
  getStudents,
  getWarnings,
  getAllUsers,
  addUser,
  editUser,
  toggleUserStatus,
  resetWarning,
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.put('/verify/:reportId',     protect, allowRoles('admin'), verifyReport);
router.get('/users',                protect, allowRoles('admin'), getStudents);
router.get('/warnings',             protect, allowRoles('admin'), getWarnings);
router.get('/all-users',            protect, allowRoles('admin'), getAllUsers);
router.post('/add-user',            protect, allowRoles('admin'), addUser);
router.put('/edit-user/:userId',    protect, allowRoles('admin'), editUser);
router.put('/toggle-user/:userId',  protect, allowRoles('admin'), toggleUserStatus);
router.put('/reset-warning/:userId',protect, allowRoles('admin'), resetWarning);

module.exports = router;