const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyPlanetPlan API Documentation',
      description: 'MyPlanetPlan API Documentation with Swagger',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        mpp_auth: {
          type: 'openIdConnect',
          openIdConnectUrl: process.env.OPEN_ID_CONNECT_URL,
        },
      },
    },
    tags: [
      {
        name: 'useraccount',
        description: 'Operations about user account',
      },
      {
        name: 'items',
        description: 'Everything about items',
      },
      {
        name: 'history',
        description: 'Everything about history',
      },
    ],
  },
  apis: ['app.js'],
};

export { options };
