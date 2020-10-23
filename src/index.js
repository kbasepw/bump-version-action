const action = require('./action');
const core = require('@actions/core');

(async function() {
  try {
    const version_tag_prefix = core.getInput('version_tag_prefix', {required: false});

    const next_version = await action(version_tag_prefix, core);

    core.setOutput('version', next_version);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
