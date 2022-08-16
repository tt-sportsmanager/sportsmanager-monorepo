const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("defender-relay-client/lib/ethers");
const { main } = require("./main.js");

require("dotenv").config();

// Entrypoint for the Autotask
exports.handler = async function (event) {
  // Setup Relayer
  let signer;
  if (!process.env.hasOwnProperty("ENVIRONMENT_TYPE") || process.env.ENVIRONMENT_TYPE == "production") { // eslint-disable-line
    const provider = new DefenderRelayProvider(event);
    signer = new DefenderRelaySigner(event, provider, { speed: 'fastest' });
  }

  await main(
    event,
    signer,
  );
};

// To run locally (this code will not be executed in Autotasks)
// Run via node ....
if (require.main === module) {
  const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;

  exports
    .handler({
      apiKey,
      apiSecret,
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
