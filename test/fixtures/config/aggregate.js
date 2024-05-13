'use strict';
module.exports = {
	name: 'aggregate check fixture',
	description: '',
	checks: [
		{
			type: 'json',
			name: 'test1',
			url: 'http://pretendurl.com',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: "Don't Panic",
			checkResult: {
				PASSED: 'Text if check passed',
				FAILED: 'Text is check failed',
				PENDING: 'This check has not yet run'
			},
			interval: '1s'
		},
		{
			type: 'json',
			name: 'test2',
			url: 'http://pretendurl.com',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: "Don't Panic",
			checkResult: {
				PASSED: 'Text if check passed',
				FAILED: 'Text is check failed',
				PENDING: 'This check has not yet run'
			},
			interval: '1s'
		},
		{
			type: 'aggregate',
			severity: 3,
			name: 'name',
			watch: ['test1', 'test2'],
			mode: 'atLeastOne',
			interval: '1s',
			panicGuide: "Don't Panic",
			technicalSummary: 'god knows',
			businessImpact: 'blah'
		}
	]
};
