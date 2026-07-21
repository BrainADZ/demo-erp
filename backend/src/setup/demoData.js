require('module-alias/register');

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const shortid = require('shortid');

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

const DEMO_PASSWORD = 'demo123';

const dateAt = (date, hours = 9, minutes = 0) => {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
};

const daysFromNow = (days, hours = 10, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateAt(date, hours, minutes);
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const upsertOne = async (Model, filter, data) =>
  Model.findOneAndUpdate(
    filter,
    {
      $set: data,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  ).exec();

const ensurePassword = async (admin, password = DEMO_PASSWORD) => {
  const existingPassword = await AdminPassword.findOne({ user: admin._id }).exec();
  if (existingPassword) return existingPassword;

  const salt = shortid.generate();
  const passwordHash = new AdminPassword().generateHash(salt, password);

  return new AdminPassword({
    user: admin._id,
    password: passwordHash,
    salt,
    emailVerified: true,
  }).save();
};

const ensureAdmin = async (payload, password = DEMO_PASSWORD) => {
  const admin = await upsertOne(
    Admin,
    { email: payload.email.toLowerCase() },
    {
      removed: false,
      enabled: true,
      permissionMode: 'role',
      permissions: [],
      permissionModules: [],
      ...payload,
      email: payload.email.toLowerCase(),
    }
  );

  await ensurePassword(admin, password);
  return admin;
};

const ensureDefaultSettings = async () => {
  const settingOverrides = {
    idurar_app_country: 'IN',
    idurar_app_timezone: 'Asia/Kolkata',
    idurar_app_email: 'hello@brainadz.example',
    idurar_app_company_email: 'accounts@brainadz.example',
    company_name: 'Brainadz Demo Pvt Ltd',
    company_address: '402 Orion Business Park, Andheri East',
    company_state: 'Maharashtra',
    company_country: 'India',
    company_email: 'accounts@brainadz.example',
    company_phone: '+91 98765 43210',
    company_website: 'www.brainadz-demo.com',
    company_tax_number: '27ABCDE1234F1Z5',
    company_vat_number: '27ABCDE1234F1Z5',
    company_reg_number: 'U72900MH2026PTC123456',
    company_bank_account: 'HDFC Bank | AC 50200012345678 | IFSC HDFC0001234',
    default_currency_code: 'INR',
    currency_name: 'Indian Rupee',
    currency_symbol: 'Rs',
    currency_position: 'before',
    last_invoice_number: 6,
    last_quote_number: 5,
    last_payment_number: 3,
  };

  const settingsPath = path.join(__dirname, 'defaultSettings', '**', '*.json').replace(/\\/g, '/');
  const settingFiles = globSync(settingsPath);
  const settings = [];

  for (const filePath of settingFiles) {
    const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    settings.push(...file);
  }

  for (const setting of settings) {
    const data = {
      ...setting,
      removed: false,
      enabled: true,
      settingValue:
        Object.prototype.hasOwnProperty.call(settingOverrides, setting.settingKey)
          ? settingOverrides[setting.settingKey]
          : setting.settingValue,
    };

    const existing = await Setting.findOne({
      settingCategory: data.settingCategory,
      settingKey: data.settingKey,
    }).exec();

    if (existing) {
      await Setting.updateOne(
        { _id: existing._id },
        {
          $set: {
            settingValue: data.settingValue,
            valueType: data.valueType,
            removed: false,
            enabled: true,
          },
        }
      ).exec();
    } else {
      await new Setting(data).save();
    }
  }
};

const lineItem = (itemName, description, quantity, price) => ({
  itemName,
  description,
  quantity,
  price,
  total: quantity * price,
});

const totalsFor = (items, taxRate = 18) => {
  const subTotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxTotal = Math.round(subTotal * taxRate) / 100;
  const total = subTotal + taxTotal;

  return {
    subTotal,
    taxTotal,
    total,
  };
};

const ensureCommercialDocument = async (Model, filter, payload) => {
  const totals = totalsFor(payload.items, payload.taxRate);

  return upsertOne(Model, filter, {
    ...payload,
    ...totals,
    removed: false,
    currency: 'INR',
  });
};

const buildAttendance = ({ employee, createdBy, date, status, workMode, checkIn, checkOut, notes }) => {
  const isClosed = Boolean(checkOut) || ['absent', 'leave'].includes(status);
  const employeeName = [employee.name, employee.surname].filter(Boolean).join(' ').trim();
  const loginCapturedAt = checkIn ? dateAt(date, Number(checkIn.split(':')[0]), Number(checkIn.split(':')[1])) : null;
  const logoutCapturedAt = checkOut ? dateAt(date, Number(checkOut.split(':')[0]), Number(checkOut.split(':')[1])) : null;
  const loginSource = workMode === 'remote' ? 'remote' : workMode ? 'office' : 'unknown';

  return {
    removed: false,
    enabled: true,
    employee: employee._id,
    employeeIdSnapshot: employee.employeeId,
    employeeName,
    attendanceDate: startOfDay(date),
    status,
    workMode: ['absent', 'leave'].includes(status) ? null : workMode,
    checkIn: checkIn || '',
    checkOut: checkOut || '',
    checkOutCapturedAt: logoutCapturedAt,
    checkOutMethod: checkOut ? 'manual' : 'unknown',
    sessionStatus: isClosed ? 'closed' : 'active',
    autoMarked: status === 'absent',
    loginCapturedAt,
    loginIp: loginSource === 'remote' ? '103.74.18.42' : '192.168.1.24',
    loginSource,
    loginBrowser: 'Chrome',
    loginOs: 'Windows',
    loginDevice: 'Desktop',
    loginUserAgent: 'Mozilla/5.0 Demo Browser',
    loginTimezone: 'Asia/Kolkata',
    loginLanguage: 'en-IN',
    loginScreen: '1440x900',
    loginNetwork: loginSource === 'remote' ? 'Home WiFi' : 'Office LAN',
    loginEvents: loginCapturedAt
      ? [
          {
            loginAt: loginCapturedAt,
            ip: loginSource === 'remote' ? '103.74.18.42' : '192.168.1.24',
            source: loginSource,
            browser: 'Chrome',
            os: 'Windows',
            device: 'Desktop',
            userAgent: 'Mozilla/5.0 Demo Browser',
            timezone: 'Asia/Kolkata',
            language: 'en-IN',
            screen: '1440x900',
            network: loginSource === 'remote' ? 'Home WiFi' : 'Office LAN',
          },
        ]
      : [],
    logoutEvents: logoutCapturedAt
      ? [
          {
            logoutAt: logoutCapturedAt,
            ip: loginSource === 'remote' ? '103.74.18.42' : '192.168.1.24',
            source: loginSource,
            browser: 'Chrome',
            os: 'Windows',
            device: 'Desktop',
            userAgent: 'Mozilla/5.0 Demo Browser',
            timezone: 'Asia/Kolkata',
            language: 'en-IN',
            screen: '1440x900',
            network: loginSource === 'remote' ? 'Home WiFi' : 'Office LAN',
            reason: 'End of work day',
            method: 'manual',
          },
        ]
      : [],
    notes,
    createdBy: createdBy._id,
    created: startOfDay(date),
    updated: new Date(),
  };
};

const seedDemoData = async ({ ownerId } = {}) => {
  await ensureDefaultSettings();

  let owner = ownerId ? await Admin.findById(ownerId).exec() : null;
  if (!owner) {
    owner =
      (await Admin.findOne({ role: 'owner', removed: false }).exec()) ||
      (await Admin.findOne({ removed: false }).exec());
  }

  if (!owner) {
    owner = await ensureAdmin(
      {
        email: 'admin@admin.com',
        employeeId: 'EMP0001',
        name: 'IDURAR',
        surname: 'Admin',
        department: 'management',
        jobTitle: 'Owner',
        role: 'owner',
      },
      'admin123'
    );
  } else {
    await ensurePassword(owner, 'admin123');
  }

  const employeeSeeds = [
    {
      email: 'aarav.sales@brainadz.example',
      employeeId: 'EMP0002',
      name: 'Aarav',
      surname: 'Mehta',
      department: 'sales',
      jobTitle: 'Sales Executive',
      role: 'sales',
    },
    {
      email: 'neha.manager@brainadz.example',
      employeeId: 'EMP0003',
      name: 'Neha',
      surname: 'Sharma',
      department: 'operations',
      jobTitle: 'Operations Manager',
      role: 'manager',
    },
    {
      email: 'kabir.finance@brainadz.example',
      employeeId: 'EMP0004',
      name: 'Kabir',
      surname: 'Khan',
      department: 'finance',
      jobTitle: 'Finance Analyst',
      role: 'finance',
    },
    {
      email: 'riya.support@brainadz.example',
      employeeId: 'EMP0005',
      name: 'Riya',
      surname: 'Patel',
      department: 'support',
      jobTitle: 'Support Specialist',
      role: 'employee',
    },
  ];

  const employees = [];
  for (const employeeSeed of employeeSeeds) {
    employees.push(await ensureAdmin(employeeSeed));
  }

  const assignees = [owner, ...employees];

  const taxSeeds = [
    { taxName: 'Tax 0%', taxValue: 0, isDefault: true, createdBy: owner._id },
    { taxName: 'GST 5%', taxValue: 5, isDefault: false, createdBy: owner._id },
    { taxName: 'GST 12%', taxValue: 12, isDefault: false, createdBy: owner._id },
    { taxName: 'GST 18%', taxValue: 18, isDefault: false, createdBy: owner._id },
  ];
  for (const tax of taxSeeds) {
    await upsertOne(Taxes, { taxName: tax.taxName }, { ...tax, removed: false, enabled: true });
  }

  const paymentModeSeeds = [
    {
      name: 'Cash',
      description: 'Cash payment collected at office',
      isDefault: false,
      createdBy: owner._id,
    },
    {
      name: 'Bank Transfer',
      description: 'NEFT, IMPS or RTGS bank transfer',
      isDefault: true,
      createdBy: owner._id,
    },
    {
      name: 'UPI',
      description: 'UPI payment through business account',
      isDefault: false,
      createdBy: owner._id,
    },
    {
      name: 'Credit Card',
      description: 'Card payment through payment gateway',
      isDefault: false,
      createdBy: owner._id,
    },
  ];
  const paymentModes = [];
  for (const paymentMode of paymentModeSeeds) {
    paymentModes.push(
      await upsertOne(
        PaymentMode,
        { name: paymentMode.name },
        { ...paymentMode, removed: false, enabled: true }
      )
    );
  }

  const clientSeeds = [
    {
      name: 'Acme Digital Services',
      phone: '+91 98111 23001',
      country: 'IN',
      address: '21 MG Road, Bengaluru, Karnataka',
      email: 'billing@acmedigital.example',
    },
    {
      name: 'GreenLeaf Retail',
      phone: '+91 98222 23002',
      country: 'IN',
      address: 'Sector 62, Noida, Uttar Pradesh',
      email: 'accounts@greenleaf.example',
    },
    {
      name: 'UrbanNest Homes',
      phone: '+91 98333 23003',
      country: 'IN',
      address: 'Bandra Kurla Complex, Mumbai, Maharashtra',
      email: 'finance@urbannest.example',
    },
    {
      name: 'Nova Foods Pvt Ltd',
      phone: '+91 98444 23004',
      country: 'IN',
      address: 'Anna Salai, Chennai, Tamil Nadu',
      email: 'purchase@novafoods.example',
    },
    {
      name: 'Skyline Logistics',
      phone: '+91 98555 23005',
      country: 'IN',
      address: 'Hinjewadi Phase 1, Pune, Maharashtra',
      email: 'ops@skyline.example',
    },
    {
      name: 'BluePeak Education',
      phone: '+91 98666 23006',
      country: 'IN',
      address: 'Salt Lake Sector V, Kolkata, West Bengal',
      email: 'admin@bluepeak.example',
    },
  ];

  const clients = [];
  for (let index = 0; index < clientSeeds.length; index += 1) {
    const client = clientSeeds[index];
    clients.push(
      await upsertOne(
        Client,
        { email: client.email },
        {
          ...client,
          removed: false,
          enabled: true,
          createdBy: owner._id,
          assigned: assignees[index % assignees.length]._id,
          created: daysFromNow(-index - 2),
          updated: new Date(),
        }
      )
    );
  }

  const enquirySeeds = [
    {
      clientName: 'PixelForge Studio',
      contact: '+91 98700 44001',
      email: 'hello@pixelforge.example',
      location: 'Delhi',
      message: 'Interested in a brand launch campaign and landing page.',
      status: 'qualified',
      source: 'Website',
      remarks: [
        {
          personName: 'Aarav Mehta',
          note: 'Discovery call done, proposal requested for Friday.',
          at: daysFromNow(-1, 15, 30),
        },
      ],
      firstName: 'Ishaan',
      lastName: 'Verma',
      company: 'PixelForge Studio',
      phone: '+91 98700 44001',
    },
    {
      clientName: 'Aster Clinics',
      contact: '+91 98700 44002',
      email: 'marketing@asterclinics.example',
      location: 'Hyderabad',
      message: 'Needs lead generation for three new clinic branches.',
      status: 'contacted',
      source: 'Referral',
      remarks: [
        {
          personName: 'Neha Sharma',
          note: 'Demo scheduled with marketing head.',
          at: daysFromNow(-2, 11, 45),
        },
      ],
      firstName: 'Meera',
      lastName: 'Nair',
      company: 'Aster Clinics',
      phone: '+91 98700 44002',
    },
    {
      clientName: 'ZenKart Commerce',
      contact: '+91 98700 44003',
      email: 'growth@zenkart.example',
      location: 'Gurugram',
      message: 'Looking for paid ads and marketplace catalog support.',
      status: 'new',
      source: 'LinkedIn',
      remarks: [],
      firstName: 'Rohan',
      lastName: 'Malhotra',
      company: 'ZenKart Commerce',
      phone: '+91 98700 44003',
    },
  ];

  for (let index = 0; index < enquirySeeds.length; index += 1) {
    const enquiry = enquirySeeds[index];
    const lastRemark = enquiry.remarks[enquiry.remarks.length - 1] || null;
    await upsertOne(
      Enquiry,
      { email: enquiry.email },
      {
        ...enquiry,
        lastRemark,
        notes: lastRemark ? lastRemark.note : 'New enquiry awaiting first contact.',
        assigned: employees[index % employees.length]._id,
        createdBy: owner._id,
        removed: false,
        enabled: true,
        createdAt: daysFromNow(-index - 1, 12, 0),
        created: daysFromNow(-index - 1, 12, 0),
        updated: new Date(),
      }
    );
  }

  const quoteSeeds = [
    {
      number: 1,
      client: clients[0]._id,
      status: 'accepted',
      date: daysFromNow(-20),
      expiredDate: daysFromNow(10),
      taxRate: 18,
      notes: 'Demo data: brand launch proposal accepted.',
      items: [
        lineItem('Brand Strategy Workshop', 'Positioning, messaging and campaign roadmap', 1, 65000),
        lineItem('Landing Page Design', 'Responsive landing page for launch campaign', 1, 85000),
      ],
    },
    {
      number: 2,
      client: clients[1]._id,
      status: 'sent',
      date: daysFromNow(-14),
      expiredDate: daysFromNow(16),
      taxRate: 18,
      notes: 'Demo data: retail performance marketing quote.',
      items: [
        lineItem('Google Ads Setup', 'Search and shopping campaign setup', 1, 45000),
        lineItem('Creative Pack', 'Static and carousel ad creatives', 2, 18000),
      ],
    },
    {
      number: 3,
      client: clients[2]._id,
      status: 'pending',
      date: daysFromNow(-8),
      expiredDate: daysFromNow(22),
      taxRate: 18,
      notes: 'Demo data: real estate lead generation quote.',
      items: [
        lineItem('Lead Funnel Audit', 'Landing page and CRM funnel audit', 1, 30000),
        lineItem('Meta Ads Management', 'Monthly media management retainer', 1, 70000),
      ],
    },
    {
      number: 4,
      client: clients[3]._id,
      status: 'draft',
      date: daysFromNow(-5),
      expiredDate: daysFromNow(25),
      taxRate: 12,
      notes: 'Demo data: food brand content retainer draft.',
      items: [
        lineItem('Monthly Social Calendar', 'Content plan and publishing schedule', 1, 42000),
        lineItem('Product Photoshoot', 'Half-day product shoot with edit pack', 1, 55000),
      ],
    },
    {
      number: 5,
      client: clients[4]._id,
      status: 'declined',
      date: daysFromNow(-35),
      expiredDate: daysFromNow(-5),
      taxRate: 18,
      notes: 'Demo data: logistics automation quote declined.',
      items: [
        lineItem('CRM Workflow Mapping', 'Sales and dispatch workflow mapping', 1, 48000),
        lineItem('Automation Setup', 'Quote and follow-up automation setup', 1, 62000),
      ],
    },
  ];

  const quotes = [];
  const currentYear = new Date().getFullYear();
  for (const quote of quoteSeeds) {
    quotes.push(
      await ensureCommercialDocument(
        Quote,
        { number: quote.number, year: currentYear },
        {
          ...quote,
          year: currentYear,
          createdBy: owner._id,
          pdf: `quote-demo-${quote.number}.pdf`,
          created: quote.date,
          updated: new Date(),
        }
      )
    );
  }

  const invoiceSeeds = [
    {
      number: 1,
      client: clients[0]._id,
      status: 'sent',
      paymentStatus: 'paid',
      date: daysFromNow(-18),
      expiredDate: daysFromNow(12),
      taxRate: 18,
      notes: 'Demo data: paid invoice for launch campaign.',
      items: [
        lineItem('Campaign Kickoff', 'Brand launch kickoff and planning', 1, 50000),
        lineItem('Creative Production', 'Ad creatives and landing page assets', 1, 95000),
      ],
    },
    {
      number: 2,
      client: clients[1]._id,
      status: 'sent',
      paymentStatus: 'unpaid',
      date: daysFromNow(-28),
      expiredDate: daysFromNow(-3),
      taxRate: 18,
      notes: 'Demo data: overdue retail ads invoice.',
      items: [
        lineItem('Performance Marketing Retainer', 'Monthly campaign management', 1, 75000),
        lineItem('Creative Refresh', 'Weekly creative iteration pack', 1, 28000),
      ],
    },
    {
      number: 3,
      client: clients[2]._id,
      status: 'pending',
      paymentStatus: 'partially',
      date: daysFromNow(-9),
      expiredDate: daysFromNow(21),
      taxRate: 18,
      notes: 'Demo data: partial payment invoice.',
      items: [
        lineItem('Lead Generation Setup', 'Meta and Google lead campaigns', 1, 90000),
        lineItem('CRM Integration', 'Lead notification and pipeline setup', 1, 35000),
      ],
    },
    {
      number: 4,
      client: clients[3]._id,
      status: 'draft',
      paymentStatus: 'unpaid',
      date: daysFromNow(-4),
      expiredDate: daysFromNow(26),
      taxRate: 12,
      notes: 'Demo data: draft content retainer invoice.',
      items: [
        lineItem('Social Content Retainer', 'Monthly strategy, posts and reels', 1, 68000),
        lineItem('Influencer Shortlist', 'Creator discovery and outreach list', 1, 22000),
      ],
    },
    {
      number: 5,
      client: clients[4]._id,
      status: 'on hold',
      paymentStatus: 'unpaid',
      date: daysFromNow(-11),
      expiredDate: daysFromNow(19),
      taxRate: 18,
      notes: 'Demo data: logistics workflow invoice on hold.',
      items: [
        lineItem('ERP Discovery Sprint', 'Operational process discovery', 1, 56000),
        lineItem('Workflow Prototype', 'Automation prototype for dispatch follow-up', 1, 64000),
      ],
    },
    {
      number: 6,
      client: clients[5]._id,
      status: 'sent',
      paymentStatus: 'unpaid',
      date: daysFromNow(-2),
      expiredDate: daysFromNow(28),
      taxRate: 18,
      notes: 'Demo data: education lead campaign invoice.',
      items: [
        lineItem('Admission Campaign Setup', 'Search and social campaign setup', 1, 82000),
        lineItem('Reporting Dashboard', 'Weekly performance report dashboard', 1, 24000),
      ],
    },
  ];

  const invoices = [];
  for (const invoice of invoiceSeeds) {
    const commercialDoc = await ensureCommercialDocument(
      Invoice,
      { number: invoice.number, year: currentYear },
      {
        ...invoice,
        year: currentYear,
        createdBy: owner._id,
        credit: 0,
        discount: 0,
        approved: true,
        pdf: `invoice-demo-${invoice.number}.pdf`,
        created: invoice.date,
        updated: new Date(),
      }
    );
    invoices.push(commercialDoc);
  }

  const bankTransferMode =
    paymentModes.find((mode) => mode.name === 'Bank Transfer') || paymentModes[0];
  const upiMode = paymentModes.find((mode) => mode.name === 'UPI') || bankTransferMode;

  const paymentSeeds = [
    {
      number: 1,
      invoice: invoices[0],
      amount: invoices[0].total,
      paymentMode: bankTransferMode._id,
      ref: 'DEMO-PAY-001',
      description: 'Full payment received for campaign kickoff invoice.',
      date: daysFromNow(-15, 14, 20),
    },
    {
      number: 2,
      invoice: invoices[2],
      amount: 65000,
      paymentMode: upiMode._id,
      ref: 'DEMO-PAY-002',
      description: 'Advance payment received for real estate lead campaign.',
      date: daysFromNow(-6, 16, 10),
    },
  ];

  const paymentsByInvoiceId = new Map();
  for (const payment of paymentSeeds) {
    const paymentDoc = await upsertOne(
      Payment,
      { ref: payment.ref },
      {
        removed: false,
        createdBy: owner._id,
        number: payment.number,
        client: payment.invoice.client,
        invoice: payment.invoice._id,
        paymentMode: payment.paymentMode,
        date: payment.date,
        amount: payment.amount,
        currency: 'INR',
        ref: payment.ref,
        description: payment.description,
        created: payment.date,
        updated: new Date(),
      }
    );

    const invoiceId = payment.invoice._id.toString();
    paymentsByInvoiceId.set(invoiceId, [...(paymentsByInvoiceId.get(invoiceId) || []), paymentDoc]);
  }

  for (const invoice of invoices) {
    const invoicePayments = paymentsByInvoiceId.get(invoice._id.toString()) || [];
    const credit = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const nextPaymentStatus =
      credit >= invoice.total ? 'paid' : credit > 0 ? 'partially' : invoice.paymentStatus;

    await Invoice.updateOne(
      { _id: invoice._id },
      {
        $set: {
          credit,
          paymentStatus: nextPaymentStatus,
          payment: invoicePayments.map((payment) => payment._id),
        },
      }
    ).exec();
  }

  const attendancePeople = [owner, ...employees];
  const attendancePattern = [
    { status: 'present', workMode: 'office', checkIn: '09:28', checkOut: '18:12' },
    { status: 'late', workMode: 'office', checkIn: '10:06', checkOut: '18:35' },
    { status: 'work_from_home', workMode: 'remote', checkIn: '09:45', checkOut: '18:05' },
    { status: 'half_day', workMode: 'hybrid', checkIn: '09:36', checkOut: '14:05' },
    { status: 'present', workMode: 'field', checkIn: '09:10', checkOut: '17:50' },
    { status: 'absent', workMode: null, checkIn: '', checkOut: '' },
    { status: 'leave', workMode: null, checkIn: '', checkOut: '' },
  ];

  for (let personIndex = 0; personIndex < attendancePeople.length; personIndex += 1) {
    const employee = attendancePeople[personIndex];

    for (let dayIndex = 0; dayIndex < attendancePattern.length; dayIndex += 1) {
      const basePattern = attendancePattern[(dayIndex + personIndex) % attendancePattern.length];
      const attendanceDate = daysFromNow(-dayIndex, 9, 0);
      const attendance = buildAttendance({
        employee,
        createdBy: owner,
        date: attendanceDate,
        ...basePattern,
        notes:
          basePattern.status === 'absent'
            ? 'Demo data: auto marked absent.'
            : `Demo data: ${basePattern.status.replace(/_/g, ' ')} day.`,
      });

      await upsertOne(
        Attendance,
        {
          employee: employee._id,
          attendanceDate: attendance.attendanceDate,
          removed: false,
        },
        attendance
      );
    }
  }

  return {
    admins: assignees.length,
    clients: clients.length,
    enquiries: enquirySeeds.length,
    quotes: quotes.length,
    invoices: invoices.length,
    payments: paymentSeeds.length,
    attendance: attendancePeople.length * attendancePattern.length,
    taxes: taxSeeds.length,
    paymentModes: paymentModeSeeds.length,
  };
};

module.exports = seedDemoData;
