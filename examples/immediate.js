var Stagger = require('../lib/stagger'),
  stagger = new Stagger();

function immediate(i) {
  return function(callback) {
    callback(i);
  };
}

for (var i = 0; i < 32; i++) {
  stagger.push(immediate(i));
}

stagger.on('finish', function(event) {
  console.log('finish', event.duration);
});

stagger.on('progress', function(event) {
  console.log(event.value, event.index);
});

stagger.start();
