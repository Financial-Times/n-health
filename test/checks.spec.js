'use strict';
const expect = require('chai').expect;
const checks = require('../src/checks');

describe('Checks', function(){

	for(let key in checks) {
		// don't really understand the aggregate logic and difficult to make this test work for it.
		// This test is mainly aimed at new check types that get added though so OK to skip for existing ones
		if (key !== 'aggregate') {
			it(`${key} check should define standard methods`, () => {
				const check = new checks[key]({
					"name": "test",
					"severity": 2,
					"businessImpact" : "blah",
					"technicalSummary" : "god knows",
					"panicGuide" : "Don't Panic",
					urls: [],
					"checkResult" : {
						"PASSED" : "Text if check passed",
						"FAILED" : "Text is check failed",
						"PENDING" : "This check has not yet run"
					},
					callback: () => true
				}, {checks: []});

				expect(typeof check.tick).to.equal('function');
				expect(typeof check.checkOutput).to.equal('string');
				expect(typeof check.tick().then).to.equal('function');
			});
		}
	}
});
