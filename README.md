# node-stagger

Execute a stack with a given 'request-per-seconds' and 'max-requests' rate.

### Usage

```js
var stagger = new Stagger(options);
stagger.push(methods);
stagger.start();
stagger.on("progress", handleResponse);
stagger.on("finish", handleDone);
```

### Options

* `requestsPerSecond` - Number of requests per seconds. Default: 10
* `maxRequests` - Maximum open requests. Default: 20

### Events

"progress" Event:

* `index` - initial stack index
* `pending` - number of pending calls
* `total` - total call count
* `current` - current batch size
* `percent` - current percentage
* `eta` - estimated total duration
* `callback` - original callback
* `value` - returned value
* `duration` - response time

"complete" Event:

* `total` - total call count
* `duration` - total duration

### Example

```js
var Stagger = require("../lib/stagger"),
  stagger = new Stagger();

for (var i=0; i<100; i++){
  stagger.push(callback);
}

stagger.on("progress", function(event){
  console.log(event.value);
});

stagger.on("finish", function(event){
  console.log("finish", event.duration);
});

stagger.start();
```

### Author

Martin Kleppe - kleppe@ubilabs.net