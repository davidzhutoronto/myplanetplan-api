//CRUD public items
import DbClient from '../Database/DbClient.js';
import { checkIsUUID } from '../Misc/InputParser.js';
import { REPEATABLE } from '../Misc/Enums.js';
import { parseJwt } from '../Misc/TokenParser.js';

//read public items
const UserItemController = class {
  constructor() {
    this.dbClient = new DbClient();
  }

  addItemToList = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const userUUID = token.sub;
    const item_id = request.body.item_id;

    // Check input
    if (!checkIsUUID(userUUID) || !checkIsUUID(item_id)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    let results;
    try {
      results = await this.dbClient.createUserItem(userUUID, item_id);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    if (!results || results.rowCount === 0) {
      response.json({ error: 'No items found' });
      return;
    }

    response.json(results.rows);
  };

  deleteItemFromList = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const userUUID = token.sub;
    const userItemId = request.body.user_item_id;
    const itemId = request.body.item_id;

    // Check input
    if (!checkIsUUID(userUUID, userItemId)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    // Deactivate item if it is private.
    try {
      const item = await this.dbClient.getItemById(itemId);
      if (!item || !item.rowCount > 0) throw new Error();
      if (item.rows[0].owner === userUUID) {
        const deactivate = await this.dbClient.deactiveItem(itemId);
        if (!deactivate || !deactivate.rowCount > 0) throw new Error();
      }
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    try {
      await this.dbClient.deleteItemFromList(userItemId);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    response.json({ msg: 'item succesfully removed' });
  };

  /**
   * Gets items a user has added to their list. Only returns items that are able to be completed.
   * @param {*} request API call request
   * @param {*} response API response
   */
  getUserItemsByUser = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const userUUID = token.sub;

    // Check input
    if (!checkIsUUID(userUUID)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    let results;

    try {
      results = await this.dbClient.getUserItemsByUser(userUUID);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    if (!results || results.rowCount === 0) {
      response.json([]);
      return;
    }

    // Filter the result to see what is still relevant
    const res = results.rows.filter(
      (item) =>
        !item.completed || // Uncompleted items
        (item.repeatable_value === REPEATABLE.DAILY && item.day_passed) || // daily repeatable items which have a day passed
        (item.repeatable_value === REPEATABLE.WEEKLY && item.week_passed) || // weekly repeatable items which have a week passed
        (item.repeatable_value === REPEATABLE.MONTHLY && item.month_passed)
    ); // monthly repeatable items which have a month passed

    response.json(res);
  };

  getItemDetails = async (request, response) => {
    const item_id = request.params.item_id;
    const token = parseJwt(request.header('authorization'));
    const isAdmin = token.realm_access.roles.includes('admin');
    const userUUID = token.sub;

    if (!checkIsUUID(item_id, userUUID)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    let results;

    try {
      results = await this.dbClient.getItemDetails(userUUID, item_id, isAdmin);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    if (!results || results.rowCount === 0) {
      response.json([]);
      return;
    }

    response.json(results.rows);
  };

  /**
   * Gets user_item_id and completes that user_item, also adds item to user_item_history
   * @param {*} request API call request
   * @param {*} response API response
   */
  handleCompleteUserItem = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const userUUID = token.sub;
    const item_id = request.body.item_id;

    // TODO: CHECK IF NOT DOUBLE?!

    // Check input
    if (!checkIsUUID(item_id, userUUID)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    let results;
    try {
      // if there is a result, and it is more than 0, update the last completed item.
      const user_item_id = await this.getUserItemId(userUUID, item_id);
      // if successful complete the item, create new user_item_history row
      // increment user points and send updated item back.
      results = await this.handleItemComplete(userUUID, item_id, user_item_id);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    if (!results) {
      response.json({ error: 'Could not update item.' });
      return;
    }

    response.json(results.rows);
  };

  getUserItemId = async (user_id, item_id) => {
    const results = await this.dbClient.getUserItemId(user_id, item_id);
    if (!results || results.rowCount === 0) return false;
    return results.rows[results.rowCount - 1].user_item_id;
  };

  completeUserItem = async (user_item_id) => {
    const results = await this.dbClient.completeUserItem(user_item_id);
    if (!results || results.rowCount === 0) return false;
    return results.rows;
  };

  getItemPoints = async (item_id) => {
    const results = await this.dbClient.getItemPoints(item_id);
    if (!results || results.rowCount === 0) return false;
    return results.rows[0].points;
  };

  addPointsToUser = async (user_id, points) => {
    const results = await this.dbClient.addPointsToUser(user_id, points);
    if (!results || results.rowCount === 0) return false;
    return true;
  };

  createUserItemHistory = async (user_id, item_id, points) => {
    const results = await this.dbClient.createUserItemHistory(user_id, item_id, points);
    if (!results || results.rowCount === 0) return false;
    return results;
  };

  handleItemComplete = async (user_id, item_id, user_item_id) => {
    const completedItem = await this.completeUserItem(user_item_id);
    const points = await this.getItemPoints(item_id);
    const addedPoints = await this.addPointsToUser(user_id, points);
    const createdHistory = await this.createUserItemHistory(user_id, item_id, points);

    if (!completedItem || !points || !addedPoints || !createdHistory) return false;
    return createdHistory;
  };

  /**
   * Gets all completed items for a specific user.
   * @param {*} request API call request
   * @param {*} response API response
   */
  getUserItemHistory = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const userUUID = token.sub;

    // Check input
    if (!checkIsUUID(userUUID)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    let results;
    try {
      results = await this.dbClient.getUserItemHistory(userUUID);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    if (!results || results.rowCount === 0) {
      response.json([]);
      return;
    }

    response.json(results.rows);
  };

  static userHasAccessToItem = async (itemID, token) => {
    try {
      const item = await new DbClient().getItemById(itemID);

      if (!item || item.rowCount === 0) {
        throw new Error('Item not found');
      }

      const owner = item.rows[0].owner;
      if (
        (owner && owner !== token.sub) ||
        (!owner && !token.realm_access.roles.includes('admin'))
      ) {
        throw new Error('Unauthorized access');
      }
    } catch (e) {
      console.error(e);
      return false;
    }

    return true;
  };
};

export default UserItemController;
