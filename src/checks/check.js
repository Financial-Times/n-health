'use strict';
const status = require('./status');
const ms = require('ms');

class Check {

	constructor(opts){
		'name,severity,businessImpact,panicGuide,technicalSummary'
			.split(',')
			.forEach(prop => {
				if (!opts[prop]) {
					throw new Error(`${prop} is required for every healthcheck`);
				}
			})

		this.name = opts.name;
		this.severity = opts.severity;
		this.businessImpact = opts.businessImpact;
		this.technicalSummary = opts.technicalSummary;
		this.interval = typeof opts.interval === 'string' ? ms(opts.interval) : (opts.interval || 60000);
		this.panicGuide = opts.panicGuide;
		this.status = status.PENDING;
		this.lastUpdated = null;
	}

	start(){
		this.int = setInterval(this._tick.bind(this), this.interval);
		this._tick();
	}

	_tick () {
		return this.tick()
			.catch(() => {})
			.then(() => {
				this.lastUpdated = new Date();
			});
	}

	stop(){
		clearInterval(this.int);
	}

	getStatus(){
		const output = {
			name: this.name,
			ok: this.status === status.PASSED,
			severity: this.severity,
			businessImpact: this.businessImpact,
			technicalSummary: this.technicalSummary,
			panicGuide: this.panicGuide,
			checkOutput: this.checkOutput
		};
		if (this.lastUpdated) {
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
