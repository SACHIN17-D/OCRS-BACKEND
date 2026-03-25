const express = require('express');
const router = express.Router();
const { uploadEvidence } = require('../controllers/evidence.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { upload } = require('../config/cloudinary');

router.post('/:reportId', protect, allowRoles('student', 'reporter'), upload.single('image'), uploadEvidence);

module.exports = router;