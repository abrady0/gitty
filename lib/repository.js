/*
 * Gitty - repository.js
 * Author: Gordon Hall
 *
 * Primary repository class that exposes all repository level operations
 */

var fs      = require('fs');
var path    = require('path');
var util    = require('util');
var Command = require('./command');
var parse   = require('./parser');
var events  = require('events');
var logFmt  = '--pretty=format:\'{"commit":"%H","author":"%an <%ae>",' +
              '"date":"%ad","message":"%s"},\''

/**
 * Constructor function for all repository commands
 * @constructor
 * @param {String} repo
 */
var Repository = function(repo) {
  var self = this;

  events.EventEmitter.call(this);

  self.path   = path.normalize(repo);
  self._ready = false;
  self.name   = path.basename(self.path);

  fs.exists(self.path + '/.git', function(exists) {
    self.initialized = exists;
    self._ready      = true;

    self.emit('ready');
  });
};

util.inherits(Repository, events.EventEmitter);

/**
 * Initializes the given directory as a GIT repository
 * @param  {Array}    flags
 * @param  {Function} callback
 */
Repository.prototype.init = function() {
  var self  = this;
  var args  = Array.prototype.slice.apply(arguments);
  var flags = Array.isArray(args[0]) ? args[0] : [];
  var done  = args.slice(-1).pop() || new Function();
  var cmd   = new Command(self.path, 'init', flags, '')

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err || new Error(stderr));
    }

    self.initialized = true;

    done();
  });
};

/**
 * Initializes the given directory as a GIT repository
 * @param  {Array}    flags
 * @param  {Function} callback
 */
Repository.prototype.initSync = function() {
  var self  = this;
  var args  = Array.prototype.slice.apply(arguments);
  var flags = Array.isArray(args[0]) ? args[0] : [];
  var cmd   = new Command(self.path, 'init', flags, '')

  cmd.execSync();

  return self.initialized = true;
};

/**
 * Forwards the commit history to the callback function
 * @param  {String}   branch
 * @param  {Function} callback
 */
Repository.prototype.log = function() {
  var self   = this;
  var args   = Array.prototype.slice.apply(arguments);
  var branch = typeof args[0] === 'string' ? args[0] : null;
  var done   = args.slice(-1).pop() || new Function();
  var cmd    = new Command(self.path, 'log', [logFmt]);

  cmd.exec(function(err, stdout, stderr) {
    if (err || stderr) {
      return done(err || new Error(stderr));
    }

    done(null, parse.log(stdout));
  });
};

/**
 * Returns the commit history
 * @param  {String} branch
 */
Repository.prototype.logSync = function(branch) {
  var self = this;
  var cmd  = new Command(self.path, 'log', [branch || '', logFmt]);

  return parse.log(cmd.execSync());
};

/**
 * Forwards the GIT status object to the callback function
 * @param {Function} callback
 */
Repository.prototype.status = function(callback) {
  var self    = this;
  var done    = callback || new Function();
  var status  = new Command(self.path, 'status', ['--porcelain']);
  var lsFiles = new Command(self.path, 'ls-files', ['-o','--exclude-standard']);

  status.exec(function(err, status, stderr) {
    done(null, parse.status(status));
  });
};

/**
 * Returns the GIT status object
 */
Repository.prototype.statusSync = function() {
  var self    = this;
  var status  = new Command(self.path, 'status', ['--porcelain']);
  return parse.status(status.execSync());
};

/**
 * Stages the passed array of files for commiting
 * @param {Array}    files
 * @param {Function} callback
 */
Repository.prototype.add = function(files, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'add', [], files.join(' '));

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null);
  });
};

/**
 * Stages the passed array of files for commiting
 * @param {Array} files
 */
Repository.prototype.addSync = function(files) {
  var self = this;
  var cmd  = new Command(self.path, 'add', [], files.join(' '));

  return cmd.execSync();
};

