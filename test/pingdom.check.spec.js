'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/pingdomCheckFixture.js').checks[0];
const PingdomCheck = require('../src/checks/pingdom.check');

describe('Pingdom Check', function() {
	it('should fail and return a deprecation message', function(done) {
		const check = new PingdomCheck(fixture);
		check.start();

		setImmediate(() => {
			const { ok, checkOutput } = check.getStatus();
			expect(ok).to.be.false;
			expect(checkOutput).to.match(/^Pingdom checks are deprecated/);
			done();
		});
	});
});
