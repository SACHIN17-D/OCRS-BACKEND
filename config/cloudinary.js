<<<<<<< HEAD
const cloudinary = require('cloudinary').v2;
=======
const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
>>>>>>> 9affd6a801ddc6b85b6342d18b02c2e7c8db21db
const multer = require('multer');

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

<<<<<<< HEAD
const upload = multer({ storage: multer.memoryStorage() });

module.exports = { cloudinary, upload };
=======
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'campusguard/evidence',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { cloudinary: cloudinary.v2, upload };
>>>>>>> 9affd6a801ddc6b85b6342d18b02c2e7c8db21db
