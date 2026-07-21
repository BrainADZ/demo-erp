const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();

const adminController = require('@/controllers/coreControllers/adminController');
const attendanceSelfController = require('@/controllers/coreControllers/attendanceSelfController');
const settingController = require('@/controllers/coreControllers/settingController');
const hasPermission = require('@/middlewares/authorization/hasPermission');

const { singleStorageUpload } = require('@/middlewares/uploadMiddleware');

// //_______________________________ Admin management_______________________________

router.route('/admin/list').get(hasPermission('employees.list'), catchErrors(adminController.list));
router
  .route('/admin/permissions/meta')
  .get(hasPermission('employees.permissions'), catchErrors(adminController.permissionsMeta));
router.route('/admin/create').post(hasPermission('employees.create'), catchErrors(adminController.create));
router.route('/admin/search').get(hasPermission('employees.read'), catchErrors(adminController.search));
router.route('/admin/read/:id').get(hasPermission('employees.read'), catchErrors(adminController.read));
router.route('/admin/update/:id').patch(hasPermission('employees.update'), catchErrors(adminController.update));
router.route('/admin/delete/:id').delete(hasPermission('employees.delete'), catchErrors(adminController.delete));

router.route('/admin/password-update/:id').patch(hasPermission('employees.update'), catchErrors(adminController.updatePassword));

//_______________________________ Admin Profile _______________________________

router.route('/admin/profile/password').patch(hasPermission('profile.password'), catchErrors(adminController.updateProfilePassword));
router
  .route('/admin/profile/update')
  .patch(
    hasPermission('profile.update'),
    singleStorageUpload({ entity: 'admin', fieldName: 'photo', fileType: 'image' }),
    catchErrors(adminController.updateProfile)
  );

router.route('/attendance/my/today').get(hasPermission('profile.read'), catchErrors(attendanceSelfController.today));
router.route('/attendance/my/check-in').post(hasPermission('profile.update'), catchErrors(attendanceSelfController.checkIn));
router.route('/attendance/my/check-out').post(hasPermission('profile.update'), catchErrors(attendanceSelfController.checkOut));

// //____________________________________________ API for Global Setting _________________

router.route('/setting/create').post(hasPermission('settings.update'), catchErrors(settingController.create));
router.route('/setting/read/:id').get(catchErrors(settingController.read));
router.route('/setting/update/:id').patch(hasPermission('settings.update'), catchErrors(settingController.update));
//router.route('/setting/delete/:id).delete(catchErrors(settingController.delete));
router.route('/setting/search').get(catchErrors(settingController.search));
router.route('/setting/list').get(hasPermission('settings.view'), catchErrors(settingController.list));
router.route('/setting/listAll').get(catchErrors(settingController.listAll));
router.route('/setting/filter').get(catchErrors(settingController.filter));
router
  .route('/setting/readBySettingKey/:settingKey')
  .get(catchErrors(settingController.readBySettingKey));
router.route('/setting/listBySettingKey').get(catchErrors(settingController.listBySettingKey));
router
  .route('/setting/updateBySettingKey/:settingKey')
  .patch(hasPermission('settings.update'), catchErrors(settingController.updateBySettingKey));
router
  .route('/setting/upload/:settingKey')
  .patch(
    hasPermission('settings.upload'),
    singleStorageUpload({ entity: 'setting', fieldName: 'settingValue', fileType: 'image' }),
    catchErrors(settingController.updateBySettingKey)
  );
router.route('/setting/updateManySetting').patch(hasPermission('settings.update'), catchErrors(settingController.updateManySetting));

module.exports = router;
