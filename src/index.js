const action = require('./action');
const core = require('@actions/core');

try {
  const version_tag_prefix = core.getInput('version_tag_prefix', {required: false});

  const next_version = action(version_tag_prefix, core);

  core.setOutput('version', next_version);
} catch (error) {
  core.setFailed(error.message);
}
