try {
  var EventEmitter = require('events').EventEmitter;
} catch (err) {
  var Emitter = require('emitter');
}


function Stagger(options) {
  if (options && options.requestsPerSecond){
    this.requestsPerSecond = options.requestsPerSecond;
  } else {
    this.requestsPerSecond = Stagger.options.requestsPerSecond;
  }
  this.index = -1;
  this.count = 0;
  this.current = 0;
  this.queque = [];
}

/**
 * Inherit from `EventEmitter.prototype`.
 */

if (EventEmitter) {
  Stagger.prototype.__proto__ = EventEmitter.prototype;
} else {
  Emitter(Stagger.prototype);
}

Stagger.options = {
  requestsPerSecond: 10
};

Stagger.prototype.push = function(method){
  if (typeof method == "function"){
    this.queque.push(method);
  } else if (method.forEach){
    method.forEach(this.queque.push);
  } else {
    throw new Error("'method' must be a function or an an array!");
  }
};

Stagger.prototype.next = function(){

  if (this.index < this.queque.length){
    this.index++;
  }

  if (this.index == this.queque.length){
    clearInterval(this.interval);
    return;
  }

  var time = new Date(),
    index = this.index,
    callback = this.queque[index];

  if (this.current > 10){ return; }

  this.current++;

  callback(function(error, response){

    this.current--;

    this.respond({
      time: time,
      index: index,
      callback: callback,
      error: error,
      response: response
    });

  }.bind(this));
};

Stagger.prototype.respond = function(response){
  var now = new Date(),
    duration = (now - response.time),
    wait = (1000 / this.requestsPerSecond) - duration;

  this.emit("progress", {
    index: response.index,
    total: this.queque.length,
    callback: response.callback,
    error: response.error,
    response: response,
    duration: now - this.startTime
  });

  this.count++;

  console.log(this.count, this.queque.length, this.current);

  if (this.count == this.queque.length){
    this.finish();
  }

};

Stagger.prototype.start = function(){
  this.startTime = new Date();
  var speed = 1000 / this.requestsPerSecond;

  console.log(speed);
  this.interval = setInterval(this.next.bind(this), speed);
};

Stagger.prototype.finish = function(){

  this.emit("finish", {
    total: this.queque.length,
    duration: new Date() - this.startTime
  });
};


// TESTS

var index = 0;

function delayedMethod(callback){

  var delay = Math.round(Math.random() * 1000) + 1000,
    id = ++index;

  setTimeout(function(){
    process.stdout.write(".");
    callback(null, 1);
  }, delay);
}

var stagger = new Stagger();

for (var i=0; i<100; i++){
  stagger.push(delayedMethod);
}

stagger.on("finish", function(event){
  console.log("finish", event.duration);
});

stagger.start();

console.log(stagger.requestsPerSecond);