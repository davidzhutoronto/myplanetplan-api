import './config.js';
import express from 'express';
import cors from 'cors';
import env from 'dotenv';
import KeyCloakMiddleware from './src/Middleware/Keycloak.js';
import UserController from './src/Controller/UserController.js';
import PublicItemsController from './src/Controller/PublicItemsController.js';
import DomainController from './src/Controller/DomainController.js';
import UserItemController from './src/Controller/UserItemController.js';
import TaskController from './src/Controller/TaskController.js';
// Create an express app instance we can use to attach middleware and HTTP routes
const app = express();

// Read environment variables from an .env file (if present)
env.config();

// Append Keycloak as a middleware
KeyCloakMiddleware.initKeycloak();
app.use(KeyCloakMiddleware.getKeycloak().middleware());

// Setup all controllers
const publicItemsController = new PublicItemsController();
const domainController = new DomainController();
const userController = new UserController();
const userItemController = new UserItemController();
const taskController = new TaskController();

// Use CORS middleware so we can make requests across origins
app.use(cors());
app.use(express.json());

const keycloak = KeyCloakMiddleware.getKeycloak();
const router = express.Router();

//swagger
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import { options } from './swagger.js';

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const jsDoc = swaggerJsDoc(options);
router.use('/swagger', swaggerUI.serve, swaggerUI.setup(jsDoc));

/**
 * @swagger
 * /useraccount:
 *  get:
 *    tags:
 *      - useraccount
 *    summary: Get a user
 *    responses:
 *      200:
 *        description: Success
 *    security:
 *      - mpp_auth:
 *        - useraccount_read
 */
// Check if user exists, returns an array of one object with user_id and points
router.get('/useraccount', keycloak.protect(), userController.getUserByUUID);

/**
 * @swagger
 * /useraccount:
 *  post:
 *    tags:
 *      - useraccount
 *    summary: Create a user object
 *    responses:
 *      200:
 *        description: Created
 *    security:
 *      - mpp_auth:
 *        - useraccount_create
 */
// Create a new user
router.post('/useraccount', keycloak.protect(), userController.createNewUser);

/**
 * @swagger
 * /public-items:
 *  get:
 *    tags:
 *     - items
 *    summary: get all public items object
 *    responses:
 *      200:
 *        description: Success
 */
// Get all items for Discoverpage.
router.get('/public-items', publicItemsController.getPublicItems);

/**
 * @swagger
 * /public-items:
 *  post:
 *    tags:
 *      - items
 *    summary: Create a public item.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *               name:
 *                 type: string
 *               summary:
 *                 type: string
 *               description:
 *                 type: string
 *               cost_money:
 *                 type: string
 *               cost_money_value:
 *                 type: string
 *               cost_effort:
 *                 type: string
 *               cost_effort_value:
 *                 type: string
 *               cost_time:
 *                 type: string
 *               cost_time_value:
 *                 type: string
 *               repeatable:
 *                 type: string
 *    responses:
 *      200:
 *        description: Created
 *    security:
 *      - mpp_auth:
 *        - public_item_create
 */
//json example, feel free to change to your own uuids
/* {
  "name": "asdf",
  "summary": "sup",
  "description": "supsup",
  "cost_money": "fcefead5-e79c-495d-932a-e6d0f33c8d32",
  "cost_money_value": "Hard",
  "cost_effort": "fcefead5-e79c-495d-932a-e6d0f33c8d32",
  "cost_effort_value": "Hard",
  "cost_time": "be195a66-afca-4ed2-8177-3cf40ddff2ff",
  "cost_time_value": "Extreme",
  "repeatable": "e9ef7dcd-ba79-4590-afd8-0c3492a7222a"
} */
// Create public item
router.post('/public-items', keycloak.protect(), publicItemsController.createPublicItem);

/**
 * @swagger
 * /public-items/{item_id}:
 *  put:
 *    tags:
 *      - items
 *    summary: update an item.
 *    parameters:
 *      - name: item_id
 *        in: path
 *        description: 'The item id that needs to be updated. '
 *        required: true
 *        schema:
 *          type: string
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *               name:
 *                 type: string
 *               summary:
 *                 type: string
 *               description:
 *                 type: string
 *               cost_money:
 *                 type: string
 *               cost_money_value:
 *                 type: string
 *               cost_effort:
 *                 type: string
 *               cost_effort_value:
 *                 type: string
 *               cost_time:
 *                 type: string
 *               cost_time_value:
 *                 type: string
 *               repeatable:
 *                 type: string
 *    responses:
 *      200:
 *        description: Created
 *    security:
 *      - mpp_auth:
 *        - public_item_update
 */
