const sinon = require('sinon');
const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const logger = require('@dotcom-reliability-kit/logger');
const FastlyCheck = require('../src/checks/fastlyKeyExpiration.check');
const status = require('../src/checks/status');

const millisecondsFortnight = 14 * 24 * 60 * 60 * 1000;
const defaultOptions = {
	name: 'fastlyKeyExpiration',
	businessImpact: 'b',
	fastlyKey: 'k'
};

describe('Fastly Key Expiration Check', () => {
	beforeEach(() => {
		sinon.spy(logger);
	});
	afterEach(() => {
		sinon.restore();
	});
	it('FastlyKeyExpirationCheck instance set & freeze states properly ', () => {
		const fastlyKeyExpirationCheck = new FastlyCheck(defaultOptions);
		const initialStates = {
			PENDING: {
				status: status.PENDING,
				checkOutput: 'Fastly key check has not yet run',
				severity: 2
			},
			FAILED_VALIDATION: {
				status: status.FAILED,
				checkOutput: 'Fastly key expiration date is due within 2 weeks',
				severity: 2
			},
			FAILED_URGENT_VALIDATION: {
				status: status.FAILED,
				checkOutput: 'Fastly key is expired',
				severity: 1
			},
			FAILED_DATE: {
				status: status.FAILED,
				checkOutput: 'Invalid Fastly key expiring date',
				severity: 2
			},
			ERRORED: {
				status: status.ERRORED,
				checkOutput: 'Fastly key check failed to fetch data',
				severity: 2
			},
			PASSED: {
				status: status.PASSED,
				checkOutput: `Fastly key ${defaultOptions.name} is configured correctly`,
				severity: 2
			}
		};
		assert.deepEqual(fastlyKeyExpirationCheck.states, initialStates);
		fastlyKeyExpirationCheck.severity = 1;
		assert.deepEqual(fastlyKeyExpirationCheck.states, initialStates);
	});

	it('returns ok=false if fastly key check has not yet run', async () => {
		sinon.stub(FastlyCheck.prototype, 'tick');
		const fastlyCheck = new FastlyCheck(defaultOptions);
		const result = fastlyCheck.getStatus();
		assert.equal(result.ok, false);
		// Default error message for ERRORED states in parent function Check
		assert.equal(result.checkOutput, fastlyCheck.states.PENDING.checkOutput);
		assert.equal(result.severity, fastlyCheck.states.PENDING.severity);
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
		assert.equal(result.ok, false);
		// Default error message for ERRORED states in parent function Check
		assert.equal(result.checkOutput, 'Healthcheck failed to execute');
		assert.equal(result.severity, fastlyCheck.states.ERRORED.severity);
		assert.deepEqual(logger.error.args, [
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
		assert.equal(result.ok, false);
		assert.equal(
			result.checkOutput,
			fastlyCheck.states.FAILED_URGENT_VALIDATION.checkOutput
		);
		assert.equal(
			result.severity,
			fastlyCheck.states.FAILED_URGENT_VALIDATION.severity
		);
	});
	it('returns ok=false if expiration date is due within 2 weeks', async () => {
		// Arrange
		const now = new Date();
		const limitDate = new Date(
			now.getTime() + millisecondsFortnight // 2 weeks from now
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
		assert.equal(result.ok, false);
		assert.equal(
			result.checkOutput,
			fastlyCheck.states.FAILED_VALIDATION.checkOutput
		);
		assert.equal(
			result.severity,
			fastlyCheck.states.FAILED_VALIDATION.severity
		);
	});
	it('returns ok=true if expiration date is due after 2 weeks', async () => {
		// Arrange
		const now = new Date();
		const limitDate = new Date(
			now.getTime() + millisecondsFortnight + 1000 // 2 weeks from now + 1 second
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
		assert.equal(result.ok, true);
		assert.equal(result.checkOutput, fastlyCheck.states.PASSED.checkOutput);
		assert.equal(result.severity, fastlyCheck.states.PASSED.severity);
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
		assert.equal(result.ok, false);
		assert.equal(
			result.checkOutput,
			fastlyCheck.states.FAILED_DATE.checkOutput
		);
		assert.equal(result.severity, fastlyCheck.states.FAILED_DATE.severity);
		assert.deepEqual(logger.warn.args, [
			['Invalid Fastly Key expiration date aaaa']
		]);
	});
});
