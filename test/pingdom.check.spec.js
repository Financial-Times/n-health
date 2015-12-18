'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/pingdomCheckFixture.js').checks[0];
const PingdomCheck = require('../src/checks/').pingdom;
const fetchMock = require('fetch-mock');

describe('Pingdom Check', function(){

	let check;

	function setup(body){
		fetchMock.mock({
			routes: [
				{
					name: 'pingdom',
					matcher: 'https://api.pingdom.com/api/2.0/checks/' + fixture.checkId,
					response: body || 500
				}
			]
		});
		check = new PingdomCheck(fixture);
	}


	afterEach(function (){
		fetchMock.restore();
	});

	it('Should be able to contact pingdom to get the status of a given check', function(done){
		setup({});
		check.start();
		setTimeout(() => {
			expect(fetchMock.calls('pingdom').length).to.equal(1);
			expect(fetchMock.calls('pingdom')[0][1].headers['App-Key']).to.exist;
			expect(fetchMock.calls('pingdom')[0][1].headers['Account-Email']).to.exist;
			done();
		});
	});

	it('Should be ok if the pingdom status is "up', function(done){
		setup(require('./fixtures/pingdomUpResponse.json'));
		check.start();
		setTimeout(function(){
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should not be ok if the pingdom status is not "up', function(done){
		setup(require('./fixtures/pingdomDownResponse.json'));
		check.start();
		setTimeout(function(){
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should not be ok if the status check failed', function(done){
		setup();
		check.start();
		setTimeout(function(){
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('should return error message if pingdom returns a 403 status', function(done) {
		setup({
				status: 403,
				body: require('./fixtures/pingdom403Response.json')
		});
		check.start();
		setTimeout(function(){
			expect(check.getStatus().checkOutput).to.eql('Failed to get status: Pingdom API returned 403: Something went wrong! This string describes what happened.');
			done();
		});
	});

});
