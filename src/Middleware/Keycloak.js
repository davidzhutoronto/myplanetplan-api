import Keycloak from 'keycloak-connect';

const KeyCloakMiddleware = class {
  static _keycloak;

  static initKeycloak = () => {
    console.log('Initializing Keycloak...');
    this._keycloak = new Keycloak(
      {},
      {
        resource: process.env.KEYCLOAK_MIDDLEWARE_RESOURCE,
        bearerOnly: true,
        serverUrl: process.env.KEYCLOAK_MIDDLEWARE_SERVER_URL,
        realm: process.env.KEYCLOAK_MIDDLEWARE_REALM,
        realmPublicKey: process.env.KEYCLOAK_MIDDLEWARE_REALM_PUBLICKEY,
      }
    );
  };

  static getKeycloak = () => {
    if (!this._keycloak) {
      console.error('Keycloak has not been initialized!');
    }
    return this._keycloak;
  };
};
export default KeyCloakMiddleware;
