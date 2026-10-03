# Middleware Emitter

[![CI](https://github.com/jarradseers/middleware-emitter/actions/workflows/ci.yml/badge.svg)](https://github.com/jarradseers/middleware-emitter/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/middleware-emitter.svg)](https://www.npmjs.com/package/middleware-emitter)

An `EventEmitter` whose listeners are middleware chains. Break the logic for an event into small `(req, res, next)` functions, the same shape as express middleware, and share them between events.

It also lets you listen to, and emit, several events at once.

## Installation

```bash
$ npm install middleware-emitter
```

## Usage

```js
const MiddlewareEmitter = require('middleware-emitter');

const emitter = new MiddlewareEmitter();

emitter.on('hello',

  (req, res, next) => {
    res.ctx.hello = 'world';
    next();
  },

  (req, res) => {
    console.log(res.ctx); // { hello: 'world' }
  })

  .emit('hello');
```

Each emit runs the chain from the start with a fresh `req` and `res`:

- `req.ctx` is the request context: the data passed to `emit`, plus any objects in the chain. Use it for state the chain needs internally.
- `res.ctx` is the response context: build up the output here.
- `req.event.name` is the name of the event that fired.
- `next()` moves on to the next middleware. A middleware that does not call it ends the chain.

Inside a middleware declared with `function`, `this` is the emitter.

## API

`MiddlewareEmitter` extends Node's [EventEmitter](https://nodejs.org/api/events.html), and its constructor takes the same options.

| Method | Description |
|---|---|
| `on(events, ...chain)` | Run the chain every time an event fires. `events` is a name or an array of names. |
| `once(events, ...chain)` | The same, for the first time each event fires only. |
| `emit(events, data)` | Fire a name or an array of names. `data` is an object, merged into `req.ctx`. |

All three return the emitter, so calls can be chained. Note that `emit` therefore does not return a boolean as it does on `EventEmitter`.

A chain can hold middleware functions, error handlers, plain objects, and arrays of any of those.

The other `EventEmitter` methods are untouched. `removeAllListeners` and `listenerCount` work as usual; `off` and `removeListener` cannot remove a chain, because the chain is wrapped in a single listener.

## Examples

Listen to and emit several events:

```js
emitter.on(['hello', 'other', 'test'],

  (req) => {
    console.log(req.event.name);
  })

  .emit(['hello', 'other', 'test']);

// hello
// other
// test
```

Inject data into the request context:

```js
emitter.on('inject',

  { hello: 'world' },

  (req) => {
    console.log(req.ctx);
  })

  .emit('inject', { some: 'data' });

// { some: 'data', hello: 'world' }
```

Handle errors with a function that takes a fourth `err` parameter:

```js
emitter.on('ohno',

  (req, res, next) => {
    next(new Error('Oh no, something went wrong...'));
  },

  (req, res, next, err) => {
    console.error(err.message);
    next();
  },

  () => {
    console.log('But we continued anyway.');
  })

  .emit('ohno');

// Oh no, something went wrong...
// But we continued anyway.
```

When an error is passed to `next`, the next error handler in the chain is called. If there is none later in the chain, the most recently found one is used, and if the chain has no error handler the error is thrown. Error handlers are skipped when there is no error.

## Tests

```bash
$ npm install
$ npm test
```

## License

[MIT](LICENSE)
