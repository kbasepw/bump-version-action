const json = require('comment-json');
const fs = require('fs');
const path = require('path');
const util = require('util');

const fs_access = util.promisify(fs.access);

module.exports = {
  name: 'npm',

  is_enabled(project_path) {
    const packageFile = path.resolve(project_path, 'package.json');

    return fs_access(packageFile)
      .then(() => true)
      .catch(err => false);
  },

  update_version(project_path, next_version) {
    const packageFile = path.resolve(project_path, 'package.json');
    return new Promise(function(resolve, reject) {
      fs.readFile(packageFile, {encoding: 'utf8'}, function(err, content) {
        const pkg = json.parse(content);
        pkg.version = next_version;
        fs.writeFile(packageFile, json.stringify(pkg, null, 2), {encoding: 'utf8'}, function(err) {
          if(err) {
            reject(err);
          } else {
            resolve(true);
          }
        })
      });
    });
  }
}
