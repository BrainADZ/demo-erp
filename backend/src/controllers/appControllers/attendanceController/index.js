const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('Attendance');

methods.create = require('./create');
methods.update = require('./update');
methods.list = require('./list');

module.exports = methods;
