'use strict';

const assert = require('node:assert/strict');
const path = require('path');
const HealthChecks = require('../src/healthchecks');
const startup = require('../src/startup');

describe('Startup', function () {
	it('Should read in the config dir and create new healthcheck objects', function () {
		const result = startup(path.resolve(__dirname, 'fixtures/config/'));
		assert.equal(result.get('sourcemap'), undefined);
		assert.ok(result.get('paywall') instanceof HealthChecks);
	});
});
