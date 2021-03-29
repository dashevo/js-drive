const core = require('@actions/core');

core.setOutput("cache-url", process.env['ACTIONS_CACHE_URL']);
