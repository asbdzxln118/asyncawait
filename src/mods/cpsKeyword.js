﻿var assert = require('assert');
var _ = require('../util');


/**
* Creates a global property accessor with the given name, which calls
* await.cps.continuation(). This is purely for convenience and clarity
* for reading and writing async code.
*/
var cpsKeyword = {
    name: 'cpsKeyword',
    apply: function (options) {
        // Do nothing if the option is not selected.
        if (!options.cpsKeyword)
            return;

        // Ensure the symbol is not already defined
        assert(!global[options.cpsKeyword], 'cpsKeyword: identifier already exists on global object');

        // Define the global property accessor.
        _cpsKeyword = options.cpsKeyword;
        Object.defineProperty(global, _cpsKeyword, { get: _.createContinuation, configurable: true });

        // Return nothing, since we don't override the joint protocol here.
        return null;
    },
    reset: function () {
        if (_cpsKeyword)
            delete global[_cpsKeyword];
        _cpsKeyword = null;
    },
    defaultOptions: {
        cpsKeyword: null
    }
};

// Private keyword state.
//TODO: should this be global, in case multiple asyncawait instances are loaded in the process?
var _cpsKeyword = null;
module.exports = cpsKeyword;
//# sourceMappingURL=cpsKeyword.js.map
