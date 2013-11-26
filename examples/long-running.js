var Stagger = require('../lib/stagger'),
  stagger = new Stagger();

function longRunning(i) {
  var delay = Math.round(Math.random() * 1000) + 1000;

  return function(callback) {
    setTimeout(function() {
      callback(i);
    }, delay);
  };
}

for (var i = 0; i < 32; i++) {
  stagger.push(longRunning(i));
}

stagger.on('finish', function(event) {
  console.log('finish', event.duration);
});

stagger.on('progress', function(event) {
  console.log(event.value, event.index);
});

stagger.start();
