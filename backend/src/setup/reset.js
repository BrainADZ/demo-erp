require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE);

async function deleteData() {
  const Admin = require('../models/coreModels/Admin');
  const AdminPassword = require('../models/coreModels/AdminPassword');
  const Setting = require('../models/coreModels/Setting');
  const Client = require('../models/appModels/Client');
  const Enquiry = require('../models/appModels/Enquiry');
  const Invoice = require('../models/appModels/Invoice');
  const Payment = require('../models/appModels/Payment');
  const PaymentMode = require('../models/appModels/PaymentMode');
  const Quote = require('../models/appModels/Quote');
  const Taxes = require('../models/appModels/Taxes');
  const Attendance = require('../models/appModels/Attendance');

  await Promise.all([
    Admin.deleteMany(),
    AdminPassword.deleteMany(),
    Setting.deleteMany(),
    Client.deleteMany(),
    Enquiry.deleteMany(),
    Invoice.deleteMany(),
    Payment.deleteMany(),
    PaymentMode.deleteMany(),
    Quote.deleteMany(),
    Taxes.deleteMany(),
    Attendance.deleteMany(),
  ]);

  console.log('Database reset complete. Run npm run setup or npm run seed:demo to add data again.');
  process.exit();
}

deleteData();
