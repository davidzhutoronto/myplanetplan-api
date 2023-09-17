# myplanetplan-api

version_number: 0.51

Back-end API end point for MyPlanetPlan: myplanetplan.org

## How to run locally

1.  You will need download and install latest version of [Node](https://nodejs.org/en/), [GIT](https://git-scm.org) and [Docker](https://www.docker.com/) (run it after install). And probably a code editor like [VSCode](https://code.visualstudio.com/).
2.  Clone the repository [myplanetplan-api](https://github.com/FaberAdvies/myplanetplan-api) and cd into it.
3.  Copy .env.example to .env and change the values accordingly.
4.  Run database docker image: \
    `docker-compose -p mpp up -d`
5.  Copy the setup sql scripts to the running database container mpp-api-db-1: \
    `docker cp ./sql/ mpp-api-db-1:/home/`
6.  Run the sql script to set up the database: \
    `docker exec -u postgres mpp-api-db-1 psql myplanetplan myplanetplan -f /home/sql/001_schema.sql -f /home/sql/002_domain.sql -f /home/sql/003_items.sql`
7.  install any npm packages: `npm install`
8.  run server: `npm start`


## Setup database on Server
1. Copy `/sql` folder from `myplanetplan-api` container to host \
    `docker cp bucketlist-api-1:/app/sql .`
2. Copy `/sql` folder from host to `myplanetplan-db` container  \
    `docker cp sql bucketlist-api-db-1:/sql`
3. Run .sql script \
    `docker exec -u postgres bucketlist-api-db-1 psql myplanetplan myplanetplan -f /sql/001_schema.sql -f /sql/002_domain.sql -f /sql/003_items.sql`

## Run on the Server

Instructions on how to run on [GitHub Packages](https://github.com/features/packages)
Before you can push image to the server, you will need permission to do so.

1. Setting up Personal access token (PAT)
   - Log in to your personal github account and go to [developer settings](https://github.com/settings/apps).
   - Go to Personal access tokens on the left side and select Tokens (classic).
   - Click on Generate a new personal access token (classic) and set expration date as you wish.
   - Select write:packages.
   - Finally click generate token. This token is for pushing images to the repo from your local machine.
   - Save the token somewhere. It is a personal and private token. Don't share it.
   - Generate another token with read:packages rights. This token is for reading images from the behive/mpp-server.
   - Save this token too and keep it private.
2. Send your public ssh-key to @FaberAdvies. He will make sure you have access to the server. If you don't have one, create one.
3. ssh to the server: ssh [yourname]@myplanetplan.org and Docker login: `echo [YOUR_TOKEN] | docker login ghcr.io -u USERNAME --password-stdin`
4. Build and Push a Docker image locally.

```
cd myplanetplan-api
./build.sh -v [version]
```

change [version] to a newer version number

5. ssh to the server again: `ssh [yourname]@myplanetplan.org`
6. Docker login: `echo [YOUR_TOKEN] | docker login ghcr.io -u USERNAME --password-stdin`
7. cd to myplanetplan-deploy: `cd /home/behive/myplanetplan-deploy`
8. change the version number in .env file: `nano .env`
9. run deploy: `./deploy.sh`

## Run swagger

1. install all packages `npm i`
2. start the server `npm start`
3. go to browser and goto `http://localhost:3030/swagger/`
4. check API documentation and type in any json if needed
   Note1: Use mpp_auth (OAuth2, password), Flow: password to log in if needed, username and password is your own login.behive.nl user name and password, client_id is mpp-app, and leave client_secret empty.

Note2: Be sure to get IDs and UUIDs first before you can do any other operations.
