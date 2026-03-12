require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  // Clear existing users
  await User.deleteMany({});
  console.log('🗑️  Cleared existing users');

  // Create one by one so pre-save hook hashes passwords
  await User.create({
    name: 'Dr. Admin',
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
    department: 'Administration',
  });

  await User.create({
    name: 'Prof. Reporter',
    email: 'reporter@college.edu',
    password: 'reporter123',
    role: 'reporter',
    department: 'Computer Science',
  });

  await User.create({
    name: 'John Student',
    rollNo: 'CS2024001',
    password: 'student123',
    role: 'student',
    department: 'Computer Science',
  });

  await User.create({
    name: 'Jane Doe',
    rollNo: 'CS2024002',
    password: 'student123',
    role: 'student',
    department: 'Computer Science',
  });

  console.log('✅ Seed users created:');
  console.log('');
  console.log('  🛡️  Admin    → admin@college.edu       / admin123');
  console.log('  📋 Reporter → reporter@college.edu    / reporter123');
  console.log('  🎓 Student  → Roll: CS2024001         / student123');
  console.log('  🎓 Student  → Roll: CS2024002         / student123');
  console.log('');

  mongoose.disconnect();
};

seed().catch(console.error);