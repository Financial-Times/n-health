/* global before, after, it, describe */
'use strict';
const expect = require('chai').expect;
const path = require('path');
const HealthChecks = require('../src/healthchecks');
const startup = require('../src/startup');

// We set this so that the tests don't immediately fail due to a missing environment variable.
// n-gage used to provide the environment variables locally via dotenv and the tests were written
// assuming that it'd be present.
process.env.FT_GRAPHITE_KEY = 'mock-graphite-key';

describe('Startup', function(){


	it('Should read in the config dir and create new healthcheck objects', function(){
		const result = startup(path.resolve(__dirname, 'fixtures/config/'));
		expect(result.get('sourcemap')).not.to.exist;
		expect(result.get('paywall')).to.exist;
		expect(result.get('paywall')).to.be.an.instanceOf(HealthChecks);
	});

});
