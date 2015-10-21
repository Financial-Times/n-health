'use strict';

require('isomorphic-fetch');
// require('promise.prototype.finally');

require('./startup.spec');
require('./healthchecks.spec');
require('./responseCompare.check.spec');
require('./pingdom.check.spec');
require('./json.check.spec');
require('./graphiteSpike.check.spec');
require('./aggregate.check.spec');