/**
 * Removes the passed array of files from the repo for commiting
 * @param  {Array}   files
 * @param  {Function} callback
 */
Repository.prototype.remove = function(files, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'rm', ['--cached'], files.join(' '));

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      done(err);
    }

    done(null);
  });
};

/**
 * Removes the passed array of files from the repo for commiting
 * @param  {Array}   files
 */
Repository.prototype.removeSync = function(files) {
  var self = this;
  var cmd  = new Command(self.path, 'rm', ['--cached'], files.join(' '));

  return cmd.execSync();
};

/**
 * Unstages the passed array of files from the staging area
 * @param  {Array}   files
 * @param  {Function} callback
 */
Repository.prototype.unstage = function(files, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'reset HEAD', [], files.join(' '));

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null);
  });
};

/**
 * Unstages the passed array of files from the staging area
 * @param  {Array}   files
 */
Repository.prototype.unstageSync = function(files) {
  var self = this;
  var cmd  = new Command(self.path, 'reset HEAD', [], files.join(' '));

  return cmd.execSync();
};

/**
 * Commits the staged area with the given message
 * @param  {String}   message
 * @param  {Array}    flags
 * @param  {Function} callback
 */
Repository.prototype.commit = function(message, flags, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(this.path, 'commit', flags.concat(['-m']), '"' + message + '"');

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    var result = stdout ? parse.commit(stdout) : {};

    if (result.error) {
      return done(result.error);
    }

    done(null, result);
  });
};

/**
 * Commits the staged area with the given message
 * @param  {String}   message
 */
Repository.prototype.commitSync = function(message, flags) {
  var self   = this;
  var cmd    = new Command(this.path, 'commit', (flags || []).concat(['-m']), '"' + message + '"');
  var output = cmd.execSync();
  var result = output ? parse.commit(output) : {};

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
};

Repository.prototype.branchCmd = function(flags, callback) {
  if (flags instanceof Function) {
    callback = flags;
    flags = null;
  }
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'branch', flags);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null, parse.branch(stdout));
  });
};

/**
 * Forwards object with the current branch and all others to the callback
 * @param  {Function} callback
 */
Repository.prototype.getBranches = function(flags, callback) {
  this.branchCmd(flags, callback);
};

/**
 * Returns a denoted object with the current branch and all other branches
 * @param  {Function} callback
 */
Repository.prototype.getBranchesSync = function() {
  var self = this;
  var cmd  = new Command(self.path, 'branch');

  return parse.branch(cmd.execSync());
};

/**
 * Creates a new branch with the given branch name
 * @param  {String}   name
 * @param  {Function} callback
 */
Repository.prototype.createBranch = function(name, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'branch', [], name);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null);
  });
};

/**
 * Creates a new branch with the given branch name
 * @param  {String} name
 */
Repository.prototype.createBranchSync = function(name) {
  var self = this;
  var cmd  = new Command(self.path, 'branch', [], name);

  return cmd.execSync();
};

/**
 * Performs a GIT checkout on the given branch
 * @param  {String}   branch
 * @param  {Function} callback
 */
Repository.prototype.checkout = function(branch, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'checkout', [], branch);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      console.log('!!!', err, stderr)
      return done(err);
    }

    self.getBranches(done);
  });
};

/**
 * Performs a GIT checkout on the given branch
 * @param  {String}   branch
 */
Repository.prototype.checkoutSync = function(branch) {
  var self = this;
  var cmd  = new Command(self.path, 'checkout', [], branch);

  cmd.execSync();

  return self.getBranchesSync();
};

/**
 * Performs a GIT merge in the current branch against the specified one
 * @param  {String}   branch
 * @param  {Function} callback
 */
Repository.prototype.merge = function(branch, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'merge', [], branch);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      // stdout: 
      // Auto-merging mergeConflictSrcBranch_foo.js
      // CONFLICT (add/add): Merge conflict in mergeConflictSrcBranch_foo.js
      // Automatic merge failed; fix conflicts and then commit the result.
      // stderr: ''
      return done({error: 'merge command failed', message: stdout+stderr});
    }

    done(null);
  });
};

