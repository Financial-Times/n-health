'use strict';

const assert = require('node:assert/strict');
const JsonCheck = require('../src/checks/').json;

describe('Healthchecks', function () {
	let Healthchecks;
	let fixture;
	let healthchecks;

	before(function () {
		Healthchecks = require('../src/healthchecks');
		fixture = require('./fixtures/config/paywall.js');
		healthchecks = new Healthchecks(fixture, require('../src/checks/'));
	});

	function extract(obj, props) {
		const extracted = {};
		props.forEach(function (prop) {
			extracted[prop] = obj[prop];
		});

		return extracted;
	}

	it('Should be able to read in the config object', function () {
		const props = ['name', 'description'];
		assert.deepEqual(extract(healthchecks, props), extract(fixture, props));
	});

	it('Should create new checks as described in the config', function () {
		assert.ok(healthchecks.checks[0] instanceof JsonCheck);
	});

	it('Should report its status correctly', function () {
		const status = healthchecks.getStatus();
		assert.equal(status.name, fixture.name);
		assert.equal(status.description, fixture.description);
		assert.equal(status.checks.length, 1);
		assert.equal(status.checks[0].name, fixture.checks[0].name);
		assert.equal(status.checks[0].panicGuide, fixture.checks[0].panicGuide);
	});
});
