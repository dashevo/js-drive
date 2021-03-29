const core = require('@actions/core');

core.setOutput("cache-url", process.env['ACTIONS_CACHE_URL']);
core.setOutput("cache-token", process.env['ACTIONS_RUNTIME_TOKEN']);
