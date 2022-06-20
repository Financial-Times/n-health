const fetch = require('node-fetch');
const moment = require('moment');
const logger = require('@financial-times/n-logger').default;
const Check = require('./check');
const status = require('./status');

const fastlyApiEndpoint = 'https://api.fastly.com/tokens/self';

const states = {
	PENDING: {
		status: status.PENDING,
		checkOutput: 'Fastly key check has not yet run'
	},
	FAILED_VALIDATION: {
		status: status.FAILED,
		checkOutput: 'Fastly key expiration date is within 2 weeks'
	},
	FAILED_DATE:{
		status: status.FAILED,
		checkOutput: 'Invalid Fastly key check expiring date'
	},
	ERRORED: {
		status: status.ERRORED,
		checkOutput: 'Fastly key check failed to fetch data'
	},
	PASSED: {
		status: status.PASSED,
		checkOutput: 'Fastly key check has not yet run'
	}
};

/**
 * @description Polls the current state of a Fastly key expiration date
 * alert if the key expires in the next week or two
 * alert if the key has a null expiry date
 */
class FastlyKeyExpirationCheck extends Check {
	constructor(options) {
		super(options);
		this.fastlyKey = options.fastlyKey;
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
			log.error('Failed to get Fastly key metadata', error);
			this.setState(states.ERRORED);
		}
	}

	parseStringDate(stringDate) {
		const date = moment(stringDate, 'YYYY-MM-DDTHH:mm:ssZ');
		if (!date.isValid()) {
			logger.warn(`Invalid Fastly Key expiration date ${stringDate}`);
			this.setState(states.FAILED_DATE);
		}
		return date;
	}

	async getExpirationDate() {
		const metadata = await this.getFastlyKeyMetadata();
		const expirationDate = this.parseStringDate(metadata['expires_at']);
		return expirationDate;
	}

	isValidExpirationDate(expirationDate) {
		const limitDate = moment().add(2, 'weeks');
		return expirationDate.isAfter(limitDate);
	}

	async tick() {
		const expirationDate = await this.getExpirationDate();
		if (this.isValidExpirationDate(expirationDate)) {
			this.setState(states.PASSED);
		} else {
			this.setState(states.FAILED_VALIDATION);
		}
	}
}

module.exports = FastlyKeyExpirationCheck;
