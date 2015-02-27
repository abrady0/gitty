/*
 * Gitty - index.js
 * Author: Gordon Hall
 *
 * Initializes module and exposes public methods
 */

var Repository = require('./lib/repository');
var Command    = require('./lib/command');

/**
 * Setup function for getting access to a GIT repo
 * @constructor
 * @param  {String} path
 */
var Gitty = function(path) {
  return new Repository(path);
};

/**
* Handles the global GIT configuration
* @param  {String}   key
* @param  {String}   val
* @param  {Function} callback
*/
Gitty.setConfig = function(key, val, callback) {
  var cmd   = new Command('/', 'config', ['--global', key], '"' + val + '"');
  var done  = callback || new Function();

  cmd.exec(function(err, stdout, stderr) {
    done(err || null);
  });
};

/**
* Handles the global GIT configuration
* @param  {String}   key
* @param  {String}   val
* @param  {Function} callback
*/
Gitty.setConfigSync = function(key, val) {
  var cmd = new Command('/', 'config', ['--global', key], '"' + val + '"');

  return cmd.execSync();
};

/**
* Handles the global GIT configuration
* @param  {String}   key
* @param  {Function} callback
*/
Gitty.getConfig = function(key, callback) {
  var cmd  = new Command('/', 'config', ['--global', key]);
  var done = callback || new Function();

  cmd.exec(function(err, stdout, stderr) {
    done(err || null, stdout);
  });
};

/**
* Handles the global GIT configuration
* @param  {String}   key
* @param  {Function} callback
*/
Gitty.getConfigSync = function(key) {
  var cmd = new Command('/', 'config', ['--global', key]);

  return cmd.execSync();
};

/**
 * Wrapper for the GIT clone function
 * @param  {String}   path
 * @param  {String}   url
 * @param  {Object}   creds
 * @param  {Function} callback
 */
Gitty.clone = function(path, url) {
  var self  = this;
  var args  = Array.prototype.slice.apply(arguments);
  var done  = args.slice(-1).pop() || new Function();
  var command = ['clone', url, path].join(' ');
  var cmd  = new Command('/', command);

  cmd.exec(function(err, stdout, stderr) {
    done(err, {stdout: stdout, stderr: stderr});
  });};

/**
 * Export Contructor
 * @constructor
 * @type {Object}
 */
module.exports = Gitty;

/**
 * Export Repository Contructor
 * @constructor
 * @type {Object}
 */
module.exports.Repository = Repository;

/**
 * Export Command Contructor
 * @constructor
 * @type {Object}
 */
module.exports.Command = Command;
