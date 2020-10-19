jest.mock('./execute');
const action = require('./action');
const child_process = require('child_process');
const execute = require('./execute');
const scenarios = require('./__fixtures/scenario_builder');

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
};

execute.mockImplementation(function (command) {
  return new Promise((resolve, reject) => {
    child_process.exec(command, function(error, stdout, stderr) {
      if (error) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
});

describe('action', function() {

  it('should bump to version 0.1.0 a new project with a feature commit', async function() {
    const project = scenarios.create_npm_project([
      'feat: some new interesting feature'
    ]);
    process.chdir(project);
    
    const result = await action('v', logger);

    expect(result).toEqual('0.1.0');
  });

  it('should respect last commit version tag', async function() {
    const project = scenarios.create_npm_project([
      {
        message: '[release] a version tagged commit',
        tags: ['v1.0.0']
      }
    ]);
    process.chdir(project);
    
    const result = await action('v', logger);

    expect(result).toEqual('1.0.0');
  });

  it('should bump version if last commit tags are not version tags', async function() {
    const project = scenarios.create_npm_project([
      {
        message: 'feat: some new feature'
      },
      {
        message: 'fix: some error fix'
      },
      {
        message: '[release] a version tagged commit',
        tags: ['some_other_tag']
      }
    ]);
    process.chdir(project);
    
    const result = await action('v', logger);

    expect(result).toEqual('0.1.0');
  });

});
