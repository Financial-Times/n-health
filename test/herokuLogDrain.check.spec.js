'use strict';

const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

const mockFetch = sinon.stub();

const mockValidResponse = {
	status: 200,
	ok: true,
	json: sinon.stub().resolves([
		{
			url: 'https://x:mock-splunk-token@http-inputs-financialtimes.splunkcloud.com/services/collector/raw?sourcetype=heroku&source=mock-system-code&host=mock-host&channel=mock-channel'
		}
	])
};

const mockInvalidResponse = {
	status: 403,
	ok: false
};

mockFetch.withArgs('https://api.heroku.com/apps/mock-valid-app-id/log-drains').resolves(mockValidResponse);
mockFetch.withArgs('https://api.heroku.com/apps/mock-invalid-app-id/log-drains').resolves(mockInvalidResponse);

const Check = proxyquire('../src/checks/herokuLogDrain.check', {
	'node-fetch': mockFetch,
	'@financial-times/n-logger': {default: {
		error: sinon.spy()
	}}
});

describe.only('Heroku Log Drain Check', () => {
	let check;
	let backupEnv;

	beforeEach(() => {
		backupEnv = process.env;
		process.env.SYSTEM_CODE = 'mock-system-code';
		process.env.HEROKU_AUTH_TOKEN = 'mock-env-auth-token';
		process.env.HEROKU_APP_ID = 'mock-env-app-id';
		check = new Check({
			id: 'mock-id',
			name: 'mock-name',
			herokuAuthToken: 'mock-auth-token',
			herokuAppId: 'mock-valid-app-id'
		});
	});

	afterEach(() => {
		process.env = backupEnv;
		check.stop();
		sinon.resetHistory();
	});

	it('extends the base Check class', () => {
		expect(check).to.be.an.instanceof(require('../src/checks/check'));
	});

	it('it has sensible default check values', () => {
		const status = check.getStatus();
		expect(status.severity).to.equal(2);
		expect(status.businessImpact).to.equal('Logs may not be captured in Splunk for this application. It may not be possible to debug other issues while log drains are not configured.');
		expect(status.technicalSummary).to.equal('Uses the Heroku API to fetch Heroku log drains for the application and verify that they\'re configured to drain into the correct Splunk endpoint.');
		expect(status.panicGuide).to.equal('[Check whether the app has been migrated to use log drains](https://financialtimes.atlassian.net/wiki/spaces/DS/pages/7883555001/Migrating+an+app+to+Heroku+log+drains). If it has been migrated then the log drain is either misconfigured or missing, follow the migration guide to correct this.');
	});

	describe('when the app has a valid Heroku log drain configured', () => {

		beforeEach(done => {
			check.start();
			setTimeout(done);
		});

		it('requests the Heroku log drains for the app', () => {
			expect(mockFetch.callCount).to.equal(1);
			expect(mockFetch.firstCall.args[0]).to.equal('https://api.heroku.com/apps/mock-valid-app-id/log-drains');
			expect(mockFetch.firstCall.args[1].headers).to.be.an('object');
			expect(mockFetch.firstCall.args[1].headers.accept).to.equal('application/vnd.heroku+json; version=3');
			expect(mockFetch.firstCall.args[1].headers.authorization).to.equal('Bearer mock-auth-token');
		});

		it('it sets the check properties to indicate success', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drain configuration is correct');
			expect(status.ok).to.be.true;
		});

	});

	describe('when the Heroku API fails', () => {

		beforeEach(done => {
			check.herokuAppId = 'mock-invalid-app-id';
			check.start();
			setTimeout(done);
		});

		it('requests the Heroku log drains for the app', () => {
			expect(mockFetch.callCount).to.equal(1);
			expect(mockFetch.firstCall.args[0]).to.equal('https://api.heroku.com/apps/mock-invalid-app-id/log-drains');
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drain configuration check failed to fetch data: heroku responded with a 403 status code');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app has multiple log drains', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([
				{
					url: 'mock-drain-1'
				},
				{
					url: 'mock-drain-2'
				}
			]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: app has more than one log drain configured');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app has no log drains', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: app has no log drain configured');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app has an invalid URL as a log drain', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([
				{
					url: 'log-drain'
				}
			]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: log drain is not a valid URL');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app has the wrong log drain configured', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([
				{
					url: 'https://logdrain.example.com/'
				}
			]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: log drain URL does not match "https://x:<token>@http-inputs-financialtimes.splunkcloud.com/services/collector/raw"');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app log drain has no source query parameter', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([
				{
					url: 'https://x:mock-splunk-token@http-inputs-financialtimes.splunkcloud.com/services/collector/raw?sourcetype=heroku&host=mock-host&channel=mock-channel'
				}
			]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: log drain source parameter is not set to the application system code');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app log drain source query parameter does not match the SYSTEM_CODE environment variable', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([
				{
					url: 'https://x:mock-splunk-token@http-inputs-financialtimes.splunkcloud.com/services/collector/raw?sourcetype=heroku&source=invalid&host=mock-host&channel=mock-channel'
				}
			]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: log drain source parameter is not set to the application system code');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app log drain has an invalid sourcetype query parameter', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([
				{
					url: 'https://x:mock-splunk-token@http-inputs-financialtimes.splunkcloud.com/services/collector/raw?sourcetype=invalid&source=mock-system-code&host=mock-host&channel=mock-channel'
				}
			]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: log drain sourcetype parameter is not set to "heroku"');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app log drain has no host query parameter', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([
				{
					url: 'https://x:mock-splunk-token@http-inputs-financialtimes.splunkcloud.com/services/collector/raw?sourcetype=heroku&source=mock-system-code&channel=mock-channel'
				}
			]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: log drain host parameter is not set');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the app log drain has no channel query parameter', () => {

		beforeEach(done => {
			mockValidResponse.json.resolves([
				{
					url: 'https://x:mock-splunk-token@http-inputs-financialtimes.splunkcloud.com/services/collector/raw?sourcetype=heroku&source=mock-system-code&host=mock-host'
				}
			]);
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drains are misconfigured: log drain channel parameter is not set');
			expect(status.ok).to.be.false;
		});

	});

	describe('when the check has no Heroku details passed as options', () => {

		beforeEach(() => {
			check = new Check({
				id: 'mock-id',
				name: 'mock-name'
			});
		});
	
		afterEach(() => {
			process.env = backupEnv;
			check.stop();
			sinon.resetHistory();
		});
	
		it('defaults them to the matching environment variables', () => {
			expect(check.herokuAuthToken).to.equal('mock-env-auth-token');
			expect(check.herokuAppId).to.equal('mock-env-app-id');
		});

	});

	describe('when there is no Heroku auth token provided', () => {

		beforeEach(done => {
			check.herokuAuthToken = undefined;
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drain configuration check failed to fetch data: A Heroku auth token is required to run this check. `HEROKU_AUTH_TOKEN` env var was missing');
			expect(status.ok).to.be.false;
		});

	});

	describe('when there is no Heroku app ID provided', () => {

		beforeEach(done => {
			check.herokuAppId = undefined;
			check.start();
			setTimeout(done);
		});

		it('it sets the check properties to indicate failure', () => {
			const status = check.getStatus();
			expect(status.checkOutput).to.equal('Heroku log drain configuration check failed to fetch data: A Heroku app ID is required to run this check. `HEROKU_APP_ID` env var was missing');
			expect(status.ok).to.be.false;
		});

	});

});


