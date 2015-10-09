'use strict';
var expect = require('chai').expect;
var path = require('path');
var HealthChecks = require('../src/healthchecks');

describe('Startup', function(){

	var startup;

	before(function(){
		startup = require('../src/startup');
	});

	it('Should read in the config dir and create new healthcheck objects', function(){
		var result = startup(path.resolve(__dirname, 'fixtures/'));
		expect(result.get('paywall')).to.exist;
		expect(result.get('paywall')).to.be.an.instanceOf(HealthChecks);
	});

});
