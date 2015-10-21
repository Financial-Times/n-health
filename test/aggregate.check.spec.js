'use strict';

const expect = require('chai').expect;
const config = require('./fixtures/config/aggregate').checks[2];
const AggregateCheck = require('../src/checks/').aggregate;

class MockCheck {
	constructor (name) {
		this.name = name;
		this.ok = true;
	}

	getStatus () {
		return {
			ok : this.ok
		}
	}
}

const MockHealthChecks = {
	checks : [
		new MockCheck('test1'),
		new MockCheck('test2')
	]
};

describe('Aggregate Check', function(){

	let check;

	beforeEach(function(){
		check = new AggregateCheck(config, MockHealthChecks);
	});

	describe('AtLeastOne', function(){

		it('Should be true if at least one of the checks if passing', function(done){
			MockHealthChecks.checks[0].ok = false;
			MockHealthChecks.checks[1].ok = true;
			check.start();
			setTimeout(function(){
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be false if none of the checks if passing', function(done){
			MockHealthChecks.checks[0].ok = false;
			MockHealthChecks.checks[1].ok = false;
			check.start();
			setTimeout(function(){
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});
	})
});
