/*
 * Gitty - output-parser.js
 * Author: Gordon Hall
 *
 * Exposes parsing functions for different console output
 */

/**
 * Parser
 * @type {Object}
 */
var parsers = {};

/**
 * Logger function
 * @param  {String} output
 * @return {String}
 */
parsers.log = function(output) {
  var log = '[' + output.substring(0, output.length - 1) + ']';

  // this function cleans the commit log from any double quotes breaking the
  // JSON string
  var h = log.match(/".*?": "(.*?)"[,}]/g);

  if (h) {
    for (var i = h.length - 1; i >= 0; i--) {
      var hh  = h[i].replace(/".*?": "(.*?)"[,}]/g, '$1');
      var hhh = hh.replace(/\"/g, '\\"');

      log = log.replace(hh, hhh);
    }
  }

  return JSON.parse(log);
};

/**
 * Output Handler for GIT status
 * @param  {String} gitstatus
 * @param  {String} untracked
 * @return {String}
 */
parsers.status = function(gitstatus) {
  var fileStatus = null;
  var output = gitstatus.split('\n').map(function(s){
    return [s.substring(0,2), s.substring(3)];
  });

  var status = {
    staged: [],
    unstaged: [],
    untracked: []
  };

  // X          Y     Meaning
  // -------------------------------------------------
  //           [MD]   not updated
  // M        [ MD]   updated in index
  // A        [ MD]   added to index
  // D         [ M]   deleted from index
  // R        [ MD]   renamed in index
  // C        [ MD]   copied in index
  // [MARC]           index and work tree matches
  // [ MARC]     M    work tree changed since index
  // [ MARC]     D    deleted in work tree
  // -------------------------------------------------
  // D           D    unmerged, both deleted
  // A           U    unmerged, added by us
  // U           D    unmerged, deleted by them
  // U           A    unmerged, added by them
  // D           U    unmerged, deleted by us
  // A           A    unmerged, both added
  // U           U    unmerged, both modified
  // -------------------------------------------------
  // ?           ?    untracked
  // !           !    ignored
  output.forEach(function(line) {
    var fileStatus = line[0];
    var fileName = line[1];
    if(!fileStatus) {
      return; // empty line
    }
    if(fileStatus.substring(0,2) == '??') {
      status.untracked.push({
        file: fileName,
        status: fileStatus
      });
    } else if(fileStatus.substring(0,1) == 'A'){
      status.staged.push({
        file: fileName,
        status: fileStatus
      });
    } else { 
      status.unstaged.push({
        file: fileName,
        status: fileStatus
      });
    }
  });
  return status;
};

/**
 * Output handler for GIT commit
 * @param  {String} output
 * @return {String}
 */
parsers.commit = function(output) {
  var commitFailed = (output.indexOf('nothing to commit') > -1 ||
                      output.indexOf('no changes added to commit') > -1);

  // if there is nothing to commit...
  if (commitFailed) {
    return {
      error: (function(output) {
        var lines = output.split('\n');
        for (var ln = 0; ln < lines.length; ln++) {
          if (lines[ln].indexOf('#') === -1) {
            return lines[ln];
          }
        };
      })(output)
    };
  }

  var splitOutput   = output.split('\n') || ['', ''];
  var branchAndHash = splitOutput[0].match(/\[([^\]]+)]/g)[0];
  var branch        = branchAndHash.substring(1, branchAndHash.length - 1);
  var hash          = branchAndHash.substring(1, branchAndHash.length - 1);
  var filesChanged  = splitOutput[1].split(' ')[0];
  var operations    = splitOutput.splice(2);

  return {
    branch: branch.split(' ')[0],
    commit: hash.split(' ')[1],
    changed: filesChanged,
    operations: operations
  };
};

/**
 * Output handler for GIT branch command
 * @param  {String} output
 * @return {String}
 */
parsers.branch = function(output) {
  var tree     = { current: null, others: [] };
  var branches = output.split('\n');

  branches.forEach(function(val, key) {
    if (val.indexOf('*') > -1) {
      tree.current = val.replace('*', '').trim();
    }
    else if (val) {
      tree.others.push(val.trim());
    }
  });

  return tree;
};

/**
 * Output handler for GIT tag command
 * @param  {String} output
 * @return {String}
 */
parsers.tag = function(output) {
  var tags = output.split(/\r?\n/);

  for (var i = 0; i < tags.length; i++) {
    if (!tags[i].length) {
      tags.splice(i, 1);
    }
  }

  return tags;
};

/**
 * Output handler for GIT remote -v command
 * @param  {String} output
 * @return {String}
 */
parsers.remotes = function(output) {
  var list    = {};
  var parseme = output.split('\n');

  parseme.forEach(function(val, key) {
    if (val.split('\t')[0]) {
      list[val.split('\t')[0]] = val.split('\t')[1].split(' ')[0];
    }
  });

  return list;
};

/**
 * Output handler for GIT errors from GIT push and pull commands
 * @param  {String} output
 * @return {String}
 */
parsers.syncErr = function(output) {
  var result = output.split('\r\n');

  for (var i = 0; i < result.length; i++) {
    if (!result[i].length) {
      result.splice(i, 1);
    }
  }

  return result;
};

/**
 * Output handler for GIT success messages from GIT push and pull commands
 * @param  {String} output
 * @return {String}
 */
parsers.syncSuccess = function(output) {
  return output;
};

/**
 * Export Contructor
 * @constructor
 * @type {Object}
 */
module.exports = parsers;
