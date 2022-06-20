const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const logger = require('@financial-times/n-logger').default;
const FastlyCheck = require('../src/checks/fastlyKeyExpiration.check');

const millisecondsFornight = 14 * 24 * 60 * 60 * 1000;
const defaultOptions = {
	name: 'fastlyKeyExpiration',
	severity: 2,
	businessImpact: 'b',
	panicGuide: 'p',
	technicalSummary: 't',
	fastlyKey: 'k'
};

describe('Fastly Key Expiration Check', () => {
	beforeEach(() => {
		sinon.spy(logger);
	});
	afterEach(() => {
		sinon.restore();
	});

	it('returns ok=false if fastly key check has not yet run', async () => {
		sinon.stub(FastlyCheck.prototype, 'tick');
		const fastlyCheck = new FastlyCheck(defaultOptions);
		const result = fastlyCheck.getStatus();
		expect(result.ok).to.be.false;
		// Default error message for ERRORED states in parent function Check
		expect(result.checkOutput).to.be.equal(
			fastlyCheck.states.PENDING.checkOutput
		);
		expect(result.severity).to.be.equal(fastlyCheck.states.PENDING.severity);
	});
	it('returns ok=false if key check failed to fetch data & logs errors', async () => {
		// Arrange
		const FastlyCheck = proxyquire('../src/checks/fastlyKeyExpiration.check', {
			'node-fetch': sinon.stub().rejects(new Error('Timeout'))
		});
		const fastlyCheck = new FastlyCheck(defaultOptions);
		// Force the update of the state
		await fastlyCheck.tick();
		// Act
		const result = fastlyCheck.getStatus();
		// Assert
		expect(result.ok).to.be.false;
		// Default error message for ERRORED states in parent function Check
		expect(result.checkOutput).to.be.equal('Healthcheck failed to execute');
		expect(result.severity).to.be.equal(fastlyCheck.states.ERRORED.severity);
		expect(logger.error.args).to.be.deep.equal([
			['Failed to get Fastly key metadata', 'Timeout']
		]);
	});
	it('returns ok=false, severity=1 if expiration date is due now', async () => {
		// Arrange
		const now = new Date();
		const limitDate = new Date(
			now.getTime() // now
		);
		// Fix now as reference time
		sinon.useFakeTimers(now);
		const fastlyCheck = new FastlyCheck(defaultOptions);
		const metadata = { expires_at: limitDate.toISOString() };
		sinon.stub(fastlyCheck, 'getFastlyKeyMetadata').resolves(metadata);
		// Force the update of the state
		await fastlyCheck.tick();
		// Act
		const result = fastlyCheck.getStatus();
		// Assert
		expect(result.ok).to.be.false;
		expect(result.checkOutput).to.be.equal(
			fastlyCheck.states.FAILED_URGENT_VALIDATION.checkOutput
		);
		expect(result.severity).to.be.equal(
			fastlyCheck.states.FAILED_URGENT_VALIDATION.severity
		);
	});
	it('returns ok=false if expiration date is due within 2 weeks', async () => {
		// Arrange
		const now = new Date();
		const limitDate = new Date(
			now.getTime() + millisecondsFornight // 2 weeks from now
		);
		// Fix now as reference time
		sinon.useFakeTimers(now);
		const fastlyCheck = new FastlyCheck(defaultOptions);
		const metadata = { expires_at: limitDate.toISOString() };
		sinon.stub(fastlyCheck, 'getFastlyKeyMetadata').resolves(metadata);
		// Force the update of the state
		await fastlyCheck.tick();
		// Act
		const result = fastlyCheck.getStatus();
		// Assert
		expect(result.ok).to.be.false;
		expect(result.checkOutput).to.be.equal(
			fastlyCheck.states.FAILED_VALIDATION.checkOutput
		);
		expect(result.severity).to.be.equal(
			fastlyCheck.states.FAILED_VALIDATION.severity
		);
	});
	it('returns ok=true if expiration date is due after 2 weeks', async () => {
		// Arrange
		const now = new Date();
		const limitDate = new Date(
			now.getTime() + millisecondsFornight + 1000 // 2 weeks from now + 1 second
		);
		// Fix now as reference time
		sinon.useFakeTimers(now);
		const fastlyCheck = new FastlyCheck(defaultOptions);
		const metadata = { expires_at: limitDate.toISOString() };
		sinon.stub(fastlyCheck, 'getFastlyKeyMetadata').resolves(metadata);
		// Force the update of the state
		await fastlyCheck.tick();
		// Act
		const result = fastlyCheck.getStatus();
		// Assert
		expect(result.ok).to.be.true;
		expect(result.checkOutput).to.be.equal(
			fastlyCheck.states.PASSED.checkOutput
		);
		expect(result.severity).to.be.equal(fastlyCheck.states.PASSED.severity);
	});
	it('returns ok=false if expiration date is not valid & logs warning', async () => {
		// Arrange
		const fastlyCheck = new FastlyCheck(defaultOptions);
		const metadata = { expires_at: 'aaaa' };
		sinon.stub(fastlyCheck, 'getFastlyKeyMetadata').resolves(metadata);
		// Force the update of the state
		await fastlyCheck.tick();
		// Act
		const result = fastlyCheck.getStatus();
		// Assert
		expect(result.ok).to.be.false;
		expect(result.checkOutput).to.be.equal(
			fastlyCheck.states.FAILED_DATE.checkOutput
		);
		expect(result.severity).to.be.equal(
			fastlyCheck.states.FAILED_DATE.severity
		);
		expect(logger.warn.args).to.be.deep.equal([
			['Invalid Fastly Key expiration date aaaa']
		]);
	});
});
