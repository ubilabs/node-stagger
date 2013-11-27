/* global describe, it, beforeEach */

var assert = require('assert'),
  Stagger = require('../lib/stagger'),
  stagger,
  batch = [],
  longBatch = [],
  i,
  staggerDefaults = {
  options: Stagger.options,
  stackIndex: -1,
  responseCount: 0,
  currentRequests: 0,
  stack: []
};

function immediate(i) {
  return function(callback) {
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

describe('new Stagger()', function() {

  beforeEach(function() {
    stagger = new Stagger();
  });

  it('should have options', function() {
    assert.deepEqual(stagger, staggerDefaults);
  });

  it('should inherit from event emitter', function(done) {
    stagger.on('foo', done);
    stagger.emit('foo');
  });
});

describe('new Stagger(options)', function() {

  it('should have extended options', function() {
    staggerDefaults.options.extendedOption = true;

    var extendedStagger = new Stagger({'extendedOption': true});
    assert.deepEqual(extendedStagger, staggerDefaults);
  });

});

describe('Stagger', function() {

  beforeEach(function() {
    stagger = new Stagger();
  });

  describe('push(function)', function() {
    it('should add one to the stagger', function() {
      stagger.push(immediate('one'));
      assert.equal(1, stagger.stack.length);
    });
  });

  describe('push(array)', function() {
    it('should add an array to the stagger', function() {
      stagger.push(batch);
      assert.equal(32, stagger.stack.length);
    });
  });

  describe('start()', function() {
    it('should set interval', function() {
      stagger.push(batch);
      stagger.start();
      assert.ok(stagger.interval);
    });
  });

  describe('stop()', function() {
    it('should clear interval', function() {
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
  });

  describe('progress()', function() {
    it('should emit progress event', function(done) {

      function onProgess() {
        stagger.finish();

        stagger.removeListener('progress', onProgess);
        done();
      }

      stagger.on('progress', onProgess);

      stagger.push(batch);
      stagger.start();
    });


    it('should emit batch.length progress event', function(done) {
      this.timeout(0);
      var progressCount = 0;

      stagger.on('progress', function() {
        progressCount++;
      });

      stagger.on('finish', function() {

        if (progressCount == longBatch.length) {
          done();
        }

      });

      stagger.push(longBatch);
      stagger.start();

    });
  });
});
