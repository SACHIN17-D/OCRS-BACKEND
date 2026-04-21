require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');
};

const seedUsers = async () => {
  await connectDB();

  const users = [
    {
      name: 'Dr. HOD CSE',
      email: 'hod.cse@ocrs.edu',
      password: 'password123',
      role: 'hod',
      department: 'CSE',
      isActive: true,
    },
    {
      name: 'Principal',
      email: 'principal@ocrs.edu',
      password: 'principal123',
      role: 'principal',
      department: 'Administration',
    },
  ];

  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      await User.create(u);
      console.log(`Created: ${u.name}`);
    } else {
      console.log(`Already exists: ${u.name}`);
    }
  }

  mongoose.disconnect();
  console.log('Done!');
};

seedUsers();