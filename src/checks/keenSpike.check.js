'use strict';

const logger = require('@financial-times/n-logger').default;
const status = require('./status');
const Check = require('./check');
const KeenQuery = require('keen-query');
const ms = require('ms');

const logEventPrefix = 'KEEN_THRESHOLD_CHECK';

class KeenSpikeCheck extends Check {

	constructor(options){
		super(options);
		this.threshold = options.threshold || 0.2;
		this.direction = options.direction || 'below';

		this.timeframe = options.timeframe || '2';
		this.baselinePeriod = options.baselinePeriod || '7';

		this.keenProjectId = process.env.KEEN_PROJECT_ID;
		this.keenReadKey = process.env.KEEN_READ_KEY;
		if (!(this.keenProjectId && this.keenReadKey)) {
			throw new Error('You must set KEEN_PROJECT_ID and KEEN_READ_KEY environment variables');
		}

		KeenQuery.setConfig({
			KEEN_PROJECT_ID: this.keenProjectId,
			KEEN_READ_KEY: this.keenReadKey,
			KEEN_HOST: 'https://keen-proxy.ft.com/3.0',
			fetchOptions: {
				headers: {
					'Cache-Strategy': 'max-age=5m, stale-while-revalidate=1m'
				}
			}
		});

		if (!options.query) {
			throw new Error(`You must pass in a query for the "${options.name}" check - e.g., "page:view->filter(context.app=article)->count()"`);
		}

		this.query = options.query;
		//Default to 10 minute interval for keen checks so we don't overwhelm it
		this.interval = options.interval || 10 * 60 * 1000;

		this.status = status.PASSED;
		this.checkOutput = 'Keen threshold check has not yet run';

	}

	tick() {
		const sampleQuery = () => {
			return KeenQuery.build(this.query)
				.filter('user.subscriptions.isStaff!=true')
				.filter('user.geo.isFinancialTimesOffice!=true')
				.filter('device.isRobot!=true')
				.relTime(this.timeframe)
				.print()
		}

		const baselineQuery = () => {
			let startDate = new Date();
			let endDate = new Date();
			startDate.setDate(startDate.getDate() - this.baselinePeriod + this.timeframe);
			endDate.setDate(endDate.getDate() - this.baselinePeriod);

			return KeenQuery.build(this.query)
				.filter('user.subscriptions.isStaff!=true')
				.filter('user.geo.isFinancialTimesOffice!=true')
				.filter('device.isRobot!=true')
				.absTime(startDate, endDate)
				.print()
		}

		return Promise.all([
			sampleQuery(),
			baselineQuery()
		])
		.then(([sampleResult, baselineResult]) => {
			if(sampleResult && baselineResult) {
				let sampleData = Number(sampleResult.rows[0][1]);
				let baselineData = Number(baselineResult.rows[0][1]);
				let baselinePercentage = this.threshold * baselineData;
				let ok;

					if (this.direction === 'below') {
						ok = sampleData > (baselineData - baselinePercentage);
					} else {
						ok = sampleData < baselineData + baselinePercentage;
					}
					this.status = ok ? status.PASSED : status.FAILED;

					this.checkOutput = (
						ok
							? `No spike detected. ${sampleData} in the last ${this.timeframe} days is not more than ${this.threshold * 100}% ${this.direction} ${baselineData} found in the same period ${this.baselinePeriod} days ago.`
							: `Spike detected.${sampleData} in the last ${this.timeframe} days is more than ${this.threshold * 100}% ${this.direction} ${baselineData} found in the same period, ${this.baselinePeriod} days ago.`
					) + `\n${this.query}`;

			}
		}).catch(err => {
			logger.error({ event: `${logEventPrefix}_ERROR`, url: this.query }, err);
			this.status = status.PASSED;
			this.checkOutput = 'Keen spike check failed to fetch data: ' + err.message;
		});
	}
}

module.exports = KeenSpikeCheck;
