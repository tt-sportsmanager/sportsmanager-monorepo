# sports-manager-monorepo

SportsManager DAO is a generative avatar art collective run by a group of crypto misfits.

## Contributing

If you're interested in contributing to SportsManager DAO repos we're excited to have you. Please discuss any changes in `#developers` in [discord.gg/sports-manager](https://discord.gg/sports-manager) prior to contributing to reduce duplication of effort and in case there is any prior art that may be useful to you.

## Packages

### sports-manager-api

The [sports-manager api](packages/sports-manager-api) is an HTTP webserver that hosts token metadata. This is currently unused because on-chain, data URIs are enabled.

### sports-manager-assets

The [sports-manager assets](packages/sports-manager-assets) package holds the Noun PNG and run-length encoded image data.

### sports-manager-bots

The [sports-manager bots](packages/sports-manager-bots) package contains a bot that monitors for changes in Noun auction state and notifies everyone via Twitter and Discord.

### sports-manager-contracts

The [sports-manager contracts](packages/sports-manager-contracts) is the suite of Solidity contracts powering SportsManager DAO.

### sports-manager-sdk

The [sports-manager sdk](packages/sports-manager-sdk) exposes the SportsManager contract addresses, ABIs, and instances as well as image encoding and SVG building utilities.

### sports-manager-subgraph

In order to make retrieving more complex data from the auction history, [sports-manager subgraph](packages/sports-manager-subgraph) contains subgraph manifests that are deployed onto [The Graph](https://thegraph.com).

### sports-manager-webapp

The [sports-manager webapp](packages/sports-manager-webapp) is the frontend for interacting with Noun auctions as hosted at [sports-manager.wtf](https://sports-manager.wtf).

## Quickstart

### Install dependencies

```sh
yarn
```

### Build all packages

```sh
yarn build
```

### Run Linter

```sh
yarn lint
```

### Run Prettier

```sh
yarn format
```
