const { AutotaskClient } = require("defender-autotask-client");

const handler = async function () {
  /* eslint-disable global-require */
  // eslint-disable-next-line import/no-extraneous-dependencies
  require("dotenv").config();
  const {
    TEAM_API_KEY: apiKey,
    TEAM_API_SECRET: apiSecret,
    AUTOTASK_ID: faucetAutotaskId,
  } = process.env;

  console.log(apiKey);

  const client = new AutotaskClient({
    apiKey,
    apiSecret,
  });

  // Deploy Autotask
  await client.updateCodeFromFolder(faucetAutotaskId, "dist");
};

handler()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
