import dotenv from 'dotenv';
const mongoose = require('mongoose');
const Organization = require('./dist/models/Organization').default;
const User = require('./dist/models/User').default;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-events');
    
    // Create default organization
    const defaultOrg = new Organization({
      name: 'Default Organization',
      description: 'Default organization for campus events',
      contactEmail: 'admin@campus.edu',
      isActive: true,
      createdBy: new mongoose.Types.ObjectId()
    });
    
    await defaultOrg.save();
    console.log('Default organization created:', defaultOrg.name);
    
    // Create admin user
    const adminUser = new User({
      email: 'admin@campus.edu',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isApproved: true
    });
    
    await adminUser.save();
    console.log('Admin user created:', adminUser.email);
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
