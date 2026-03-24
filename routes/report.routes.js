const express = require('express');
const router = express.Router();

const { 
  createReport,
  getAllReports,
  getMyReports,
  appealReport,
  getReporterReports,
  lookupStudent
} = require('../controllers/report.controller');

const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.post('/', protect, allowRoles('reporter'), createReport);

router.get('/', protect, allowRoles('admin'), getAllReports);

router.get('/mine/reporter', protect, allowRoles('reporter'), getReporterReports);

router.get('/mine', protect, allowRoles('student'), getMyReports);

router.post('/appeal/:reportId', protect, allowRoles('student'), appealReport);

router.get('/student/:rollNo', protect, allowRoles('reporter'), lookupStudent);

module.exports = router;