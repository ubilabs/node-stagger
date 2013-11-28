var events = require('events'),
  util = require('util');

function extend(a, b) {
  for (var key in b) {
    if (b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }

  return a;
}

/**
 * Stagger Class
 * @param {object} [options] - `requestsPerSecond: 10`, `maxRequests: 20`
 * @extends {EventEmitter}
 */

function Stagger(options) {
  this.options = extend({}, Stagger.options);
  this.options = extend(this.options, options || {});

  this.stackIndex = -1;
  this.responseCount = 0;
  this.currentRequests = 0;
  this.stack = [];

  events.EventEmitter.call(this);
}

util.inherits(Stagger, events.EventEmitter);

Stagger.options = {
  requestsPerSecond: 10,
  maxRequests: 20
};

/**
 * Add new methods to the call stack.
 * @param  {function|array} method – One or more methods to add.
 */
Stagger.prototype.push = function(method) {
  this.stack = this.stack.concat(method);
};

/**
 * Execute the next call. Used internally only.
 */
Stagger.prototype.next = function() {
  if (this.currentRequests >= this.options.maxRequests) { return; }

  if (this.stackIndex < this.stack.length) {
    this.stackIndex++;
  }

  if (this.stackIndex == this.stack.length) {
    this.stop();
    return;
  }

  var time = new Date(),
    index = this.stackIndex,
    callback = this.stack[index],
    called = false;

  this.currentRequests++;

  callback(function(value) {

    if (called) {
      throw new Error('This callback was called twice. At least!');
    }

    this.currentRequests--;

    this.respond({
      time: time,
      index: index,
      callback: callback,
      value: value
    });

    called = true;
  }.bind(this));
};

/**
 * Handle response of a previous call. Used internally only.
 * @param  {object} response - The response to analyse.
 */
Stagger.prototype.respond = function(response) {

  this.responseCount++;

  var now = new Date(),
    duration = now - response.time,
    pending = this.stack.length - this.responseCount,
    ratio = this.responseCount / this.stack.length;

  this.emit('progress', {
    index: response.index, // initial stack index
    pending: pending, // number of pending calls
    total: this.stack.length, // total call count
    current: this.currentRequests, // current batch size
    percent: ratio * 100, // current percentage
    eta: Math.round((now - this.startTime) / ratio), // estimated total duration
    callback: response.callback, // original callback
    value: response.value, // returned value
    duration: duration // response time
  });

  if (this.responseCount == this.stack.length) {
    this.finish();
  }
};

/**
 * Execute the call stack.
 * @return {[type]} [description]
 */
Stagger.prototype.start = function() {
  this.startTime = new Date();
  if (this.interval) {
    clearInterval(this.interval);
  }

  this.interval = setInterval(
    this.next.bind(this),
    1000 / this.options.requestsPerSecond
  );
};

/**
 * Stop the call stack execution.
 */
Stagger.prototype.stop = function() {
  clearInterval(this.interval);
  this.interval = null;
};

/**
 * Stop the call stack execution.
 */
Stagger.prototype.finish = function() {
  this.emit('finish', {
    total: this.stack.length,
    duration: new Date() - this.startTime
  });
};

module.exports = Stagger;
