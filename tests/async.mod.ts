﻿import references = require('references');
import chai = require('chai');
import Promise = require('bluebird');
import async = require('asyncawait/async');
import await = require('asyncawait/await');
var expect = chai.expect;


var testMod = {
    overrideProtocol: (base, options) => {
        var prefix = options.prefix || '';
        var suffix = options.suffix || '';
        return {
            return: (co, result) => base.return(co, prefix + result + suffix),
            throw: (co, error) => base.throw(co, new Error(prefix + error.message + suffix))
        };
    }
};

//TODO: add a few more tests here covering the various expectations of mods


describe('async.mod(...)', () => {

    it('returns a new async function defaulting to the same protocol', done => {
        var a2 = async.mod({});
        expect(a2).to.exist;
        expect(a2).to.not.equal(async);
        var fn = a2((n: number) => 111 * n);
        fn(7)
        .then(r => expect(r).to.equal(777))
        .then(() => done())
        .catch(done);
    });

    it('returns an async function that uses the specified protocol', done => {
        var asyncX = async.mod(testMod);
        var fn = asyncX (msg => msg);
        fn('BLAH!')
        .then(r => expect(r).to.equal('BLAH!'))
        .then(() => done())
        .catch(done);
    });

    //TODO: review this test... awkward way to just pass some options!
    it('returns an async function that uses the specified protocol options', done => {
        var asyncX = async.mod(testMod).mod({ defaultOptions: { prefix: '<<<', suffix: '>>>' }});
        var fn = asyncX (msg => msg);
        fn('BLAH!')
        .then(r => expect(r).to.equal('<<<BLAH!>>>'))
        .then(() => done())
        .catch(done);
    });
});