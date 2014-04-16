﻿var Fiber = require('fibers');
var Promise = require('bluebird');
var _ = require('lodash');
var Config = require('./config');
var FiberMgr = require('./fiberManager');
var RunContext = require('./runContext');
var Semaphore = require('./semaphore');
var AsyncIterator = require('./asyncIterator');

/** Function for creating a specific variant of the async function. */
function makeAsyncFunc(config) {
    // Validate the specified configuration
    config.validate();

    // Create an async function tailored to the given options.
    var result = function (bodyFunc) {
        // Create a semaphore for limiting top-level concurrency, if specified in options.
        var semaphore = config.maxConcurrency ? new Semaphore(config.maxConcurrency) : Semaphore.unlimited;

        // Choose and run the appropriate function factory based on whether the result should be iterable.
        var makeFunc = config.isIterable ? makeAsyncIterator : makeAsyncNonIterator;
        var result = makeFunc(bodyFunc, config, semaphore);

        // Ensure the suspendable function's arity matches that of the function it wraps.
        var arity = bodyFunc.length;
        if (config.acceptsCallback)
            ++arity;
        result = makeFuncWithArity(result, arity);
        return result;
    };

    // Add the mod() function, and return the result.
    result.mod = makeModFunc(config);
    return result;
}

/** Function for creating iterable suspendable functions. */
function makeAsyncIterator(bodyFunc, config, semaphore) {
    // Return a function that returns an iterator.
    return function () {
        var _this = this;
        // Capture the initial arguments used to start the iterator, as an array.
        var startupArgs = new Array(arguments.length + 1);
        for (var i = 0, len = arguments.length; i < len; ++i)
            startupArgs[i + 1] = arguments[i];

        // Create a yield() function tailored for this iterator.
        var yield_ = function (expr) {
            //TODO: await expr first? YES if options.returnValue === ReturnValue.Result
            if (runContext.callback)
                runContext.callback(null, { value: expr, done: false });
            if (runContext.resolver)
                runContext.resolver.resolve({ value: expr, done: false });
            Fiber.yield();
        };

        // Insert the yield function as the first argument when starting the iterator.
        startupArgs[0] = yield_;

        // Configure the run context.
        var runContext = new RunContext(bodyFunc, this, startupArgs);
        if (config.returnValue === Config.PROMISE)
            runContext.resolver = Promise.defer(); // non-falsy sentinel for AsyncIterator.
        if (config.acceptsCallback)
            runContext.callback = function () {
            }; // non-falsy sentinel for AsyncIterator.

        // Create the iterator.
        var iterator = new AsyncIterator(runContext, semaphore);

        // Wrap the given bodyFunc to properly complete the iteration.
        runContext.wrapped = function () {
            var len = arguments.length, args = new Array(len);
            for (var i = 0; i < len; ++i)
                args[i] = arguments[i];
            bodyFunc.apply(_this, args);
            iterator.destroy();
            return { done: true };
        };

        // Return the iterator.
        return iterator;
    };
}

/** Function for creating non-iterable suspendable functions. */
function makeAsyncNonIterator(bodyFunc, config, semaphore) {
    // Return a function that executes fn in a fiber and returns a promise of fn's result.
    return function () {
        // Get all the arguments passed in, as an array.
        var argsAsArray = new Array(arguments.length);
        for (var i = 0; i < argsAsArray.length; ++i)
            argsAsArray[i] = arguments[i];

        // Remove concurrency restrictions for nested calls, to avoid race conditions.
        if (FiberMgr.isExecutingInFiber())
            this._semaphore = Semaphore.unlimited;

        // Configure the run context.
        var runContext = new RunContext(bodyFunc, this, argsAsArray, function () {
            return semaphore.leave();
        });
        if (config.returnValue === Config.PROMISE) {
            var resolver = Promise.defer();
            runContext.resolver = resolver;
        }
        if (config.acceptsCallback && argsAsArray.length && _.isFunction(argsAsArray[argsAsArray.length - 1])) {
            var callback = argsAsArray.pop();
            runContext.callback = callback;
        }

        // Execute bodyFunc to completion in a coroutine.
        semaphore.enter(function () {
            return FiberMgr.create().run(runContext);
        });

        // Return the appropriate value.
        return config.returnValue === Config.PROMISE ? resolver.promise : undefined;
    };
}

/** Returns a function that directly proxies the given function, whilst reporting the given arity. */
function makeFuncWithArity(fn, arity) {
    switch (arity) {
        case 0:
            return function () {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 1:
            return function (a) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 2:
            return function (a, b) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 3:
            return function (a, b, c) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 4:
            return function (a, b, c, d) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 5:
            return function (a, b, c, d, e) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 6:
            return function (a, b, c, d, e, f) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 7:
            return function (a, b, c, d, e, f, g) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 8:
            return function (a, b, c, d, e, f, g, h) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        case 9:
            return function (a, b, c, d, e, f, g, h, i) {
                var i, l = arguments.length, r = new Array(l);
                for (i = 0; i < l; ++i)
                    r[i] = arguments[i];
                return fn.apply(this, r);
            };
        default:
            return fn;
    }
}

function makeModFunc(config) {
    return function (options, maxConcurrency) {
        if (_.isString(options)) {
            var rt, cb, it;
            switch (options) {
                case 'returns: promise, callback: false, iterable: false':
                    rt = 'promise';
                    cb = false;
                    it = false;
                    break;
                case 'returns: thunk, callback: false, iterable: false':
                    rt = 'thunk';
                    cb = false;
                    it = false;
                    break;
                case 'returns: value, callback: false, iterable: false':
                    rt = 'value';
                    cb = false;
                    it = false;
                    break;
                case 'returns: promise, callback: true, iterable: false':
                    rt = 'promise';
                    cb = true;
                    it = false;
                    break;
                case 'returns: thunk, callback: true, iterable: false':
                    rt = 'thunk';
                    cb = true;
                    it = false;
                    break;
                case 'returns: value, callback: true, iterable: false':
                    rt = 'value';
                    cb = true;
                    it = false;
                    break;
                case 'returns: none, callback: true, iterable: false':
                    rt = 'none';
                    cb = true;
                    it = false;
                    break;
                case 'returns: promise, callback: false, iterable: true':
                    rt = 'promise';
                    cb = false;
                    it = true;
                    break;
                case 'returns: thunk, callback: false, iterable: true':
                    rt = 'thunk';
                    cb = false;
                    it = true;
                    break;
                case 'returns: value, callback: false, iterable: true':
                    rt = 'value';
                    cb = false;
                    it = true;
                    break;
                case 'returns: promise, callback: true, iterable: true':
                    rt = 'promise';
                    cb = true;
                    it = true;
                    break;
                case 'returns: thunk, callback: true, iterable: true':
                    rt = 'thunk';
                    cb = true;
                    it = true;
                    break;
                case 'returns: value, callback: true, iterable: true':
                    rt = 'value';
                    cb = true;
                    it = true;
                    break;
                case 'returns: none, callback: true, iterable: true':
                    rt = 'none';
                    cb = true;
                    it = true;
                    break;
            }
            options = { returnValue: rt, acceptsCallback: cb, isIterable: it, maxConcurrency: maxConcurrency };
        }
        var newConfig = new Config(_.defaults({}, options, config));
        return makeAsyncFunc(newConfig);
    };
}
module.exports = makeAsyncFunc;
//# sourceMappingURL=makeAsyncFunc.js.map