/**
 * Performs a GIT merge in the current branch against the specified one
 * @param  {String}  branch
 */
Repository.prototype.mergeSync = function(branch) {
  var self = this;
  var cmd  = new Command(self.path, 'merge', [], branch);

  return cmd.execSync();
};

/**
 * Forwards a array of repositorys'tags to the callback function
 * @param  {Function} callback
 */
Repository.prototype.getTags = function(callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'tag');

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null, parse.tag(stdout));
  });
};

/**
 * Forwards a array of repositorys'tags to the callback function
 */
Repository.prototype.getTagsSync = function() {
  var self = this;
  var cmd  = new Command(self.path, 'tag');

  return parse.tag(cmd.execSync());
};

/**
 * Creates a new tag from the given tag name
 * @param  {String}   name
 * @param  {Function} callback
 */
Repository.prototype.createTag = function(name, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'tag', [], name)

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null);
  });
};

/**
 * Creates a new tag from the given tag name
 * @param  {String}   name
 */
Repository.prototype.createTagSync = function(name) {
  var self = this;
  var cmd  = new Command(self.path, 'tag', [], name)

  return cmd.execSync();
};

/**
 * Adds a new remote
 * @param {String}   remote
 * @param {String}   url
 * @param {Function} callback
 */
Repository.prototype.addRemote = function(remote, url, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'remote add', [], remote + ' ' + url);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null);
  });
};

/**
 * Adds a new remote
 * @param {String}   remote
 * @param {String}   url
 */
Repository.prototype.addRemoteSync = function(remote, url) {
  var self = this;
  var cmd  = new Command(self.path, 'remote add', [], remote + ' ' + url);

  return cmd.execSync();
};

/**
 * Changes the URL of a existing remote
 * @param {String}   remote
 * @param {String}   url
 * @param {Function} callback
 */
Repository.prototype.setRemoteUrl = function(remote, url, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'remote set-url', [], remote + ' ' + url);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null);
  });
};

/**
 * Changes the URL of a existing remote
 * @param {String}   remote
 * @param {String}   url
 * @param {Function} callback
 */
Repository.prototype.setRemoteUrlSync = function(remote, url) {
  var self = this;
  var cmd  = new Command(self.path, 'remote set-url', [], remote + ' ' + url);

  return cmd.execSync();
};

/**
 * Removes the given remote
 * @param  {String}   remote
 * @param  {Function} callback
 */
Repository.prototype.removeRemote = function(remote, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'remote rm', [], remote);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null);
  });
};

/**
 * Removes the given remote
 * @param  {String}   remote
 */
Repository.prototype.removeRemoteSync = function(remote) {
  var self = this;
  var cmd  = new Command(self.path, 'remote rm', [], remote);

  return cmd.execSync();
};

/**
 * Forwards an key-value list (remote : url) to the callback function
 * @param  {Function} callback
 */
Repository.prototype.getRemotes = function(callback) {
  this.remoteCmd(['-v'], callback);
};

/**
 * Forwards an key-value list (remote : url) to the callback function
 * @param  {Function} callback
 */
Repository.prototype.getRemotesSync = function() {
  var self = this;
  var cmd  = new Command(self.path, 'remote', ['-v']);

  return parse.remotes(cmd.execSync());
};

Repository.prototype.remoteCmd = function(flags, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'remote', flags);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null, parse.remotes(stdout));
  });
};

/**
 * Performs a GIT push to the given remote for the given branch name
 * @param  {String}   remote
 * @param  {String}   branch
 * @param  {Array}    flags
 * @param  {Object}   creds
 * @param  {Function} callback
 */
