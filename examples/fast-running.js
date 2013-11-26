var Stagger = require('../lib/stagger'),
  stagger = new Stagger();

function fastRunning(i) {
  var delay = Math.random() * 100;

  return function(callback) {
    setTimeout(function() {
      callback(i);
    }, delay);
  };
}

for (var i = 0; i < 32; i++) {
  stagger.push(fastRunning(i));
}

stagger.on('finish', function(event) {
  console.log('finish', event.duration);
});

stagger.on('progress', function(event) {
  console.log(event.value, event.index);
});

stagger.start();
