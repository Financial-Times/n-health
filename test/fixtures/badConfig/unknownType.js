'use strict';

module.exports = {
	name: 'bad checks with unknown type',
	description: '',
	checks: [
		{
			type: 'some-type-of-check-which-does-not-exist',
			name: 'Unknown test',
			severity: 3,
			businessImpact: 'Something bad',
			technicalSummary: 'Type things',
			panicGuide: 'No need to panic',
			interval: '1m'
		},
		{
			type: 'graphiteThreshold',
			name: 'A Graphite check',
			severity: 3,
			businessImpact: 'Something bad',
			technicalSummary: 'Type things',
			panicGuide: 'No need to panic',
			interval: '1m',
			metric: 'foo.bar'
		}
	]
};
