const fetch = require('node-fetch');
const moment = require('moment');
const logger = require('@financial-times/n-logger').default;
const Check = require('./check');
const status = require('./status');

const fastlyApiEndpoint = 'https://api.fastly.com/tokens/self';

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

	async getFastlyKeyMetadata() {
		try {
			const result = await fetch(fastlyApiEndpoint, {
				headers: { Fastly- Key: this.fastlyKey}
			});
		const json = await result.json();
		return json;
		} catch(error) {
			log.error('Failed to get Fastly key metadata', error);
			this.status = status.FAILED;
			this.checkOutput = `Fastly keys check failed to fetch data: ${error.message}`;
		}
	}

	async tick() {
		const metadata = await getFastlyKeyMetadata();
	}
}

module.exports = FastlyKeyExpirationCheck;
