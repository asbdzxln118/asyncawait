﻿import references = require('references');
import asyncBase = require('./impl/asyncBase');
import StreamProtocol = require('./impl/protocols/stream');
export = async;


var async = asyncBase.mod({ protocol: StreamProtocol });