// Update an item
router.put('/public-items/:item_id', keycloak.protect(), publicItemsController.updateItem);

// Delete an item
router.delete('/public-items/:item_id', keycloak.protect(), publicItemsController.deleteItem);

/**
 * @swagger
 * /user-item:
 *  get:
 *    tags:
 *      - items
 *    summary: Get all items from a user
 *    responses:
 *      200:
 *        description: Success
 *    security:
 *      - mpp_auth:
 *        - user_item_read
 */
// Get items of user
router.get('/user-item', keycloak.protect(), userItemController.getUserItemsByUser);

router.get('/itemdetails/:item_id', keycloak.protect(), userItemController.getItemDetails);

/**
 * @swagger
 * /user-item:
 *  post:
 *    tags:
 *      - items
 *    summary: Add an item to user's own list.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              item_id:
 *                type: string
 *    responses:
 *      200:
 *        description: Added
 *    security:
 *      - mpp_auth:
 *        - add_item_to_list
 */
// Add item to user's list
router.post('/user-item', keycloak.protect(), userItemController.addItemToList);

/**
 * @swagger
 * /user-item-history:
 *  get:
 *    tags:
 *      - history
 *    summary: Get user's history
 *    responses:
 *      200:
 *        description: Success
 *    security:
 *      - mpp_auth:
 *        - user_history_read
 */
// Get all a user's completed items
router.get('/user-item-history', keycloak.protect(), userItemController.getUserItemHistory);

/**
 * @swagger
 * /user-item-complete:
 *  post:
 *    tags:
 *      - history
 *    summary: Mark an item as done and add to user's history.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              item_id:
 *                type: string
 *    responses:
 *      200:
 *        description: Added
 *    security:
 *      - mpp_auth:
 *        - add_item_to_history
 */
// Create user_item_history, update user_item, update user's points
router.post('/user-item-complete', keycloak.protect(), userItemController.handleCompleteUserItem);

/**
 * @swagger
 * /user-item-delete:
 *  delete:
 *    tags:
 *      - history
 *    summary: delete an item from user's list.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              item_id:
 *                type: string
 *    responses:
 *      200:
 *        description: Deleted
 *    security:
 *      - mpp_auth:
 *        - delete_from_history
 */
// Used to remove item from list
router.delete('/user-item-delete', keycloak.protect(), userItemController.deleteItemFromList);

/**
 * @swagger
 * /domains/{name}:
 *  get:
 *    tags:
 *      - items
 *    summary: Get a domain with specific name
 *    parameters:
 *    - in: path
 *      name: name
 *      description: name of domain (Difficulty or Repeatable)
 *      schema:
 *        type: string
 *      required: true
 *    responses:
 *      200:
 *        description: Success
 */
// Get specific domains by name, such as difficulty or repeatability, used in filtering
router.get('/domains/:name', domainController.getDomainByName);

/**
 * @swagger
 * /item-tasks/{item_id}/{user_item_id}:
 *  get:
 *    tags:
 *      - items
 *    summary: Get all tasks of one item
 *    parameters:
 *    - in: path
 *      name: item_id
 *      description: uuid of the item
 *      schema:
 *        type: string
 *      required: true
 *    - in: path
 *      name: user_item_id
 *      description: uuid of the user item
 *      schema:
 *        type: string
 *      required: true
 *    responses:
 *      200:
 *        description: got item
 */
// Get all tasks of an item
router.get('/item-tasks/:item_id/:user_item_id', taskController.getAllTasksForItem);
/**
 * @swagger
 * /item-task:
 *  post:
 *    tags:
 *      - items
 *    summary: Create a task.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               item:
 *                 type: string
 *    responses:
 *      200:
 *        description: Created
 *    security:
 *      - mpp_auth:
 *        - item-task_create
 */
router.post('/item-task', keycloak.protect(), taskController.createTask);
// Complete task
router.post('/item-task-complete', keycloak.protect(), taskController.completeTask);
// Update task
router.put('/item-task/:item_id', keycloak.protect(), taskController.updateTask);
// Delete task
router.delete('/item-task/:item_id', keycloak.protect(), taskController.deleteTask);

app.use(router);

const port = parseInt(process.env.SERVER_PORT || 3030);

// Start a server listening on this port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
