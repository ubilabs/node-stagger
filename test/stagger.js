/* global describe, it, beforeEach */

var assert = require('assert'),
  Stagger = require('../lib/stagger'),
  stagger,
  staggerDefaults = {
    options: Stagger.options,
    stackIndex: -1,
    responseCount: 0,
    currentRequests: 0,
    stack: []
  };

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