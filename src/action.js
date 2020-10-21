const conventional = require('./conventional');
const fs = require('fs');
const git = require('./git');
const path = require('path');
const project_types = [
  require('./project_types/npm')
];

module.exports = async function action(version_tag_prefix, logger) {
  logger = logger || console;
  let next_version = null;

  logger.debug('retrieving last commit id ...');
  const last_commit_id = await git.get_last_commit_id();
  logger.debug(`found: ${last_commit_id}`);

  logger.debug('retrieving tags last commit ...');
  const last_commit_tags = await git.get_commit_tags(last_commit_id);
  logger.debug(`found: ${last_commit_tags.join(', ')}`);

  const last_commit_version_tag = last_commit_tags.find(tag => tag.startsWith(version_tag_prefix));
  if (last_commit_version_tag) {
    logger.info(`last commit already has a version tag: ${last_commit_version_tag}`);
    next_version = last_commit_version_tag.substring(version_tag_prefix.length);
  } else {
    logger.debug('retrieving last version tag ...')
    const last_tag = await git.get_previous_tag(version_tag_prefix);
    logger.debug(`found: ${last_tag || '<no previous version tag found>'}`);

    logger.debug(`retrieving commits since ${last_tag || 'ever'} ...`)
    const commits = await git.get_commits_since(last_tag);
    logger.debug(`found: ${commits.length} commits ...`);

    logger.debug('calculating next version ...')
    const current_version = last_tag ? last_tag.substring(1) : '0.0.0';
    next_version = conventional.get_next_version(current_version, commits);

    const project_path = process.cwd();
    await Promise.all(project_types
      .map(async function (type) {
        if(await type.is_enabled(project_path)) {
          logger.info(`updating project version for type: ${type.name}`);
          await type.update_version(project_path, next_version);
        }
      }));
  }

  return next_version;
}

