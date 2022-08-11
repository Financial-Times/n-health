const fetch = require('node-fetch');
const logger = require('@financial-times/n-logger').default;
const Check = require('./check');
const status = require('./status');

const defaultPanicGuide = 'Check whether the app has been migrated to use log drains. If it has been migrated then the log drain is either misconfigured or missing, and can be corrected by following the migration guide (https://financialtimes.atlassian.net/wiki/spaces/DS/pages/7883555001/Migrating+an+app+to+Heroku+log+drains).';
const defaultTechnicalSummary = 'Uses the Heroku API to fetch Heroku log drains for the application and verify that they\'re configured to drain into the correct Splunk endpoint.';
const defaultBusinessImpact = 'Logs may not be captured in Splunk for this application. It may not be possible to debug other issues while log drains are not configured.';
const defaultSeverity = 2;

class HerokuLogDrainCheck extends Check {

	constructor({
		panicGuide = defaultPanicGuide,
		technicalSummary = defaultTechnicalSummary,
		businessImpact = defaultBusinessImpact,
		severity = defaultSeverity,
		herokuAuthToken = process.env.HEROKU_AUTH_TOKEN,
		herokuAppId = process.env.HEROKU_APP_ID,
		...options
	}) {
		super({ panicGuide, technicalSummary, businessImpact, severity, ...options });
		this.herokuAuthToken = herokuAuthToken;
		this.herokuAppId = herokuAppId;
	}

	validateHerokuConfig() {
		if (!this.herokuAuthToken) {
			throw new Error('A Heroku auth token is required to run this check. `HEROKU_AUTH_TOKEN` env var was missing');
		}
		if (!this.herokuAppId) {
			throw new Error('A Heroku app ID is required to run this check. Please enable the runtime-dyno-metadata labs feature');
		}
	}

	get logDrainApiEndpoint() {
		return `https://api.heroku.com/apps/${this.herokuAppId}/log-drains`;
	}

	async getLogDrains() {
		const response = await fetch(this.logDrainApiEndpoint, {
			headers: {
				accept: 'application/vnd.heroku+json; version=3',
				authorization: `Bearer ${this.herokuAuthToken}`,
				'user-agent': `Heroku App ${this.herokuAppId}`
			}
		});
		if (!response.ok) {
			throw new Error(`heroku responded with a ${response.status} status code`);
		}
		return response.json();
	}

	validateLogDrains(logDrains) {
		if (!logDrains.length) {
			throw new Error('app has no log drain configured');
		}
		if (logDrains.length > 1) {
			throw new Error('app has more than one log drain configured');
		}
		this.validateLogDrainUrl(`${logDrains[0]?.url}`);
	}

	validateLogDrainUrl(url) {
		let parsedUrl;
		try {
			parsedUrl = new URL(url);
		} catch (error) {
			throw new Error('log drain is not a valid URL');
		}

		if (
			parsedUrl.protocol !== 'https:' ||
			parsedUrl.hostname !== 'http-inputs-financialtimes.splunkcloud.com' ||
			parsedUrl.pathname !== '/services/collector/raw' ||
			parsedUrl.username !== 'x' ||
			!parsedUrl.password
		) {
			throw new Error('log drain URL does not match "https://x:<token>@http-inputs-financialtimes.splunkcloud.com/services/collector/raw"');
		}

		const hasCorrectSourceParam = (
			process.env.SYSTEM_CODE ?
				parsedUrl.searchParams.get('source') === process.env.SYSTEM_CODE :
				true
		);
		if (!parsedUrl.searchParams.get('source') || !hasCorrectSourceParam) {
			throw new Error('log drain source parameter is not set to the application system code');
		}

		if (parsedUrl.searchParams.get('sourcetype')) {
			throw new Error('log drain sourcetype parameter is present; sourcetype should instead be specified on the HEC (HTTP Event Collector) token');
		}

		if (!parsedUrl.searchParams.get('host')) {
			throw new Error('log drain host parameter is not set');
		}

		if (!parsedUrl.searchParams.get('channel')) {
			throw new Error('log drain channel parameter is not set');
		}
	}

	async tick() {
		try {
			this.validateHerokuConfig();
			const logDrains = await this.getLogDrains();

			try {
				this.validateLogDrains(logDrains);
			} catch (error) {
				this.status = status.FAILED;
				this.checkOutput = `Heroku log drains are misconfigured: ${error.message}`;
				return;
			}

			this.status = status.PASSED;
			this.checkOutput = 'Heroku log drain configuration is correct';

		} catch (error) {
			logger.error('Failed to get Heroku log drain information', error);
			this.status = status.FAILED;
			this.checkOutput = `Heroku log drain configuration check failed to fetch data: ${error.message}`;
		}
	}
}

module.exports = HerokuLogDrainCheck;
