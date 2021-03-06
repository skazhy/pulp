var fs = require("fs");
var glob = require("glob");
var path = require("path");


function readJson(fn) {
  try {
    return JSON.parse(fs.readFileSync(fn).toString());
  } catch (e) {
    return {};
  }
}
module.exports.readJson = readJson;

function SourceFileGlobSet(dirs) {
  if (!(this instanceof SourceFileGlobSet)) {
    return new SourceFileGlobSet(dirs);
  }

  this._dirs = dirs || [];
}
module.exports.SourceFileGlobSet = SourceFileGlobSet;

SourceFileGlobSet.prototype.union = function union(other) {
  var removeDuplicates = function(arr) {
    return arr.filter(function(elem, pos) {
      return arr.indexOf(elem) == pos;
    });
  };
  var dirsUnion = removeDuplicates(this._dirs.concat(other._dirs));
  return new SourceFileGlobSet(dirsUnion);
};

SourceFileGlobSet.prototype.sources = function sources() {
  return this._dirs.map(function(d) {
    return d + "/**/*.purs";
  });
};

SourceFileGlobSet.prototype.ffis = function ffis() {
  return this._dirs.map(function(d) {
    return d + "/**/*.js";
  });
};

function localGlobs(args) {
  return new SourceFileGlobSet([args.srcPath]);
}
module.exports.localGlobs = localGlobs;

function dependencyGlobs(args) {
  return new SourceFileGlobSet([path.join(args.dependencyPath, "purescript-*", "src")]);
}
module.exports.dependencyGlobs = dependencyGlobs;

function testGlobs(args) {
  return new SourceFileGlobSet([args.testPath]);
}
module.exports.testGlobs = testGlobs;

function defaultGlobs(args) {
  return localGlobs(args).union(dependencyGlobs(args));
}
module.exports.defaultGlobs = defaultGlobs;

function outputModules(buildPath) {
  return function(callback) {
    glob(buildPath + "/*/@(index.js|foreign.js)", {}, callback);
  };
}
module.exports.outputModules = outputModules;

function resolveGlobs(patterns, callback) {
  var fns = patterns.map(function(pattern) {
    return function(cb) {
      glob(pattern, {}, cb);
    };
  });

  resolve(fns, callback);
}
module.exports.resolveGlobs = resolveGlobs;

function resolve(fns, callback) {
  function it(acc, fns, callback) {
    if (!fns.length) {
      callback(null, acc);
    } else {
      fns[0](function(err, res) {
        if (err) {
          callback(err);
        } else {
          it(acc.concat(res), fns.slice(1), callback);
        }
      });
    }
  }
  it([], fns, callback);
}
module.exports.resolve = resolve;
