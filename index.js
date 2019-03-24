const path = require("path");
const ajv = new (require("ajv"))();

const Server = require("./server");

/*
--- Constants ---
*/

const externalCwd = process.pkg ? path.dirname(process.execPath) : __dirname;
const internalCwd = process.pkg
  ? path.dirname(process.pkg.entrypoint)
  : __dirname;
const configPath = path.join(externalCwd, "config", "config-server.json");
const schemaPath = path.join(externalCwd, "config", "config-server-schema.json");
const config = require(configPath);
const schema = require(schemaPath);

/*
--- Config validation ---
*/

if (!ajv.validate(schema, config)) {
  console.error(ajv.errorsText(ajv.errors, { dataVar: "config-server.json" }));
  process.exit(1);
}

const server = new Server(config, internalCwd, externalCwd);
server.start().then(() => {
  if (!server.silent) {
    console.log(`Listening on http://localhost:${config.port}/`);
  }

  if (process.env.NODE_ENV !== "production" && !server.silent) {
    require("opn")(`http://localhost:${config.port}/`);
  }
});
