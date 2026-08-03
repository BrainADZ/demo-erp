const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const provisionDemoUser = require('@/controllers/coreControllers/demoProvisionController');

router.route('/login').post(catchErrors(adminAuth.login));

router.route('/demo/provision').post(catchErrors(provisionDemoUser));

router.route('/forgetpassword').post(catchErrors(adminAuth.forgetPassword));
router.route('/resetpassword').post(catchErrors(adminAuth.resetPassword));

router.route('/logout').post(adminAuth.isValidAuthToken, catchErrors(adminAuth.logout));

module.exports = router;
