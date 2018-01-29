'use strict';

const logger = require('@financial-times/n-logger').default;
const status = require('./status');
const Check = require('./check');
const KeenQuery = require('keen-query');
const ms = require('ms');

const logEventPrefix = 'KEEN_THRESHOLD_CHECK';

// Detects when the value of a metric climbs above/below a threshold value

class KeenThresholdCheck extends Check {

	constructor(options){
		super(options);
		this.threshold = options.threshold;
		this.direction = options.direction || 'below';

		this.timeframe = options.timeframe || 'this_60_minutes';

		this.keenProjectId = process.env.KEEN_PROJECT_ID;
		this.keenReadKey = process.env.KEEN_READ_KEY;
		if (!(this.keenProjectId && this.keenReadKey)) {
			throw new Error('You must set KEEN_PROJECT_ID and KEEN_READ_KEY environment variables');
		}

		KeenQuery.setConfig({
			KEEN_PROJECT_ID: this.keenProjectId,
			KEEN_READ_KEY: this.keenReadKey,
			KEEN_HOST: 'https://keen-proxy.ft.com/3.0'
		});

		if (!options.query) {
			throw new Error(`You must pass in a query for the "${options.name}" check - e.g., "page:view->filter(context.app=article)->count()"`);
		}


		this.query = options.query;

		this.checkOutput = 'Keen threshold check has not yet run';
	}

	tick() {
		return KeenQuery.build(this.query)
			.filter('user.subscriptions.isStaff!=true')
			.filter('user.geo.isFinancialTimesOffice!=true')
			.filter('device.isRobot!=true')
			.relTime(this.timeframe)
			.print()
			.then(result => {
				if(result && result.rows) {
					let data = Number(result.rows[0][1]);
					let failed = this.direction === 'above' ?
						data && data > this.threshold :
						data && data < this.threshold;
						this.status = failed ? status.FAILED : status.PASSED;
						this.checkOutput = `Got ${data} ${this.timeframe.split('_').join(' ').replace('this', 'in the last')}, expected not to be ${this.direction} the threshold of ${this.threshold}

			${this.query}
						`;
				}
			})
			.catch(err => {
				logger.error({ event: `${logEventPrefix}_ERROR`, url: this.query }, err);
				this.status = status.FAILED;
				this.checkOutput = 'Keen threshold check failed to fetch data: ' + err.message;
			});
	}

}

module.exports = KeenThresholdCheck;
