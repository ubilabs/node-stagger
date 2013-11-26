/* global describe, it, beforeEach */

var assert = require('assert'),
  Stagger = require('../lib/stagger'),
  stagger,
  batch = [],
  longBatch = [],
  i;

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
    it('should emit "finish event"', function(done) {
      stagger.on('finish', function() {
        done();
      });

      stagger.start();
      stagger.finish();
    });
  });

});
