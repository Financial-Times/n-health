'use strict';

const expect = require('chai').expect;
const PingdomCheck = require('../src/checks/').pingdom;

describe('Healthchecks', function(){

	let Healthchecks;
	let fixture;
	let healthchecks;

	before(function(){
		Healthchecks = require('../src/healthchecks');
		fixture = require('./fixtures/config/paywall.js');
		healthchecks = new Healthchecks(fixture, require('../src/checks/'));
	});

	function extract(obj, props){
		const extracted = {};
		props.forEach(function(prop){
			extracted[prop] = obj[prop];
		});

		return extracted;
	}

	it('Should be able to read in the config object', function(){
		const props = ['name', 'description'];
		expect(extract(healthchecks, props)).to.deep.equal(extract(fixture, props));
	});

	it('Should create new checks as described in the config', function(){
		expect(healthchecks.checks[0]).to.be.an.instanceOf(PingdomCheck);
	});

	it("Should report it's status correctly", function(){
		const status = healthchecks.getStatus();
		expect(status.name).to.equal(fixture.name);
		expect(status.description).to.equal(fixture.description);
		expect(status.checks.length).to.equal(1);
		expect(status.checks[0].name).to.equal(fixture.checks[0].name);
		expect(status.checks[0].panicGuide).to.equal(fixture.checks[0].panicGuide);
	});
});
