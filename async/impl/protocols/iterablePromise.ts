﻿import references = require('references');
import _ = require('lodash');
import Promise = require('bluebird');
import Protocol = require('./base');
export = IterablePromiseProtocol;


class IterablePromiseProtocol extends Protocol {
    constructor() { super(); }

    invoke(func: Function, this_: any, args: any[]): any {
        super.invoke(func, this_, args);
        return new AsyncIterator(this);
    }

    invokeNext() {
        var res = this.nextResolver = Promise.defer<any>();
        setImmediate(() => this.done ? res.reject(new Error('iterated past end')) : this.resume());
        return this.nextResolver.promise;
    }

    return(result) {
        this.done = true;
        this.nextResolver.resolve({ done: true, value: result });
    }

    throw(error) {
        this.nextResolver.reject(error);
    }

    yield(value) {
        var result = { done: false, value: value };
        this.nextResolver.resolve(result);
        this.suspend();
    }

    static SuspendableType: AsyncAwait.AsyncIterablePromise;

    private nextResolver: Promise.Resolver<any> = null;
    private done: boolean;
}


class AsyncIterator {

    constructor(private iterable: IterablePromiseProtocol) { }

    next() {
        return this.iterable.invokeNext();
    }

    forEach(callback: (value) => void) {

        // Ensure that a single argument has been supplied, which is a function.
        if (arguments.length !== 1) throw new Error('forEach(): expected a single argument');
        if (!_.isFunction(callback)) throw new Error('forEach(): expected argument to be a function');

        var result = Promise.defer<void>();
        var stepNext = () => this.next().then(stepResolved, err => result.reject(err));
        var stepResolved = item => {
            if (item.done) return result.resolve(item.value);
            callback(item.value);
            setImmediate(stepNext);
        }
        stepNext();
        return result.promise;
    }
}