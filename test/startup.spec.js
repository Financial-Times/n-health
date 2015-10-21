'use strict';
var expect = require('chai').expect;
var path = require('path');
var HealthChecks = require('../src/healthchecks');
const fetchMock = require('fetch-mock');

describe('Startup', function(){

	var startup;

	before(function(){
		fetchMock.mock({
			greed: 'good'
		});
		startup = require('../src/startup');
	});

	after(() => fetchMock.restore());

	it('Should read in the config dir and create new healthcheck objects', function(){
		var result = startup(path.resolve(__dirname, 'fixtures/config/'));
		expect(result.get('paywall')).to.exist;
		expect(result.get('paywall')).to.be.an.instanceOf(HealthChecks);
	});

});
