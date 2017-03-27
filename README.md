# Middleware Emitter

  Use middleware to chain your event logic, compatible with express middleware (and possibly others).  This allows you to not only break up logic for when an event is fired, but let's you share middleware between frameworks if necessary.

  The middleware-emitter project also brings multiple event triggering and capturing.

  _req_ The req is the 'request', the `req.ctx` is the context on the request, it's used to build up the state throughout the middleware.

  _res_ The res is the 'response', the `res.ctx` is the context on the response, it's used to build up the output to be used later on.

  You can think of the two like this - req = internal (chain only, imagine storing all data for calculation), res = external, when you are at the end of the chain - it's this object that you will want to use for display.

## Usage

Assuming you have broken up your middleware functions:

```js
const emitter = require('middleware-emitter');
const app = require('./middleware/app');

emitter.on('hello', app.load, app.hello, app.handleError);

emitter.emit('hello');
```

## Installation

```bash
$ npm install middleware-emitter
```

## Features

  * Create an event middleware chain.
  * Inject middleware functions or objects.
  * Build up the res.ctx chain for output.
  * Build up the req.ctx chain for internal chain state.
  * Listen to multiple events on the same chain.
  * Emit multiple events at once.
  * Simple, fast, light-weight.
  * Written in ES6+ for node.js 6+.
  * Test driven.

## Options

  MiddlewareEmitter extends the base EventEmitter class, therefore all standard options apply.

## Examples

A simple standalone example:

```js
const emitter = require('middleware-emitter');

emitter.on('hello', (req, res, next) => {
  res.ctx.hello = 'world';
  next();
}, (req, res) => {
  console.log(res.ctx); // { hello: 'world' }
});

emitter.emit('hello');
```

Listen / emit multiple events:

```js
emitter.on([ 'hello', 'other', 'test' ], (req, res, next) => {
  console.log(req.event.name);
});

emitter.emit([ 'hello', 'other', 'test' ]);

// hello
// other
// test
```

Inject data into the req (request) context:

```js
emitter.on('inject', { hello: 'world' }, (req, res, next) => {
  console.log(req.ctx);
});

emitter.emit('inject', { some: 'data' });

// { some: 'data', hello: 'world' }
```

Check out the [test folder](test) for more!

## Tests

  From the package 

  ```bash
  $ npm test
  ```

## License

  [MIT](LICENSE)