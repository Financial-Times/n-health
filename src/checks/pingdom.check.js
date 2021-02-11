'use strict';
const Check = require('./check');
const status = require('./status');

class PingdomCheck extends Check{

	constructor(options) {
		super(options);
		this.status = status.FAILED;
		this.checkOutput = 'Pingdom checks are deprecated and will be removed in a future version of n-health. Remove this check from your healthcheck config, and tag your checks with your system code in Pingdom so they can be monitored. See https://tech.in.ft.com/guides/monitoring/how-to-pingdom-check for more information.';
	}

	tick() {}
}

module.exports = PingdomCheck;
