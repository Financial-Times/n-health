'use strict';
module.exports = {
	name: 'graphite',
	descriptions : '',
	checks : [
		{
			type: 'graphiteThreshold',
			metric: 'metric.200',
			name: 'test',
			severity: 2,
			businessImpact: 'catastrophic',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic'
		}
	]
};
