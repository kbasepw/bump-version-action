const exec = require('@actions/exec');

module.exports = async function execute(command) {
  let output = '';
  let error = '';

  const options = {
    silent: true,
    listeners: {
      stdout: (data) => { output += data.toString(); },
      stderr: (data) => { error  += data.toString(); }
    }
  };

  try {
    const exitCode = await exec.exec(command, undefined, options);
    if(exitCode !== 0) {
      throw new Error(error);
    }

    return output;
  } catch(e) {
    throw new Error(error);
  }
}

