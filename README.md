# Gitty

[![Build Status](https://travis-ci.org/gordonwritescode/gitty.svg)](https://travis-ci.org/gordonwritescode/gitty)

Gitty is a Node.js wrapper for Git. It's syntax resembles the Git command line
syntax, executes common commands, and parses the output into operable objects.

## Installation

### Prerequisites

* Node.js 0.8.x (http://nodejs.org)
* Git 1.7.x.x (http://git-scm.com)
* GNU/Linux or Mac OSX

```
$ npm install gitty
```

1. Go to the App store and download the latest version of Xcode for free.
2. Install Xcode (the app store actually downloads the "installer" for Xcode)
3. Start Xcode
4. Go to Preferences
5. Go to Downloads
6. Click on the "install" button after "Command Line Tools"
7. Reboot

### Testing

Run the the unit and integration tests with:

```
$ npm test
```

## Usage

```js
var git    = require('gitty');
var myRepo = git('/path/to/repo');
```

Now you can call this instance of `Repository`'s methods. For example, to
execute `git log` for `myRepo`, you would do:

```javascript
myRepo.log(function(err, log) {
	if (err) return console.log('Error:', err);
	// ...
});
```

### Where are the Docs?

For now, use the source, Luke. Pretty much everything you'll need is in
`lib/repository.js` and it's very readable. Running the test suite will be of
use as well since all public methods are tested and will print to the console.

## Authenticated Repositories

Since OpenSSH does not read input from `stdin` for authentication, but rather a
psuedo-terminal - Gitty uses *pty.js* (<https://github.com/chjj/pty.js/>) to
spawn a pseudo-terminal for operations that may require authentication, such as
`pull`, `push`, and `clone`.

Credentials are always passed as the last argument before the callback and are
optional. Below is an example of an authenticated `Repository.push()`.

```javascript
myRepo.push('origin', 'master', {
	username: 'username',
	password: 'password'
}, function(err, succ) {
	if (err) return console.log(err);
	// ...
});
```

This format is consistent for all authenticated operations. Keep this in mind
if you are extending Gitty with an operation that requires authentication, and
be sure to read the pty.js documentation.

## Author

Gitty was written by Gordon Hall (gordon@gordonwritescode.com)  
Licensed under LGPLv3 license
