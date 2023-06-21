const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const log = require('@financial-times/n-logger').default;
const fetchres = require('fetchres');
const logEventPrefix = 'GRAPHITE_WORKING_CHECK';

function badJSON(message, json) {
    const err = new Error(message);
    log.error({ event: `${logEventPrefix}_BAD_JSON` }, err);
    throw err;
}


class GraphiteWorkingCheck extends Check {
    constructor (options) {
        options.technicalSummary = options.technicalSummary || 'There has been no metric data for a sustained period of time';
        options.panicGuide = options.panicGuide || 'Check this is up and running. Check this has been able to send metrics to Graphite (see Heroku and Splunk logs). Check Graphite has not been dropping metric data.';

        super(options);

        this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;
        if (!this.ftGraphiteKey) {
            throw new Error('You must set FT_GRAPHITE_KEY environment variable');
        }

        this.metric = options.metric || options.key;
        if (!this.metric) {
            throw new Error(`You must pass in a metric for the "${options.name}" check - e.g., "next.heroku.article.*.express.start"`);
        }

        this.time = options.time || '-5minutes';
        this.checkOutput = "This check has not yet run";
        this.override = options.override;
        this.initialState = {};
        this.isOverride = false;
        //store the initial status of the properties that are going to be override
        if(this.override){
            for(let conceptOverride in  this.override){
				for(let key in this.override[conceptOverride]){
					this.initialState[key] = this[key];
				}
            }
        }
        
    }
	get fromTime() {
		return this.time;
	}
    getUrl(){
        return encodeURI(`https://graphitev2-api.ft.com/render/?target=${this.metric}&from=${this.fromTime}&format=json`);
    }

    hookOverrides(){
        if(!this.override)
        return;
        if(this.override.weekend){
            if(this.isWeekend() && !this.isOverride){
                this.applyOverrides(this.override.weekend);
            }
            else if(this.isOverride){
                this.setInitialState();
            }
        }
    }

    setInitialState(){
        this.applyOverrides(this.initialState);
        this.isOverride = false;
    }

    applyOverrides(overrides){
        if(!overrides)
        return;
        Object.keys(overrides).forEach((key) => {
            this[key] = overrides[key];
        });
        this.isOverride = true;
    }
	isWeekend() {
		const date = new Date();
		const day = date.getDay(); // Sunday is 0, Saturday is 6
		return day === 0 || day === 6;
	}

    async tick() {
        try {
            this.hookOverrides();
            const json = await fetch(this.getUrl(), {
                headers: { key: this.ftGraphiteKey }
            }).then(fetchres.json);

            if(!json.length) {
                badJSON('returned JSON should be an array', json);
            }

            if(!json[0].datapoints) {
                badJSON('No datapoints property', json);
            }

            if(json[0].datapoints.length < 1) {
                badJSON('Expected at least one datapoint', json);
            }

            const simplifiedResults = json.map(result => {
                let nullsForHowManySeconds;

                if (result.datapoints.every(datapoint => datapoint[0] === null)) {
                    nullsForHowManySeconds = Infinity;
                } else {
                    // This sums the number of seconds since the last non-null result at the tail of the list of metrics.
                            nullsForHowManySeconds = result.datapoints
                                    .map((datapoint, index, array) => [datapoint[0], index > 0 ? datapoint[1] - array[index - 1][1]  : 0])
                                    .reduce((xs, datapoint) => datapoint[0] === null ? xs + datapoint[1] : 0, 0);
                        }

                const simplifiedResult = { target: result.target, nullsForHowManySeconds };
                log.info({ event: `${logEventPrefix}_NULLS_FOR_HOW_LONG` }, simplifiedResult);
                return simplifiedResult;
            });

            const failedResults = simplifiedResults.filter(r => r.nullsForHowManySeconds >= 180);

            if (failedResults.length === 0) {
                this.status = status.PASSED;
                this.checkOutput =`${this.metric} has data`;
            } else {
                this.status = status.FAILED;
                this.checkOutput = failedResults.map(r => `${r.target} has been null for ${Math.round(r.nullsForHowManySeconds / 60)} minutes.`).join(' ');
            }
        } catch(err) {
            log.error({ event: `${logEventPrefix}_ERROR`, url: this.getUrl() }, err);
            this.status = status.FAILED;
            this.checkOutput = err.toString();
        }
    }
}

module.exports = GraphiteWorkingCheck;

