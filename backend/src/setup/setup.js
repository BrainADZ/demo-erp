require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const { globSync } = require('glob');
const { generate: uniqueId } = require('shortid');
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE);

const generateEmployeeId = require('../access/generateEmployeeId');
const seedDemoData = require('./demoData');

async function setupApp() {
  try {
    const Admin = require('../models/coreModels/Admin');
    const AdminPassword = require('../models/coreModels/AdminPassword');
    const Setting = require('../models/coreModels/Setting');
    const PaymentMode = require('../models/appModels/PaymentMode');
    const Taxes = require('../models/appModels/Taxes');
    const newAdminPassword = new AdminPassword();

    const salt = uniqueId();
    const passwordHash = newAdminPassword.generateHash(salt, 'admin123');

    const demoAdmin = {
      email: 'admin@admin.com',
      employeeId: await generateEmployeeId(),
      name: 'IDURAR',
      surname: 'Admin',
      enabled: true,
      department: 'management',
      jobTitle: 'Owner',
      role: 'owner',
    };
    const result = await new Admin(demoAdmin).save();

    const AdminPasswordData = {
      password: passwordHash,
      emailVerified: true,
      salt,
      user: result._id,
    };
    await new AdminPassword(AdminPasswordData).save();

    console.log('Admin created: Done!');

    const settingFiles = [];
    const settingsFiles = globSync('./src/setup/defaultSettings/**/*.json');

    for (const filePath of settingsFiles) {
      const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      settingFiles.push(...file);
    }

    await Setting.insertMany(settingFiles);
    console.log('Settings created: Done!');

    await Taxes.insertMany([{ taxName: 'Tax 0%', taxValue: '0', isDefault: true }]);
    console.log('Taxes created: Done!');

    await PaymentMode.insertMany([
      {
        name: 'Default Payment',
        description: 'Default Payment Mode (Cash , Wire Transfer)',
        isDefault: true,
      },
    ]);
    console.log('PaymentMode created: Done!');

    const demoSummary = await seedDemoData({ ownerId: result._id });
    console.log('Demo data created: Done!');
    console.log(demoSummary);

    console.log('Setup completed: Success!');
    process.exit();
  } catch (e) {
    console.log('\nError! The Error info is below');
    console.log(e);
    process.exit();
  }
}

setupApp();
