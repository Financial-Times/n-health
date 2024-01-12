'use strict';
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const logger = require('@dotcom-reliability-kit/logger');

function allEqual(responses) {
	for (let i = 1, l = responses.length; i < l; i++) {
		if (responses[i] !== responses[0]) {
			return false;
		}
	}

	return true;
}

class ResponseCompareCheck extends Check {
	constructor(options) {
		super(options);
		this.comparison = options.comparison;
		this.urls = options.urls;
		this.headers = options.headers || {};
		this.normalizeResponse = options.normalizeResponse || ((resp) => resp);
	}

	get checkOutput() {
		if (this.status === status.PENDING) {
			return 'this test has not yet run';
		}

		const urls = this.urls.join(' & ');
		if (this.comparison === ResponseCompareCheck.comparisons.EQUAL) {
			return `${urls} are ${this.status === status.PASSED ? '' : 'not'} equal`;
		}

		return undefined;
	}

	async tick() {
		try {
			const responses = await Promise.all(
				this.urls.map((url) =>
					fetch(url, { headers: this.headers }).then((r) =>
						r.text().then(this.normalizeResponse)
					)
				)
			);

			if (this.comparison === ResponseCompareCheck.comparisons.EQUAL) {
				this.status = allEqual(responses) ? status.PASSED : status.FAILED;
			}
		} catch (error) {
			logger.error(
				{
					event: 'RESPONSE_COMPARE_CHECK_ERROR',
					message: 'Response was not OK'
				},
				error
			);
			this.status = status.FAILED;
		}
	}
}

ResponseCompareCheck.comparisons = {
	EQUAL: 'equal'
};

module.exports = ResponseCompareCheck;
