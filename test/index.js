/*!
 * Middleware Emitter.
 *
 * Main test file.
 * @created 27/03/2017 NZDT
 */


/**
 * Module dependencies.
 */

const assert = require('assert');
const MiddlewareEmitter = require('../');

const emitter = new MiddlewareEmitter({});

/**
 * Test.
 */

let total = 0;

const expectedRes1 = { ctx: { one: true, two: true } };
let expectedReq1 = { ctx: { hello: 'world', three: true }, event: { name: 'test' } };

emitter.on(['test', 'hello'],

(req, res, next) => {
  res.ctx.one = true;
  next();
},

(req, res, next) => {
  res.ctx.two = true;
  next();
},

{
  three: true
},

(req, res, next) => {
  next(new Error('Custom Error.'));
},

(req, res, next, err) => {
  assert.strictEqual(err.message, 'Custom Error.') || total++;
  next();
},

(req, res) => {
  assert.deepEqual(req, expectedReq1) || total++;
  assert.deepEqual(res, expectedRes1) || total++;
}).

emit(['test'], { hello: 'world' });

expectedReq1 = { event: { name: 'hello' }, ctx: { three: true } };

emitter.emit('hello');

const events = ['t1', 't2', 't3', 't4', 't5'];

emitter.on(events,

(req) => {
  assert.ok(events.includes(req.event.name)) || total++;
  assert.strictEqual(req.ctx.some, 'data') || total++;
}).

emit(events, { some: 'data' });

emitter.on('errors', (req, res, next) => {
  next(new Error('Custom error 1'));
}, (req, res, next, err) => {
  assert.strictEqual(err.message, 'Custom error 1') || total++;
  next();
}, (req, res, next) => {
  next(new Error('Custom error 2'));
}, (req, res, next, err) => {
  assert.strictEqual(err.message, 'Custom error 2') || total++;
}).emit('errors');

emitter.on('more-errors', (req, res, next, err) => {
  assert.strictEqual(err.message, 'Custom error') || total++;
}, (req, res, next) => {
  next(new Error('Custom error'));
}).emit('more-errors');

console.log(`All ${total} of ${total} tests have passed.`);