Repository.prototype.push = function() {
  var self   = this;
  var args   = Array.prototype.slice.apply(arguments);
  var remote = args[0];
  var branch = args[1];
  var done   = args.slice(-1).pop();
  var flags  = Array.isArray(args[2]) ? args[2] : null;
  var creds  = null;

  if (flags && args[3].username) {
    creds = args[3];
  }
  else if (args[2].username) {
    creds = args[2];
  }

  return sync(self.path, {
    operation: 'push',
    remote: remote,
    branch: branch,
    flags: flags,
    credentials: creds || { username: null, password: null }
  }, done);
};

/**
 * Performs a GIT pull from the given remote with the given branch name
 * @param  {String}   remote
 * @param  {String}   branch
 * @param  {Array}    flags
 * @param  {Object}   creds
 * @param  {Function} callback
 */
Repository.prototype.pull = function() {
  var self   = this;
  var args   = Array.prototype.slice.apply(arguments);
  var remote = args[0];
  var branch = args[1];
  var done   = args.slice(-1).pop();
  var flags  = Array.isArray(args[2]) ? args[2] : null;
  var creds  = null;

  if (flags && args[3].username) {
    creds = args[3];
  }
  else if (args[2].username) {
    creds = args[2];
  }

  return sync(this.path, {
    operation: 'pull',
    remote: remote,
    branch: branch,
    flags: flags,
    credentials: creds || { username: null, password: null }
  }, done);
};

/**
 * Internal function to create a fake terminal to circumvent SSH limitations
 * @param  {Object}   options
 * @param  {Function} callback
 */
function sync(path, opts, callback) {
  var self    = this;
  var done    = callback || new Function();
  var flags   = opts.flags || [];
  var creds   = opts.credentials;
  var command = [opts.operation, opts.remote, opts.branch].concat(flags).join(' ');
  var cmd  = new Command(path, command);

  cmd.exec(function(err, stdout, stderr) {
    done(err, {stdout: stdout, stderr: stderr});
  });
}

/**
 * Resets the repository's HEAD to the specified commit
 * @param  {String}   hash
 * @param  {Function} callback
 */
Repository.prototype.reset = function(hash, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'reset', ['--hard'], hash);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    self.log(function(err, log) {
      if (err) {
        return done(err);
      }

      done(null, log);
    });
  });
};

/**
 * Resets the repository's HEAD to the specified commit
 * @param  {String}   hash
 */
Repository.prototype.resetSync = function(hash) {
  var self = this;
  var cmd  = new Command(self.path, 'reset', ['--hard'], hash);

  cmd.execSync();

  return self.logSync()
};

/**
 * Forwards the current commit hash to the callback function
 * @param  {Function} callback
 */
Repository.prototype.describe = function(callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'describe', ['--always']);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null, stdout);
  });
};

/**
 * Forwards the current commit hash to the callback function
 */
Repository.prototype.describeSync = function() {
  var self = this;
  var cmd  = new Command(self.path, 'describe', ['--always']);

  return cmd.execSync();
};

/**
 * Allows cherry-picking
 * @param  {string}   commit   Commit string
 * @param  {Function} callback callback-function
 */
Repository.prototype.cherryPick = function(commit, callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'cherry-pick', [], commit);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done(err);
    }

    done(null);
  });
};

/**
 * Allows cherry-picking
 * @param  {string}   commit   Commit string
 * @param  {Function} callback callback-function
 */
Repository.prototype.cherryPickSync = function(commit) {
  var self = this;
  var cmd  = new Command(self.path, 'cherry-pick', [], commit);

  return cmd.execSync();
};

/**
 * fetch from remote: TODO - write a parser for this
 * @param  {Function} callback callback-function
 */
Repository.prototype.fetch = function(callback) {
  var self = this;
  var done = callback || new Function();
  var cmd  = new Command(self.path, 'fetch',['--porcelain']);

  cmd.exec(function(err, stdout, stderr) {
    if (err) {
      return done({error: err, message: stdout+stderr});
    }

    done(null);
  });
};

/**
 * Export Constructor
 * @type {Object}
 */
module.exports = Repository;
