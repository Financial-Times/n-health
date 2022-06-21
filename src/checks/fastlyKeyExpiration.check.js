const fetch = require('node-fetch');
const moment = require('moment');
const logger = require('@financial-times/n-logger').default;
const Check = require('./check');
const status = require('./status');

const fastlyApiEndpoint = 'https://api.fastly.com/tokens/self';
const defaultPanicGuide = 'Contact the Slack channel #fastly-support to rotate the keys https://financialtimes.slack.com/archives/C2GFE1C9X',
/**
 * @description Polls the current state of a Fastly key expiration date
 * alert if the key expires in the next week or two
 * alert if the key has a null expiry date
 */
class FastlyKeyExpirationCheck extends Check {
	constructor(options) {
		super(options);
		this.fastlyKey = options.fastlyKey;
		this.panicGuide options.panicGuide || defaultPanicGuide;
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
				checkOutput: 'Fastly key expiration date is ok',
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
		const date = moment(stringDate, 'YYYY-MM-DDTHH:mm:ssZ');
		if (!date.isValid()) {
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
		const now = moment();
		const limitDate = moment().add(2, 'weeks');
		switch(true){
			case  expirationDate.isAfter(limitDate): return this.states.PASSED;
			case expirationDate.isBefore(now): return this.states.FAILED_URGENT_VALIDATION;
			default: return this.states.FAILED_VALIDATION
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
