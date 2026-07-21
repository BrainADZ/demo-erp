const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const controller = createCRUDController('Enquiry');

controller.addRemark = require('./addRemark');

module.exports = controller;
