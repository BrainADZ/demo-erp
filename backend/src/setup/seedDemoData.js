require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const seedDemoData = require('./demoData');

const run = async () => {
  try {
    await mongoose.connect(process.env.DATABASE);
    const summary = await seedDemoData();

    console.log('Demo data seeded successfully:');
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.log('Demo data seed failed.');
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

run();
