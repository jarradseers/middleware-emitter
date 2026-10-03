/*!
 * Middleware Emitter.
 *
 * Middleware Emitter Class.
 * @author Jarrad Seers <jarrad@seers.me>
 * @created 27/03/2017 NZDT
 */

/**
 * Module dependencies.
 */

const EventEmitter = require('events');
const merge = require('object-merger');

/**
 * Is the chain item an error handler, a function taking (req, res, next, err).
 *
 * @param {any} fn chain item
 * @returns {boolean}
 */

const isErrorHandler = (fn) => typeof fn === 'function' && fn.length > 3;

/**
 * Wrap a single value in an array.
 *
 * @param {any} val value or array of values
 * @returns {array}
 */

const toArray = (val) => (Array.isArray(val) ? val : [val]);

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
   * @param {array} chain event name followed by the middleware chain.
   *
   * @memberOf MiddlewareEmitter
   */

  add(type, chain) {
    const [name, ...fns] = chain;

    super[type](name, (data) => {
      const req = { ctx: merge(data), event: { name } };
      const res = { ctx: {} };

      let index = 0;
      let error = fns.find(isErrorHandler);

      /**
       * Next function.
       *
       * @param {Error} err pass an error to hand over to the error handler.
       * @returns
       */

      const next = (err) => {
        if (err instanceof Error) {
          error = fns.slice(index).find(isErrorHandler) || error;
          if (error) return error.call(this, req, res, next, err);
          throw err;
        }

        while (index < fns.length) {
          const fn = fns[index++];

          if (isErrorHandler(fn)) continue;
          if (typeof fn === 'function') return fn.call(this, req, res, next);
          if (fn instanceof Object) req.ctx = merge(req.ctx, fn);
        }

        return this;
      };

      next();
    });

    return this;
  }

  /**
   * On event.
   *
   * @param {string|array} events event name / array of event names.
   * @param {...function|object} chain middleware functions and objects.
   *
   * @memberOf MiddlewareEmitter
   */

  on(events, ...chain) {
    toArray(events).forEach((event) => {
      this.add('on', [event].concat(...chain));
    });

    return this;
  }

  /**
   * On event, for the first time it fires only.
   *
   * @param {string|array} events event name / array of event names.
   * @param {...function|object} chain middleware functions and objects.
   *
   * @memberOf MiddlewareEmitter
   */

  once(events, ...chain) {
    // Earlier versions only accepted a single array of [event, ...chain].
    if (!chain.length && Array.isArray(events) && events.some((item) => typeof item !== 'string')) {
      return this.add('once', events);
    }

    toArray(events).forEach((event) => {
      this.add('once', [event].concat(...chain));
    });

    return this;
  }

  /**
   * Fire events.
   *
   * @param {string|array} events event name or array of event names.
   * @param {object} data merged into req.ctx for the chain.
   *
   * @memberOf MiddlewareEmitter
   */

  emit(events, ...args) {
    toArray(events).forEach((event) => {
      super.emit(event, ...args);
    });

    return this;
  }

}

/**
 * Module exports.
 */

module.exports = MiddlewareEmitter;
