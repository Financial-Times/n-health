'use strict';

const expect = require('chai').expect;
const mitmFactory = require('mitm');

describe('Pingdom Check', function(){

	let PingdomCheck;
	let fixture;
	let pingdomCheck;
	let mitm;


	beforeEach(function(){
		mitm = mitmFactory();
		fixture = require('./fixtures/config/pingdomCheckFixture.js').checks[0];
		PingdomCheck = require('../src/checks/').pingdom;
		pingdomCheck = new PingdomCheck(fixture);
	});

	after(function(){
		mitm.disable();
	});

	it('Should be able to contact pingdom to get the status of a given check', function(done){
		mitm.once('request', function(req){
			expect(req.url).to.equal('/api/2.0/checks/' + fixture.checkId);
			expect(req.headers['app-key']).to.exist;
			expect(req.headers['account-email']).to.exist;
			expect(req.headers.host).to.equal('api.pingdom.com');
			done();
		});

		pingdomCheck.start();
	});

	it('Should be ok if the pingdom status is "up', function(done){
		mitm.once('request', function(req, res){
			res.statusCode = 200;
			res.end(JSON.stringify(require('./fixtures/pingdomUpResponse.json')), 'utf8');
			setTimeout(function(){
				expect(pingdomCheck.getStatus().ok).to.be.true;
				done();
			},5);
		});

		pingdomCheck.start();
	});

	it('Should not be ok if the pingdom status is not "up', function(done){
		mitm.once('request', function(req, res){
			res.statusCode = 200;
			res.end(JSON.stringify(require('./fixtures/pingdomDownResponse.json')), 'utf8');
			setTimeout(function(){
				expect(pingdomCheck.getStatus().ok).to.be.false;
				done();
			},5);
		});

		pingdomCheck.start();
	});

	it('Should not be ok if the status check failed', function(done){
		mitm.once('request', function(req, res){
			res.statusCode = 500;
			res.end();
			setTimeout(function(){
				expect(pingdomCheck.getStatus().ok).to.be.false;
				done();
			},5);
		});

		pingdomCheck.start();
	});
});


