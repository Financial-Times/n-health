/* global before, after, it, describe */
'use strict';
const expect = require('chai').expect;
const path = require('path');
const HealthChecks = require('../src/healthchecks');
const startup = require('../src/startup');

describe('Startup', function(){


	it('Should read in the config dir and create new healthcheck objects', function(){
		const result = startup(path.resolve(__dirname, 'fixtures/config/'));
		expect(result.get('paywall')).to.exist;
		expect(result.get('paywall')).to.be.an.instanceOf(HealthChecks);
	});

	// TODO: Remove after Ops Cops confirmed the failing nightly build notification was sent
	// This test was added for this ops cops ticket => https://financialtimes.atlassian.net/browse/NOPS-388
	it('This test is a part of ops cops expriment. It should fail.', function(){
		expect(false).to.be.true;
	});

});
