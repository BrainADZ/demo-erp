const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();
const hasPermission = require('@/middlewares/authorization/hasPermission');

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');

const routerApp = (entity, controller) => {
  const permissionBase = {
    client: 'clients',
    enquiry: 'enquiries',
    quote: 'quotes',
    invoice: 'invoices',
    payment: 'payments',
    attendance: 'attendances',
    taxes: 'taxes',
    paymentmode: 'payment_modes',
  }[entity];

  router.route(`/${entity}/create`).post(hasPermission(`${permissionBase}.create`), catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(hasPermission(`${permissionBase}.read`), catchErrors(controller['read']));
  router.route(`/${entity}/update/:id`).patch(hasPermission(`${permissionBase}.update`), catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(hasPermission(`${permissionBase}.delete`), catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(hasPermission(`${permissionBase}.search`), catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(hasPermission(`${permissionBase}.list`), catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(hasPermission(`${permissionBase}.list`), catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(hasPermission(`${permissionBase}.filter`), catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(hasPermission(`${permissionBase}.summary`), catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(hasPermission(`${permissionBase}.mail`), catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(hasPermission(`${permissionBase}.convert`), catchErrors(controller['convert']));
  }

  if (entity === 'enquiry' && controller['addRemark']) {
    router
      .route(`/${entity}/remark/:id`)
      .post(hasPermission(`${permissionBase}.update`), catchErrors(controller['addRemark']));
  }
};

routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

module.exports = router;
