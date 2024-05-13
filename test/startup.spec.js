'use strict';

const expect = require('chai').expect;
const path = require('path');
const HealthChecks = require('../src/healthchecks');
const startup = require('../src/startup');

describe('Startup', function () {
	it('Should read in the config dir and create new healthcheck objects', function () {
		const result = startup(path.resolve(__dirname, 'fixtures/config/'));
		expect(result.get('sourcemap')).not.to.exist;
		expect(result.get('paywall')).to.exist;
		expect(result.get('paywall')).to.be.an.instanceOf(HealthChecks);
	});
});
