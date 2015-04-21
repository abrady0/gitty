/*
 * Gitty - command.js
 * Author: Gordon Hall
 *
 * Handles the execution of Git commands
 */

var exec     = require('child_process').exec;
var execSync = require('child_process').execSync;
if (!execSync) {
  var oldExecSync = require('execSync');
  execSync = function(cmd, obj) {
     process.chdir(obj.cwd);
    return oldExecSync.exec(cmd).stdout;
  };
}


/**
 * Setup function for running GIT commands on the command line
 * @constructor
 * @param {String} path
 * @param {String} operation
 * @param {Array}  flags
 * @param {String} options
 */
var Command = function(path, operation, flags, options) {
  flags   = flags   || [];
  options = options || '';

  this.repo    = path;
  this.command = 'git ' + operation + ' ' + flags.join(' ') + ' ' + options;
  //The log operation on long lived active repos will require additional stdout buffer.
  //The default (200K) seems sufficient for all other operations.
  this.execBuffer = operation === 'log' ? 1024 * 5000 : 1024 * 200;
};

/**
 * Executes the stored operation in the given path
 * @param  {Function} callback
 */
Command.prototype.exec = function(callback) {
  exec(this.command, { cwd: this.repo, maxBuffer: this.execBuffer }, callback);
};

/**
 * Executes the stored operation in the given path syncronously
 */
Command.prototype.execSync = function() {
  //process.chdir(this.repo);
  return execSync(this.command, {cwd: this.repo, encoding: 'utf8'});
};

/**
 * Export Contructor
 * @constructor
 * @type {Object}
 */
module.exports = Command;