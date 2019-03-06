const fs = require("fs");
const path = require("path");
const ajv = new (require("ajv"))();

const Server = require("./server/server");

/*
--- Constants ---
*/

const externalCwd = process.pkg ? path.dirname(process.execPath) : __dirname;
const internalCwd = process.pkg
  ? path.dirname(process.pkg.entrypoint)
  : __dirname;
const configPath = path.join(internalCwd, "config-server.json");
const schemaPath = path.join(internalCwd, "server/config-server-schema.json");
const config = require(configPath);
const schema = require(schemaPath);

/*
--- Config validation ---
*/

if (!ajv.validate(schema, config)) {
  console.log(ajv.errorsText(ajv.errors, { dataVar: "config-server.json" }));
  process.exit(1);
}

new Server(config, internalCwd, externalCwd).start();
