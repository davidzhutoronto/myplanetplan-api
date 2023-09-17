import pg from 'pg';

const Pool = pg.Pool;

const DbClient = class {
  constructor() {
    let config = {
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: process.env.POSTGRES_PORT,
    };
    this.pool = new Pool(config);
  }

  // Item Queries

  /**
   * Get items with uuid's and names of foreign key fields.
   * @returns a promise with results. Needs to be awaited to access rows.
   */
  getPublicItems = async (userUUID) => {
    try {
      let isAddedQ = '';
      let values = [];

      if (userUUID) {
        isAddedQ =
          ' , EXISTS ( ' +
          '    SELECT ui.item_id ' +
          '    FROM user_item ui ' +
          '    WHERE ui.user_id = $1 ' +
          '    AND ui.item_id = item.item_id ' +
          ') as isadded ';
        values.push(userUUID);
      }

      const query =
        'SELECT item_id, item.name, owner, summary, description, points, ' +
        'cost_effort, cost_money, cost_time, repeatable, item.d_created, ' +
        'effort.value as cost_effort_value, ' +
        'money.value as cost_money_value, ' +
        'time.value as cost_time_value,' +
        'repeat.value as repeatable_value ' +
        isAddedQ +
        'FROM item ' +
        'JOIN domain as effort ON cost_effort = effort.domain_id ' +
        'JOIN domain as time ON cost_time = time.domain_id ' +
        'JOIN domain as money ON cost_money = money.domain_id ' +
        'JOIN domain as repeat ON repeatable = repeat.domain_id ' +
        'WHERE owner IS NULL AND active=true ' +
        'ORDER BY item.d_created DESC';

      return await this.pool.query(query, values);
    } catch (error) {
      console.error(`getPublicItems Error: ${error}`);
    }
  };

  /**
   * Get a specific item, used in item updating
   * @returns a specific item.
   */
  getItemById = async (item_id) => {
    try {
      const results = await this.pool.query(
        `SELECT item_id, name, owner, summary, description FROM item WHERE item_id = $1`,
        [item_id]
      );
      return results;
    } catch (error) {
      console.error(`getItemPoints Error: ${error}`);
    }
  };

  /**
   * post new Item, requires all foreign key fields to be uuid's, if owner is not null also fills owner field.
   * @returns a promise with results. Needs to be awaited to access rows.
   */
  postItemsComplete = async (item) => {
    let owner = '';
    let ownerId = '';

    if (item.owner !== undefined && item.owner !== null) {
      owner = `owner, `;
      ownerId = `'${item.userUUID}',`;
    }

    try {
      const results = await this.pool.query(
        `INSERT INTO item (name, ` +
          owner +
          `cost_money, cost_effort, cost_time, summary, repeatable, description, points)` +
          `VALUES ($1,` +
          ownerId +
          `$2, $3, $4, $5, $6, $7, $8) RETURNING item_id`,
        [
          item.name,
          item.cost_money,
          item.cost_effort,
          item.cost_time,
          item.summary,
          item.repeatable,
          item.description,
          item.points,
        ]
      );
      return results;
    } catch (error) {
      console.error(`postItemsComplete Error: ${error}`);
    }
  };

  /**
   * Get a points belongning to a specific item, used in item marking items as complete
   * @returns point count of a specific item.
   */
  getItemPoints = async (item_id) => {
    try {
      const results = await this.pool.query(`SELECT points FROM item WHERE item_id = $1`, [
        item_id,
      ]);
      return results;
    } catch (error) {
      console.error(`getItemPoints Error: ${error}`);
    }
  };

  /**
   * Updates an item with this specific item_id
   * @returns name of the updated item
   */
  updateItem = async (item) => {
    try {
      const results = await this.pool.query(
        `UPDATE item SET name = $1, summary = $2, description = $3, cost_money = $4, cost_effort = $5, cost_time = $6, repeatable = $7, points = $8 WHERE item_id = $9 RETURNING item_id`,
        [
          item.name,
          item.summary,
          item.description,
          item.cost_money,
          item.cost_effort,
          item.cost_time,
          item.repeatable,
          item.points,
          item.item_id,
        ]
      );
      return results;
    } catch (error) {
      console.error(`updateItem Error: ${error}`);
    }
  };

  /**
   * deletes an item with this specific item_id
   * @returns name of the updated item
   */
  deleteItem = async (itemID) => {
    try {
      const results = await this.pool.query(
        `UPDATE item SET active=false WHERE item_id=$1 RETURNING item_id`,
        [itemID]
      );
      return results;
    } catch (error) {
      console.error(`deleteItem Error: ${error}`);
    }
  };

  // UserItem Queries

  /**
   * create a new UserItem, functionally adds an item to a user's list.
   */
  createUserItem = async (user_id, item_id) => {
    try {
      const results = await this.pool.query(
        `INSERT INTO user_item (user_id, item_id, completed) VALUES ($1, $2, $3) RETURNING user_item_id`,
        [user_id, item_id, false]
      );
      return results;
    } catch (error) {
      console.error(`createUserItem Error: ${error}`);
    }
  };

  /** Deactivate private items */
  deactiveItem = async (itemId) => {
    try {
      return await this.pool.query(
        `UPDATE item SET active=false WHERE item_id = $1 RETURNING item_id`,
        [itemId]
      );
    } catch (error) {
      console.error(`deactiveItem Error: ${error}`);
    }
  };

  /** Delete user_item */
  deleteItemFromList = async (userItemId) => {
    await this.pool.query(`DELETE FROM user_item_task WHERE user_item_id = $1`, [userItemId]);
    await this.pool.query(`DELETE FROM user_item WHERE user_item_id = $1`, [userItemId]);
  };

  /**
   * get all items from a user's list.
   * @param {*} user_id id of the item's user.
   */
  getUserItemsByUser = async (user_id) => {
    try {
      const results = await this.pool.query(
        'SELECT i.item_id, i.name, i.owner, i.summary, i.description, i.points, ' +
          'ui.completed, ui.user_item_id, ' +
          "(ui.d_completed + '1 days')::date <= 'now'::date AS day_passed, " +
          "(ui.d_completed + '7 days')::date <= 'now'::date AS week_passed," +
          "(ui.d_completed + '1 months')::date <= 'now'::date AS month_passed," +
          'effort.value as cost_effort_value, ui.d_created, ' +
          'cost_effort, ' +
          'money.value as cost_money_value, ' +
          'cost_money, ' +
          'time.value as cost_time_value,' +
          'cost_time, ' +
          'repeat.value as repeatable_value, ' +
          'repeatable, ' +
          '(SELECT COUNT(*) AS tasks_completed FROM user_item_task WHERE user_item_id = ui.user_item_id AND (d_completed > ui.d_completed OR ui.d_completed IS NULL)), ' +
          '(SELECT COUNT(*) AS tasks FROM task WHERE i.item_id = task.item_id) ' +
          'FROM user_item AS ui ' +
          'JOIN item AS i ' +
          'ON ui.item_id = i.item_id ' +
          'JOIN domain as effort ' +
          'ON cost_effort = effort.domain_id ' +
          'JOIN domain as time ' +
          'ON cost_time = time.domain_id ' +
          'JOIN domain as money ' +
          'ON cost_money = money.domain_id ' +
          'JOIN domain as repeat ' +
          'ON repeatable = repeat.domain_id ' +
          'WHERE ui.user_id = $1 ' +
          'ORDER BY ui.d_created DESC',
        [user_id]
      );
      return results;
    } catch (error) {
      console.error(`getUserItemsByUser Error: ${error}`);
    }
  };

  /**
   * Get a specific item, used to refresh itemDetails
   * isAdmin decides whether it gets all the user_item attributes as well
   * @returns a specific item.
   */
  getItemDetails = async (user_id, item_id, isAdmin) => {
    try {
      const results = isAdmin
        ? await this.pool.query(
            'SELECT item_id, item.name, owner, summary, description, points, ' +
              'cost_effort, cost_money, cost_time, repeatable, ' +
              'effort.value as cost_effort_value, ' +
              'money.value as cost_money_value, ' +
              'time.value as cost_time_value,' +
              'repeat.value as repeatable_value ' +
              'FROM item ' +
              'JOIN domain as effort ON cost_effort = effort.domain_id ' +
              'JOIN domain as time ON cost_time = time.domain_id ' +
              'JOIN domain as money ON cost_money = money.domain_id ' +
              'JOIN domain as repeat ON repeatable = repeat.domain_id ' +
              'WHERE owner IS NULL AND item_id=$1',
            [item_id]
          )
        : await this.pool.query(
            'SELECT i.item_id, i.name, i.owner, i.summary, i.description, i.points, ' +
              'ui.completed, ui.user_item_id, ' +
              "(ui.d_completed + '1 days')::date <= 'now'::date AS day_passed, " +
              "(ui.d_completed + '7 days')::date <= 'now'::date AS week_passed," +
              "(ui.d_completed + '1 months')::date <= 'now'::date AS month_passed," +
              'effort.value as cost_effort_value, ' +
              'cost_effort, ' +
              'money.value as cost_money_value, ' +
              'cost_money, ' +
              'time.value as cost_time_value,' +
              'cost_time, ' +
              'repeat.value as repeatable_value, ' +
              'repeatable, ' +
              '(SELECT COUNT(*) AS tasks_completed FROM user_item_task WHERE user_item_id = ui.user_item_id AND (d_completed > ui.d_completed OR ui.d_completed IS NULL)), ' +
              '(SELECT COUNT(*) AS tasks FROM task WHERE i.item_id = task.item_id) ' +
              'FROM user_item AS ui ' +
              'JOIN item AS i ' +
              'ON ui.item_id = i.item_id ' +
              'JOIN domain as effort ' +
              'ON cost_effort = effort.domain_id ' +
              'JOIN domain as time ' +
              'ON cost_time = time.domain_id ' +
              'JOIN domain as money ' +
              'ON cost_money = money.domain_id ' +
              'JOIN domain as repeat ' +
              'ON repeatable = repeat.domain_id ' +
              `WHERE ui.user_id = $1 AND ui.item_id=$2`,
            [user_id, item_id]
          );
      return results;
    } catch (error) {
      console.error(`getItemPoints Error: ${error}`);
    }
  };

  /**
   * Gets user_item_id by user_id and item_id, used to mark item as complete
   * @param {*} user_id
   * @param {*} item_id
   * @returns
   */
  getUserItemId = async (user_id, item_id) => {
    try {
      const results = await this.pool.query(
        `SELECT user_item_id FROM user_item WHERE user_id = $1 AND item_id = $2`,
        [user_id, item_id]
      );
      return results;
    } catch (error) {
      console.error(`getUserItemId Error: ${error}`);
    }
  };

  /**
   * completes a userItem, sets completed date to now.
   */
  completeUserItem = async (user_item_id) => {
    try {
      const results = await this.pool.query(
        `UPDATE user_item SET completed = ${true}, d_completed = ('now'::date + 'now'::time) WHERE user_item_id = $1 RETURNING user_item_id`,
        [user_item_id]
      );
      return results;
    } catch (error) {
      console.error(`completeUserItem Error: ${error}`);
    }
  };

  /**
   * create a user_item_history row, is used when marking an item as complete.
   */
  createUserItemHistory = async (user_id, item_id, points) => {
    try {
      const results = await this.pool.query(
        `INSERT INTO user_item_history (user_id, item_id, d_completed, points) VALUES ($1, $2, ('now'::date + 'now'::time), $3) RETURNING user_item_history_id`,
        [user_id, item_id, points]
      );
      return results;
    } catch (error) {
      console.error(`createUserItemHistory Error: ${error}`);
    }
  };

  getUserItemHistory = async (userUUID) => {
    try {
      const results = await this.pool.query(
        'SELECT uih.user_item_history_id, i.item_id, i.name, i.summary, i.description, i.points, ' +
          '(uih.d_completed IS NOT NULL) AS completed, ' +
          "(uih.d_completed + '1 days')::date <= 'now'::date AS day_passed, " +
          "(uih.d_completed + '7 days')::date <= 'now'::date AS week_passed," +
          "(uih.d_completed + '1 months')::date <= 'now'::date AS month_passed," +
          "to_char(uih.d_completed, 'DD Mon YYYY HH24:MI:SS') AS d_completed, " +
          'effort.value as cost_effort_value, ' +
          'cost_effort, ' +
          'money.value as cost_money_value, ' +
          'cost_money, ' +
          'time.value as cost_time_value,' +
          'cost_time, ' +
          'repeat.value as repeatable_value, ' +
          'repeatable ' +
          'FROM user_item_history AS uih ' +
          'JOIN item AS i ' +
          'ON uih.item_id = i.item_id ' +
          'JOIN domain as effort ' +
          'ON cost_effort = effort.domain_id ' +
          'JOIN domain as time ' +
          'ON cost_time = time.domain_id ' +
          'JOIN domain as money ' +
          'ON cost_money = money.domain_id ' +
          'JOIN domain as repeat ' +
          'ON repeatable = repeat.domain_id ' +
          `WHERE uih.user_id = $1 ` +
          `ORDER BY uih.d_completed DESC`,
        [userUUID]
      );
      return results;
    } catch (error) {
      console.error(`getUserItemHistory Error: ${error}`);
    }
  };

  /**
   * Add points to a user, is used when marking an item as complete.
   */
  addPointsToUser = async (user_id, points) => {
    try {
      const results = await this.pool.query(
        `UPDATE mpp_user SET points = (points + $1) WHERE user_id = $2 RETURNING user_id`,
        [points, user_id]
      );
      return results;
    } catch (error) {
      console.error(`addPointsToUser Error: ${error}`);
    }
  };

  // Domains Queries

  /**
   * Get domains that have the same name.
   * @returns a promise with results. contains id, name and value, Needs to be awaited to access rows.
   */
  getDomainByName = async (name) => {
    try {
      const results = await this.pool.query(
        `SELECT domain_id, name, value FROM domain WHERE name = $1`,
        [name]
      );
      return results;
    } catch (error) {
      console.error(`getDomainByName Error: ${error}`);
    }
  };

  /**
   * Get the value of a domain Entry
   * @param domain_id
   */
  getDomainValueById = async (domain_id) => {
    try {
      return await this.pool.query('SELECT value FROM domain WHERE domain_id=$1', [domain_id]);
    } catch (error) {
      console.error(`getDomainValueById Error: ${error}`);
    }
  };

  // User Queries

  getUserByUUID = async (UUID) => {
    try {
      const result = await this.pool.query(
        `SELECT user_id, points FROM mpp_user WHERE mpp_user.user_id = $1`,
        [UUID]
      );
      return result;
    } catch (error) {
      console.error(`getUserByUUID Error: ${error}`);
    }
  };

  createUserByUUID = async (UUID) => {
    try {
      const result = await this.pool.query(
        `INSERT INTO mpp_user (user_id, points) VALUES ($1, $2) RETURNING user_id`,
        [UUID, 0]
      );
      return result;
    } catch (error) {
      console.error(`createUserByUUID Error: ${error}`);
    }
  };

  createTaskByUUID = async (taskName, taskDesc, itemID) => {
    try {
      await this.pool.query('INSERT INTO task (name, description, item_id) VALUES ($1, $2, $3)', [
        taskName,
        taskDesc,
        itemID,
      ]);
    } catch (error) {
      console.error(`createTaskByUUID: ${error}`);
    }
  };

  getTasksByUserUUID = async (userItemId, itemID) => {
    try {
      return await this.pool.query(
        'SELECT t.item_id, t.task_id, t.name, t.description, ' +
          '   EXISTS ( ' +
          '       SELECT d_completed ' +
          '       FROM user_item_task uit ' +
          '       WHERE uit.task_id = t.task_id ' +
          '       AND uit.user_item_id = $1 ' +
          '       AND (d_completed > (' +
          '         SELECT d_completed ' +
          '         FROM user_item' +
          '         WHERE user_item_id = $1' +
          '       )' +
          '       OR (' +
          '         SELECT d_completed ' +
          '         FROM user_item' +
          '         WHERE user_item_id = $1' +
          '       ) IS NULL)' +
          '   ) as completed ' +
          'FROM task t ' +
          'WHERE t.item_id = $2',
        [userItemId, itemID]
      );
    } catch (error) {
      console.error(`getTasksByUserUUID: ${error}`);
    }
  };

  getTasksByUUID = async (itemID) => {
    try {
      return await this.pool.query(
        'SELECT t.item_id, t.task_id, t.name, t.description ' +
          'FROM task t ' +
          'WHERE t.item_id = $1',
        [itemID]
      );
    } catch (error) {
      console.error(`getTasksByUUID: ${error}`);
    }
  };

  completeTask = async (userItemId, taskId) => {
    await this.pool.query(
      `INSERT INTO user_item_task(user_item_id, task_id, d_completed) VALUES ($1, $2, 'now'::date + 'now'::time)`,
      [userItemId, taskId]
    );
  };

  getTaskByUUID = async (itemID, taskID) => {
    try {
      const result = await this.pool.query(
        'SELECT task_id, name, description FROM task WHERE item_id = $1 AND task_id=$2',
        [itemID, taskID]
      );
      return result;
    } catch (error) {
      console.error(`getTasksByUUID: ${error}`);
    }
  };

  updateTaskByUUID = async (taskName, taskDesc, itemID, taskID) => {
    try {
      const results = await this.pool.query(
        'UPDATE task SET name=$1, description=$2 WHERE item_id=$3 AND task_id=$4',
        [taskName, taskDesc, itemID, taskID]
      );
      return results;
    } catch (error) {
      console.error(`updateTaskByUUID: ${error}`);
    }
  };

  deleteTaskByUUID = async (taskID) => {
    try {
      return await this.pool.query(`DELETE FROM task WHERE task_id=$1`, [taskID]);
    } catch (error) {
      console.error(`deleteTaskByUUID: ${error}`);
    }
  };
};

export default DbClient;
