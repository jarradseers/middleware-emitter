/*!
 * Middleware Emitter.
 *
 * Test entry.
 * @author Jarrad Seers <jarrad@seers.me>
 * @created 27/03/2017 NZDT
 */

/**
 * Module dependencies.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('events');
const MiddlewareEmitter = require('../');

test('is an EventEmitter', () => {
  assert.ok(new MiddlewareEmitter() instanceof EventEmitter);
});

test('runs the chain in order, building up res.ctx', () => {
  const emitter = new MiddlewareEmitter();
  let out;

  emitter.on('hello', (req, res, next) => {
    res.ctx.one = true;
    next();
  }, (req, res, next) => {
    res.ctx.two = true;
    next();
  }, (req, res) => {
    out = res.ctx;
  }).emit('hello');

  assert.deepEqual(out, { one: true, two: true });
});

test('stops when a middleware does not call next', () => {
  const emitter = new MiddlewareEmitter();
  let reached = false;

  emitter.on('stop', () => {}, () => {
    reached = true;
  }).emit('stop');

  assert.equal(reached, false);
});

test('runs the whole chain on every emit, with a fresh context each time', () => {
  const emitter = new MiddlewareEmitter();
  const seen = [];

  emitter.on('count', (req, res, next) => {
    res.ctx.calls = (res.ctx.calls || 0) + 1;
    next();
  }, (req, res) => {
    seen.push({ n: req.ctx.n, calls: res.ctx.calls });
  });

  emitter.emit('count', { n: 1 });
  emitter.emit('count', { n: 2 });
  emitter.emit('count');

  assert.deepEqual(seen, [
    { n: 1, calls: 1 },
    { n: 2, calls: 1 },
    { n: undefined, calls: 1 }
  ]);
});

test('merges emitted data and chain objects into req.ctx', () => {
  const emitter = new MiddlewareEmitter();
  let ctx;

  emitter.on('inject', { hello: 'world' }, (req) => {
    ctx = req.ctx;
  }).emit('inject', { some: 'data' });

  assert.deepEqual(ctx, { some: 'data', hello: 'world' });
});

test('does not modify the emitted data', () => {
  const emitter = new MiddlewareEmitter();
  const data = { nested: { a: 1 } };

  emitter.on('copy', (req) => {
    req.ctx.nested.a = 2;
  }).emit('copy', data);

  assert.deepEqual(data, { nested: { a: 1 } });
});

test('sets req.event.name', () => {
  const emitter = new MiddlewareEmitter();
  let name;

  emitter.on('named', (req) => {
    name = req.event.name;
  }).emit('named');

  assert.equal(name, 'named');
});

test('calls middleware with the emitter as this', () => {
  const emitter = new MiddlewareEmitter();
  let self;

  emitter.on('this', function middleware() {
    self = this;
  }).emit('this');

  assert.equal(self, emitter);
});

test('listens to and emits several events at once', () => {
  const emitter = new MiddlewareEmitter();
  const events = ['t1', 't2', 't3'];
  const seen = [];

  emitter.on(events, (req) => {
    seen.push(`${req.event.name}:${req.ctx.some}`);
  }).emit(events, { some: 'data' });

  assert.deepEqual(seen, ['t1:data', 't2:data', 't3:data']);
});

test('accepts arrays of middleware', () => {
  const emitter = new MiddlewareEmitter();
  const seen = [];
  const step = (name) => (req, res, next) => {
    seen.push(name);
    next();
  };

  emitter.on('arrays', [step('one'), step('two')], step('three')).emit('arrays');

  assert.deepEqual(seen, ['one', 'two', 'three']);
});

test('works with asynchronous middleware', async () => {
  const emitter = new MiddlewareEmitter();

  const out = await new Promise((resolve) => {
    emitter.on('async', (req, res, next) => {
      setImmediate(() => {
        res.ctx.waited = true;
        next();
      });
    }, (req, res) => resolve(res.ctx)).emit('async');
  });

  assert.deepEqual(out, { waited: true });
});

test('hands an error to the next error handler, then carries on', () => {
  const emitter = new MiddlewareEmitter();
  const seen = [];

  emitter.on('errors', (req, res, next) => {
    next(new Error('Custom error 1'));
  }, (req, res, next, err) => {
    seen.push(err.message);
    next();
  }, (req, res, next) => {
    next(new Error('Custom error 2'));
  }, (req, res, next, err) => {
    seen.push(err.message);
    next();
  }, () => {
    seen.push('end');
  }).emit('errors');

  assert.deepEqual(seen, ['Custom error 1', 'Custom error 2', 'end']);
});

test('skips error handlers when there is no error', () => {
  const emitter = new MiddlewareEmitter();
  const seen = [];

  emitter.on('skip', (req, res, next) => {
    seen.push('one');
    next();
  }, (req, res, next, err) => {
    seen.push(err);
  }, () => {
    seen.push('two');
  }).emit('skip');

  assert.deepEqual(seen, ['one', 'two']);
});

test('falls back to an earlier error handler when there is none later', () => {
  const emitter = new MiddlewareEmitter();
  let message;

  emitter.on('fallback', (req, res, next, err) => {
    message = err.message;
  }, (req, res, next) => {
    next(new Error('Custom error'));
  }).emit('fallback');

  assert.equal(message, 'Custom error');
});

test('throws the error when there is no error handler', () => {
  const emitter = new MiddlewareEmitter();

  emitter.on('unhandled', (req, res, next) => {
    next(new Error('Nobody caught this'));
  });

  assert.throws(() => emitter.emit('unhandled'), /Nobody caught this/);
});

test('once runs the chain for the first emit only', () => {
  const emitter = new MiddlewareEmitter();
  let calls = 0;

  emitter.once('single', (req, res, next) => {
    next();
  }, () => {
    calls++;
  });

  emitter.emit('single').emit('single');

  assert.equal(calls, 1);
});

test('once accepts several events', () => {
  const emitter = new MiddlewareEmitter();
  const seen = [];

  emitter.once(['a', 'b'], (req) => {
    seen.push(req.event.name);
  });

  emitter.emit(['a', 'b', 'a', 'b']);

  assert.deepEqual(seen, ['a', 'b']);
});

test('once still accepts a single [event, ...chain] array', () => {
  const emitter = new MiddlewareEmitter();
  let calls = 0;

  emitter.once(['legacy', () => {
    calls++;
  }]);

  emitter.emit('legacy').emit('legacy');

  assert.equal(calls, 1);
});

test('on, once and emit return the emitter for chaining', () => {
  const emitter = new MiddlewareEmitter();

  assert.equal(emitter.on('x', () => {}), emitter);
  assert.equal(emitter.once('x', () => {}), emitter);
  assert.equal(emitter.emit('x'), emitter);
  assert.equal(emitter.emit('nobody-listening'), emitter);
});

test('removeAllListeners and listenerCount work as on EventEmitter', () => {
  const emitter = new MiddlewareEmitter();
  let calls = 0;

  emitter.on('gone', () => {
    calls++;
  });

  assert.equal(emitter.listenerCount('gone'), 1);
  emitter.removeAllListeners('gone');
  emitter.emit('gone');

  assert.equal(calls, 0);
});
