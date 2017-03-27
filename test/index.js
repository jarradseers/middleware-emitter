/*!
 * Middleware Emitter.
 *
 * Main test file.
 * @created 27/03/2017 NZDT
 */

'use strict';

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

let expectedRes1 = { ctx: { one: true, two: true } };
let expectedReq1 = { ctx: { hello: 'world', three: true }, event: { name: 'test' } };

emitter.on([ 'test', 'hello' ], (req, res, next) => {
  res.ctx.one = true;
  next();
}, (req, res, next) => {
  res.ctx.two = true;
  next()
}, {
  three: true
}, (req, res, next) => {
  next(new Error('Custom Error.'));
}, (req, res, next, err) => {
  assert.strictEqual(err.message, 'Custom Error.') || total ++;
  next();
}, (req, res) => {
  assert.deepEqual(req, expectedReq1) || total ++;
  assert.deepEqual(res, expectedRes1) || total ++;
});

emitter.emit([ 'test' ], { hello: 'world' });

expectedReq1 = { event: { name: 'hello' }, ctx: { three: true } };

emitter.emit('hello');

let events = [ 't1', 't2', 't3', 't4', 't5' ];

emitter.on(events, (req, res, next) => {
  assert.ok(events.includes(req.event.name)) || total ++;
});

emitter.emit(events);

console.log(`All ${total} of ${total} tests have passed.`);
