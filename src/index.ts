import WorkflowContext from './workflow_context';
import VersionManager from './version_manager';

const context = new WorkflowContext();
const manager = new VersionManager(context);
manager.bump_version()
  .then(version_info => context.set_output(version_info))
  .catch(error => context.set_failure(error));

