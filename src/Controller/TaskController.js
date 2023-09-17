/**
 * Path: /src/Controller/TaskController.js
 * Author: Shahin
 * Date Create: 06-Dec-2022
 * Purpose of this component: Back end for task
 */
import DbClient from '../Database/DbClient.js';
import { parseJwt } from '../Misc/TokenParser.js';
import { checkIsUUID, cleanString } from '../Misc/InputParser.js';
import UserItemController from './UserItemController.js';

const TaskController = class {
  constructor() {
    this.dbClient = new DbClient();
  }

  createTask = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const taskName = cleanString(request.body.name);
    const taskDesc = cleanString(request.body.description);
    const itemID = request.body.item;

    if (!checkIsUUID(itemID)) {
      response.json({ error: 'Task was not able to be added.' });
      return;
    }

    try {
      const item = await this.dbClient.getItemById(itemID);

      if (!item || item.rowCount === 0) {
        throw new Error();
      }

      const hasAccess = await UserItemController.userHasAccessToItem(itemID, token);
      if (!hasAccess) throw 'no access';

      await this.dbClient.createTaskByUUID(taskName, taskDesc, itemID);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    response.json({ msg: 'Success!' });
  };

  getAllTasksForItem = async (request, response) => {
    const token = parseJwt(request.header('authorization'));

    const itemId = request.params.item_id;
    const userItemId = request.params.user_item_id;
    const userItemIdIsDefined = !(userItemId === '') && !(userItemId === 'undefined');

    if (!checkIsUUID(itemId) || (userItemIdIsDefined ? !checkIsUUID(userItemId) : false)) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    try {
      const item = await this.dbClient.getItemById(itemId);

      if (!item || item.rowCount === 0) throw new Error('Item not found');
      const owner = item.rows[0].owner;
      if (owner && owner !== token.sub) throw new Error('Unauthorized access');
    } catch (e) {
      console.error(e);
      response.json({ error: 'Something went wrong!' });
      return false;
    }

    let results;
    try {
      userItemIdIsDefined
        ? (results = await this.dbClient.getTasksByUserUUID(userItemId, itemId))
        : (results = await this.dbClient.getTasksByUUID(itemId));
    } catch (e) {
      console.error(e);
      response.json({ error: 'Something went wrong!' });
      return;
    }

    if (!results || results.rowCount === 0) {
      response.json([]);
      return;
    }

    response.json(results.rows);
  };

  completeTask = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const itemId = request.body.item_id;
    const taskId = request.body.task_id;
    const userItemId = request.body.user_item_id;

    if (!checkIsUUID(itemId, taskId, userItemId)) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    try {
      const hasAccess = token.realm_access.roles.includes('user');
      if (!hasAccess) throw 'no access';
      await this.dbClient.completeTask(userItemId, taskId);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      console.error(e);
      return;
    }

    response.json({ msg: 'Success!' });
  };

  updateTask = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const userUUID = token.sub;
    const itemID = request.params.item_id;

    const taskName = cleanString(request.body.name);
    const taskDesc = cleanString(request.body.description);
    const taskID = cleanString(request.body.task_id);

    if (!checkIsUUID(itemID)) {
      response.json({ error: 'Task was not able to be updated.' });
      return;
    }

    try {
      const item = await this.dbClient.getItemById(itemID);
      const task = await this.dbClient.getTaskByUUID(itemID, taskID);

      // check if task exists
      if (!task || task.rowCount === 0) {
        throw new Error();
      }

      // if the current user is not the owner return
      // if owner is null and user is not admin also return
      const owner = item.rows[0].owner;
      if (
        (owner && owner !== userUUID) ||
        (!owner && !token.realm_access.roles.includes('admin'))
      ) {
        throw new Error();
      }
      const results = await this.dbClient.updateTaskByUUID(taskName, taskDesc, itemID, taskID);

      if (!results || results.rowCount === 0) {
        response.json({ error: 'Task was not able to be added.' });
        return;
      }

      response.json(results.rows);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }
  };

  deleteTask = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const itemID = request.body.item_id;
    const taskID = request.body.task_id;

    // Check input
    if (!checkIsUUID(itemID, taskID)) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    try {
      const hasAccess = await UserItemController.userHasAccessToItem(itemID, token);
      if (!hasAccess) throw 'no access';
      await this.dbClient.deleteTaskByUUID(taskID);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    response.json({ msg: 'task was deleted' });
  };
};

export default TaskController;
