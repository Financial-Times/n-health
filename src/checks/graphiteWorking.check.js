const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const logger = require('@dotcom-reliability-kit/logger');
const fetchres = require('fetchres');

const logEventPrefix = 'GRAPHITE_WORKING_CHECK';

function badJSON(message) {
	const err = new Error(message);
	logger.error({ event: `${logEventPrefix}_BAD_JSON` }, err);
	throw err;
}

class GraphiteWorkingCheck extends Check {
	constructor(options) {
		options.technicalSummary =
			options.technicalSummary ||
			'There has been no metric data for a sustained period of time';
		options.panicGuide =
			options.panicGuide ||
			'Check this is up and running. Check this has been able to send metrics to Graphite (see Heroku and Splunk logs). Check Graphite has not been dropping metric data.';

		super(options);

		this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;
		if (!this.ftGraphiteKey) {
			throw new Error('You must set FT_GRAPHITE_KEY environment variable');
		}

		this.metric = options.metric || options.key;
		if (!this.metric) {
			throw new Error(
				`You must pass in a metric for the "${options.name}" check - e.g., "next.heroku.article.*.express.start"`
			);
		}

		const fromTime = options.time || '-5minutes';
		this.url = encodeURI(
			`https://graphitev2-api.ft.com/render/?target=${this.metric}&from=${fromTime}&format=json`
		);

		this.checkOutput = 'This check has not yet run';
	}

	async tick() {
		try {
			const json = await fetch(this.url, {
				headers: { key: this.ftGraphiteKey }
			}).then(fetchres.json);

			if (!json.length) {
				badJSON('returned JSON should be an array');
			}

			if (!json[0].datapoints) {
				badJSON('No datapoints property');
			}

			if (json[0].datapoints.length < 1) {
				badJSON('Expected at least one datapoint');
			}

			const simplifiedResults = json.map((result) => {
				let nullsForHowManySeconds;

				if (result.datapoints.every((datapoint) => datapoint[0] === null)) {
					nullsForHowManySeconds = Infinity;
				} else {
					// This sums the number of seconds since the last non-null result at the tail of the list of metrics.
					nullsForHowManySeconds = result.datapoints
						.map((datapoint, index, array) => [
							datapoint[0],
							index > 0 ? datapoint[1] - array[index - 1][1] : 0
						])
						.reduce(
							(xs, datapoint) =>
								datapoint[0] === null ? xs + datapoint[1] : 0,
							0
						);
				}

				const simplifiedResult = {
					target: result.target,
					nullsForHowManySeconds
				};
				logger.debug(
					{ event: `${logEventPrefix}_NULLS_FOR_HOW_LONG` },
					simplifiedResult
				);
				return simplifiedResult;
			});

			const failedResults = simplifiedResults.filter(
				(r) => r.nullsForHowManySeconds >= 180
			);

			if (failedResults.length === 0) {
				this.status = status.PASSED;
				this.checkOutput = `${this.metric} has data`;
			} else {
				this.status = status.FAILED;
				this.checkOutput = failedResults
					.map(
						(r) =>
							`${r.target} has been null for ${Math.round(
								r.nullsForHowManySeconds / 60
							)} minutes.`
					)
					.join(' ');
			}
		} catch (err) {
			logger.error({ event: `${logEventPrefix}_ERROR`, url: this.url }, err);
			this.status = status.FAILED;
			this.checkOutput = err.toString();
		}
	}
}

module.exports = GraphiteWorkingCheck;
