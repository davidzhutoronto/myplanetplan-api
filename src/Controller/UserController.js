//src/Controller/UserControllers.js

//Deal all user information.
//e.g., user registration, retrieve users, retrieve a user by id,
//delete a user, update a user's information

import DbClient from '../Database/DbClient.js';
import { checkIsUUID } from '../Misc/InputParser.js';
import { parseJwt } from '../Misc/TokenParser.js';

const UserController = class {
  constructor() {
    //postgres instance
    this.dbClient = new DbClient();
  }

  getUserByUUID = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const UUID = token.sub;

    // Check input
    if (!checkIsUUID(UUID)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    let result = await this.dbClient.getUserByUUID(UUID);

    if (!result || result.rowCount === 0) {
      response.json({ error: 'No user found' });
      return;
    }

    response.json(result.rows);
  };

  createNewUser = async (request, response) => {
    const token = parseJwt(request.header('authorization'));
    const UUID = token.sub;
    // Check input
    if (!checkIsUUID(UUID)) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    const result = await this.dbClient.createUserByUUID(UUID);

    if (!result || result.rowCount === 0) {
      response.json({ error: 'Unable to add user' });
      return;
    }

    response.json(result.rows);
  };
};

export default UserController;
