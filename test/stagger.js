/* global describe, it, beforeEach, afterEach */

var assert = require('assert'),
  Stagger = require('../lib/stagger'),
  stagger,
  batch = [],
  longBatch = [],
  i,
  called,
  staggerDefaults;

function immediate(i) {
  return function(callback) {
    called = true;
    callback(i);
  };
}

function doubleCallback(i) {
  return function(callback) {
    callback(i);
    callback(i);
  };
}

function longRunning(i) {
  var delay = Math.round(Math.random() * 1000) + 1000;

  return function(callback) {
    setTimeout(function() {
      callback(i);
    }, delay);
  };
}

for (i = 0; i < 32; i++) {
  batch.push(immediate(i));
}

for (i = 0; i < 32; i++) {
  longBatch.push(longRunning(i));
}

beforeEach(function() {
  called = false,
  staggerDefaults = {
    options: Stagger.options,
    stackIndex: -1,
    responseCount: 0,
    currentRequests: 0,
    stack: []
  };
});

describe('new Stagger()', function() {

  beforeEach(function() {
    stagger = new Stagger();
  });

  it('should inherit from event emitter', function(done) {
    stagger.on('foo', done);
    stagger.emit('foo');
  });

  it('should have options', function() {
    assert.deepEqual(stagger.options, staggerDefaults.options);
  });

});

describe('new Stagger(options)', function() {

  it('should have extended options', function() {

    var stagger = new Stagger({'extendedOption': true});
    assert(stagger.options.extendedOption);
  });

});

describe('Stagger', function() {

  beforeEach(function() {
    stagger = new Stagger();
  });

  describe('push(function)', function() {
    it('should add one to the stagger', function() {
      stagger.push(immediate(1));
      assert.equal(1, stagger.stack.length);
      assert(typeof stagger.stack[0] == 'function');
    });
  });

  describe('push(array)', function() {
    it('should add an array to the stagger', function() {
      stagger.push(batch);
      assert.equal(32, stagger.stack.length);
      assert(typeof stagger.stack[0] == 'function');
      assert(typeof stagger.stack[31] == 'function');
    });
  });

  describe('start()', function() {
    it('should set startTime', function() {
      stagger.start();
      assert(stagger.startTime);
    });

    it('should set interval', function() {
      stagger.start();
      assert.ok(stagger.interval);
    });
  });

  describe('stop()', function() {
    it('should clear interval', function() {
      stagger.start();
      assert.ok(stagger.interval);
      stagger.stop();
      assert.ok(!stagger.interval);
    });
  });

  describe('finish()', function() {

    it('should emit finish event', function(done) {
      stagger.on('finish', function() {
        done();
      });

      stagger.finish();
    });

    it('should send statistics', function(done) {
      stagger.start();

      stagger.on('finish', function(data) {
        if (data) {
          done();
        }
      });

      stagger.finish();
    });
  });

  describe('respond()', function() {
    it('should emit progress event', function(done) {

      function onProgess() {
        stagger.finish();

        stagger.removeListener('progress', onProgess);
        done();
      }

      stagger.on('progress', onProgess);

      stagger.push(immediate(1));
      stagger.start();
    });


    it('should emit ' + batch.length + ' (batch.length) progress events', function(done) {
      this.timeout(10000);
      var progressCount = 0;

      stagger.on('progress', function() {
        progressCount++;
      });

      stagger.on('finish', function() {
        if (progressCount == batch.length) {
          done();
        }
      });

      stagger.push(batch);
      stagger.start();
    });

    it('should only call the callback once', function() {

      stagger.push(doubleCallback(1));

      function callDouble() {
        stagger.next();
      }

      assert.throws(
        callDouble,
        Error
      );
    });
  });

  describe('next()', function() {

    it('should add 1 to the stackIndex', function() {
      var index = stagger.stackIndex;
      stagger.next();
      assert.equal(index + 1, stagger.stackIndex);
    });

    it('should call the callback', function() {
      stagger.push(immediate());
      stagger.next();

      assert(called);
    });

    it('should emit progess after callback', function(done) {

      function onProgess() {
        stagger.finish();

        stagger.removeListener('progress', onProgess);
        done();
      }

      stagger.on('progress', onProgess);

      stagger.push(immediate());
      stagger.next();
    });

  });
});
