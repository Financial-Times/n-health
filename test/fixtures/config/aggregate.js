'use strict';
module.exports = {
	name: 'aggregate check fixture',
	description: '',
	checks: [
		{
			type: 'graphiteThreshold',
			name: 'test1',
			metric: 'next.fake.metric',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			interval: '1s'
		},
		{
			type: 'graphiteThreshold',
			name: 'test2',
			metric: 'next.fake.metric',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			interval: '1s'
		},
		{
			type: 'aggregate',
			severity: 3,
			name: 'name',
			watch: ['test1', 'test2'],
			mode: 'atLeastOne',
			interval: '1s',
			panicGuide: 'Don\'t Panic',
			technicalSummary: 'god knows',
			businessImpact: 'blah',
		}
	]
};
