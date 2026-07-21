const createUserController = require('@/controllers/middlewaresControllers/createUserController');
const create = require('./create');
const list = require('./list');
const update = require('./update');
const remove = require('./remove');
const permissionsMeta = require('./permissionsMeta');
const search = require('./search');

const controller = createUserController('Admin');
controller.create = create;
controller.list = list;
controller.update = update;
controller.delete = remove;
controller.permissionsMeta = permissionsMeta;
controller.search = search;

module.exports = controller;
