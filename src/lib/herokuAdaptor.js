'use strict';
const ms = require('ms');
const fetch = require('node-fetch');

let url = '/dyno/errors?process_type=web&start_time=2016-04-18T09%3A30%3A00.000Z&end_time=2016-04-19T09%3A20%3A00.000Z&step=10m';

function getErrorMetrics(app, duration){
	if(!process.env.HEROKU_AUTH_TOKEN){
		let err =  new Error('HEROKU_AUTH_TOKEN env var required');
		return Promise.reject(err);
	}
	
	let durationMs = ms(duration);
	let endTime = new Date();
	let startTime = new Date(endTime - durationMs);
	let step = ms(durationMs / 10);
	let url = `https://api.metrics.herokai.com/metrics/${app}/dyno/errors?process_type=web&start_time=${startTime.toISOString()}&end_time=${endTime.toISOString()}&step=${step}`;
	return fetch(url,
		{
			headers:{
				'Authorization': 'Bearer ' + process.env.HEROKU_AUTH_TOKEN
			}
		}
	)
		.then(response => {
			if(!response.ok){
				let err = new Error(`Failed to fetch ${url}.  Response was ${response.status}`);
				err.type = 'HEROKU_API_ERROR';
			}

			return response.json();
		});
}

function getTotalErrorCount(data, code){
	let errors = data.data[code];
	if(!errors || !errors.length || !errors.reduce){
		return 0;
	}

	return errors.reduce((total, count) => {
		return count ? total + count : total;
	}, 0);
}

module.exports = {
	getErrorMetrics: getErrorMetrics,
	getR14Count: (app, duration) => {
		return getErrorMetrics(app, duration)
			.then(data => getTotalErrorCount(data, 'R14'))
	}
};
