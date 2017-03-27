/*!
 * Middleware Emitter.
 *
 * Middleware Emitter Class.
 * @created 27/03/2017 NZDT
 */

'use strict';

/**
 * Module dependencies.
 */

const EventEmitter = require('events');
const merge = require('object-merger');

/**
 * MiddlewareEmitter class.
 *
 * @class MiddlewareEmitter
 * @extends {EventEmitter}
 */

class MiddlewareEmitter extends EventEmitter {

  /**
   * Creates an instance of MiddlewareEmitter.
   *
   * @param {object} options emitter options.
   * 
   * @memberOf MiddlewareEmitter
   */

  constructor(options) {
    super(options);
    this.options = options;
  }

  /**
   * Add event listener.
   *
   * @param {string} type event method type to call on super ('on' or 'once').
   * @param {array} chain array of middleware functions.
   *
   * @memberOf MiddlewareEmitter
   */

  add(type, chain) {
    const req = {};
    const res = {};

    req.ctx = {};
    res.ctx = {};

    req.event = {};

    const name = req.event.name = chain.shift();
    let error = chain.find(c => c.length > 3);

    /**
     * Next function.
     * 
     * @param {any} err 
     * @returns 
     */

    const next = (err) => {
      if (err instanceof Error) {
        error = chain.find(c => c.length > 3) || error;
        if (error) return error.call(this, req, res, next, err);
        else throw err;
      }

      const fn = chain.shift();

      if (fn instanceof Function) {
        if (fn.length > 3) return next.call(this, req, res, next);
        fn.call(this, req, res, next);
      } else if (fn instanceof Object) {
        req.ctx = merge(req.ctx, fn);
        return next.call(this, req, res, next);
      }
    };

    super[type](req.event.name, (data) => {
      req.ctx = merge(req.ctx, data);
      next.call(this);
    });

    return this;
  }

  /**
   * On event.
   *
   * @param {any} arguments0 event name / array of event names.
   * @param {function} arguments middleware functions.
   *
   * @memberOf MiddlewareEmitter
   */

  on() {
    const args = [ ...arguments ];
    let events = args.shift();

    events = Array.isArray(events) ? events : [ events ];

    events.forEach(event => {
      this.add.call(this, 'on', [event].concat(args))
    });

    return this;
  }

  /**
   * Trigger event once.
   *
   * @param {string} arguments0 event name.
   * @param {function} arguments middleware functions.
   *
   * @memberOf MiddlewareEmitter
   */

  once() {
    this.add.call(this, 'once', [ ...arguments ]);
    return this;
  }

  /**
   * Fire events.
   *
   * @param {any} arguments0 event name or array of event names.
   * @param {function} arguments middleware functions.
   *
   * @memberOf MiddlewareEmitter
   */

  emit() {
    const args = [ ...arguments ];
    let events = args.shift();

    events = Array.isArray(events) ? events : [ events ];

    events.forEach(event => {
      super.emit.apply(this, [event].concat(args));
    });

    return this;
  }

}

/**
 * Module exports.
 */

module.exports = MiddlewareEmitter;
