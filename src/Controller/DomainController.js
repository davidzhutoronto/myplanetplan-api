import DbClient from '../Database/DbClient.js';
import { cleanString } from '../Misc/InputParser.js';

const DomainController = class {
  constructor() {
    this.dbClient = new DbClient();
  }

  getDomainByName = async (request, response) => {
    const name = cleanString(request.params.name);

    // Check inputs
    if (!name) {
      response.json({ error: 'One or more values were not viable' });
      return;
    }

    let results;
    try {
      results = await this.dbClient.getDomainByName(name);
    } catch (e) {
      response.json({ error: 'Something went wrong!' });
      return;
    }

    if (!results || results.rowCount === 0) {
      response.json({ error: 'No entries found.' });
      return;
    }

    response.json(results.rows);
  };
};

export default DomainController;
