'use strict';
require('babel/register');
var expect = require('chai').expect;


describe('Aggregate Check', function(){

	var AggregateCheck;
	var check;

	var MockCheck = function(name){
		this.name = name;
		this.ok = true;
	};

	MockCheck.prototype.getStatus = function(){
		return {
			ok : this.ok
		}
	};

	var MockHealthChecks = {
		checks : [
			new MockCheck('test1'),
			new MockCheck('test2')
		]
	};

	before(function(){
		var config = require('./fixtures/config/aggregate').checks[2];
		AggregateCheck = require('../src/checks/').aggregate;
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
