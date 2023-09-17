//CRUD public items
import DbClient from '../Database/DbClient.js';
import UserItemController from './UserItemController.js';
import { DIFFICULTY } from '../Misc/Enums.js';
import { checkIsUUID, cleanString } from '../Misc/InputParser.js';
import { parseJwt } from '../Misc/TokenParser.js';

//read public items
const PublicItemsController = class {
  constructor() {
    this.dbClient = new DbClient();
  }

  getPublicItems = async (request, response) => {
    let results;
    const userUUID = parseJwt(request.header('authorization')).sub;

    try {
      results = await this.dbClient.getPublicItems(userUUID);
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

  calculatePoints = async (...domainIds) => {
    let points = 0;
    for (const id of domainIds) {
      const value = await this.dbClient.getDomainValueById(id);
      if (!value || value.rowCount === 0) return;
      const difficulty = String(value.rows.pop().value).toUpperCase();
      points += DIFFICULTY[difficulty].points;
    }
    return points;
  };

  //create a new public item
  createPublicItem = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const isAdmin = token.realm_access.roles.includes('admin');

    const userUUID = token.sub;
    const owner = !isAdmin ? token.sub : null;

    const cost_money = request.body.cost_money;
    const cost_effort = request.body.cost_effort;
    const cost_time = request.body.cost_time;

    const name = cleanString(request.body.name);
    const summary = cleanString(request.body.summary);
    const description = cleanString(request.body.description);
    const repeatable = cleanString(request.body.repeatable);

    // Check all variables for malicous content, return if non viable content is found.
    if (
      (owner && !checkIsUUID(owner)) ||
      !checkIsUUID(cost_money, cost_effort, cost_time, repeatable, userUUID)
    ) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    // If one of the strings is not an Enum value this returns an error
    try {
      const points = !isAdmin
        ? DIFFICULTY.ALLEASY
        : await this.calculatePoints(cost_money, cost_effort, cost_time);

      const item = {
        userUUID,
        owner,
        name,
        summary,
        description,
        cost_money,
        cost_effort,
        cost_time,
        repeatable,
        points,
      };

      const results = await this.dbClient.postItemsComplete(item);

      if (!results || results.rowCount === 0) {
        response.json({ error: 'Something went wrong!' });
        return;
      }

      // automatically add item to owner's list if it has an owner.
      if (owner) {
        const add = await this.dbClient.createUserItem(userUUID, results.rows[0].item_id);
        if (!add || add.rowCount === 0) {
          response.json({ error: 'Something went wrong!' });
          return;
        }
      }

      response.json({
        msg: `Item added with ID: ${results.rows[0].item_id}`,
        item_id: results.rows[0].item_id,
      });
    } catch (err) {
      console.error(err);
      response.json({ error: 'Something went wrong!' });
    }
  };

  // Update an item
  updateItem = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const isAdmin = token.realm_access.roles.includes('admin');

    const userUUID = token.sub;
    const item_id = request.params.item_id;

    const name = cleanString(request.body.name);
    const summary = cleanString(request.body.summary);
    const description = cleanString(request.body.description);

    const cost_money = request.body.cost_money;
    const cost_effort = request.body.cost_effort;
    const cost_time = request.body.cost_time;

    const repeatable = request.body.repeatable;

    // Check all variables for malicous content, return if non viable content is found.
    if (!checkIsUUID(item_id, cost_money, cost_effort, cost_time, repeatable, userUUID)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    // Check user is owner of item OR it is a public item

    const itemExists = await this.dbClient.getItemById(item_id);

    if (
      !itemExists ||
      itemExists.rowCount === 0 ||
      (itemExists.rows[0].owner && itemExists.rows[0].owner !== userUUID) ||
      (!itemExists.rows[0].owner && !token.realm_access.roles.includes('admin'))
    ) {
      response.json({ error: 'Cannot update item.' });
      return;
    }

    // If one of the strings is not an Enum value this returns an error
    try {
      const points = !isAdmin
        ? DIFFICULTY.ALLEASY
        : await this.calculatePoints(cost_money, cost_effort, cost_time);

      const item = {
        item_id,
        owner: itemExists.rows[0].owner,
        name,
        summary,
        description,
        cost_money,
        cost_effort,
        cost_time,
        repeatable,
        points,
      };

      // update the item you've found
      const results = await this.dbClient.updateItem(item);

      if (!results || results.rowCount === 0) {
        response.json({ error: 'Could not update item' });
        return;
      }

      response.json({ msg: `Item updated with ID: ${results.rows[0].item_id}` });
    } catch (error) {
      console.error(error);
      response.json({ error: 'Difficulty values were not viable' });
    }
  };

  // Delete an item, this does not remove the item from the DB but it does set active to false
  deleteItem = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const itemID = request.params.item_id;

    if (!checkIsUUID(itemID)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    let results;

    try {
      const hasAccess = await UserItemController.userHasAccessToItem(itemID, token);
      if (!hasAccess) throw 'no access';
      results = await this.dbClient.deleteItem(itemID);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    if (!results || results.rowCount === 0) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    response.json(results.rows);
  };
};

export default PublicItemsController;
