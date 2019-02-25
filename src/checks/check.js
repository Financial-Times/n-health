'use strict';
const status = require('./status');
const ms = require('ms');
const logger = require('@financial-times/n-logger').default;
const raven = require('@financial-times/n-raven');

const isOfficeHoursNow = () => {
	const date = new Date();
	const hour = date.getHours();
	const day = date.getDay();
	return (day !== 0 && day !== 6) && (hour > 8 && hour < 18); //exclude saturday, sunday and out of office hours
};

class Check {
	constructor(opts) {
		[
			'name',
			'severity',
			'businessImpact',
			'panicGuide',
			'technicalSummary'
		].forEach(prop => {
			if(!opts[prop]) {
				throw new Error(`${prop} is required for every healthcheck`);
			}
		})

		if(this.start !== Check.prototype.start || this._tick !== Check.prototype._tick) {
			throw new Error(`Do no override native start and _tick methods of n-health checks.
They provide essential error handlers. If complex setup is required, define
an init method returning a Promise`)
		}

		this.name = opts.name;
		this.severity = opts.severity;
		this.businessImpact = opts.businessImpact;
		this.technicalSummary = opts.technicalSummary;
		this.officeHoursOnly = opts.officeHoursOnly;
		this.interval = typeof opts.interval === 'string' ? ms(opts.interval) : (opts.interval || 60000);
		this.panicGuide = opts.panicGuide;
		this.status = status.PENDING;
		this.lastUpdated = null;
	}

	init() {}

	async start() {
		await this.init();

		this.int = setInterval(this._tick.bind(this), this.interval);
		this._tick();
	}

	async _tick() {
		try {
			await this.tick()
		} catch(err){
			logger.error({ event: 'FAILED_HEALTHCHECK_TICK', name: this.name }, err)
			raven.captureError(err);
			this.status = status.ERRORED;
			this.checkOutput = 'Healthcheck failed to execute';
		}

		this.lastUpdated = new Date();
	}

	stop() {
		clearInterval(this.int);
	}

	getStatus() {
		const output = {
			name: this.name,
			ok: this.status === status.PASSED,
			severity: this.severity,
			businessImpact: this.businessImpact,
			technicalSummary: this.technicalSummary,
			panicGuide: this.panicGuide,
			// When the tick errors we need to make sure we clear any checkOutputs set by clever getters and setters
			// in child healthcheck classes
			checkOutput: this.status === status.ERRORED ? 'Healthcheck failed to execute' : this.checkOutput
		};

		if(this.officeHoursOnly && !isOfficeHoursNow()) {
			output.ok = true;
			output.checkOutput = 'This check is not set to run outside of office hours';
		} else if(this.lastUpdated) {
			output.lastUpdated = this.lastUpdated.toISOString();
			let shouldHaveRun = Date.now() - (this.interval + 1000);
			if(this.lastUpdated.getTime() < shouldHaveRun){
				output.ok = false;
				output.checkOutput = 'Check has not run recently';
			}
		}

		return output;
	}
}

module.exports = Check;
