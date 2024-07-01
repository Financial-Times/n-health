const fetch = require('node-fetch');
const logger = require('@dotcom-reliability-kit/logger');
const Check = require('./check');
const status = require('./status');

const twoWeeksInDays = 2 * 7;

const fastlyApiEndpoint = 'https://api.fastly.com/tokens/self';
const defaultPanicGuide =
	'Generate a new key in your own Fastly account with the same permissions and update it in Doppler or your app';
const defaultTechnicalSummary =
	'Check the Fastly key in the api token information endpoint to obtain the expiration date';
const defaultSeverity = 2;
/**
 * @description Polls the current state of a Fastly key expiration date
 * alert if the key expires in the next week or two
 * alert if the key has a null expiry date
 */
class FastlyKeyExpirationCheck extends Check {
	constructor({
		panicGuide = defaultPanicGuide,
		technicalSummary = defaultTechnicalSummary,
		severity = defaultSeverity,
		...options
	}) {
		super({ panicGuide, technicalSummary, severity, ...options });
		this.fastlyKey = options.fastlyKey;
		this.states = Object.freeze({
			PENDING: {
				status: status.PENDING,
				checkOutput: 'Fastly key check has not yet run',
				severity: this.severity
			},
			FAILED_VALIDATION: {
				status: status.FAILED,
				checkOutput: 'Fastly key expiration date is due within 2 weeks',
				severity: this.severity
			},
			FAILED_URGENT_VALIDATION: {
				status: status.FAILED,
				checkOutput: 'Fastly key is expired',
				severity: 1
			},
			FAILED_DATE: {
				status: status.FAILED,
				checkOutput: 'Invalid Fastly key expiring date',
				severity: this.severity
			},
			ERRORED: {
				status: status.ERRORED,
				checkOutput: 'Fastly key check failed to fetch data',
				severity: this.severity
			},
			PASSED: {
				status: status.PASSED,
				checkOutput: `Fastly key ${this.name} is configured correctly`,
				severity: this.severity
			}
		});
		this.setState(this.states.PENDING);
	}

	setState(state) {
		// To be able to assign a varialble number of parameters
		Object.assign(this, state);
	}

	async getFastlyKeyMetadata() {
		try {
			const result = await fetch(fastlyApiEndpoint, {
				headers: { 'Fastly-Key': this.fastlyKey }
			});
			const json = await result.json();
			return json;
		} catch (error) {
			logger.error('Failed to get Fastly key metadata', error.message);
			this.setState(this.states.ERRORED);
			throw error;
		}
	}

	parseStringDate(stringDate) {
		let dateIsValid = true;
		let date;
		try {
			date = new Date(stringDate);
			dateIsValid = !Number.isNaN(date.getDate());
		} catch (error) {
			dateIsValid = false;
		}
		if (!dateIsValid) {
			logger.warn(`Invalid Fastly Key expiration date ${stringDate}`);
			this.setState(this.states.FAILED_DATE);
			throw new Error('Invalid date');
		}
		return date;
	}

	async getExpirationDate() {
		const metadata = await this.getFastlyKeyMetadata();
		const expirationDate = this.parseStringDate(metadata['expires_at']);
		return expirationDate;
	}

	checkExpirationDate(expirationDate) {
		const now = new Date();
		const limitDate = new Date();
		limitDate.setDate(now.getDate() + twoWeeksInDays);
		switch (true) {
			case expirationDate > limitDate:
				return this.states.PASSED;
			case expirationDate <= now:
				return this.states.FAILED_URGENT_VALIDATION;
			default:
				return this.states.FAILED_VALIDATION;
		}
	}

	async tick() {
		try {
			const expirationDate = await this.getExpirationDate();
			const state = this.checkExpirationDate(expirationDate);
			this.setState(state);
		} catch {
			// This catch is meant to end the execution of the tick function.
			// An expecific state has been set for each error type.
		}
	}
}

module.exports = FastlyKeyExpirationCheck;
