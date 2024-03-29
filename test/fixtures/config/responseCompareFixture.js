'use strict';

module.exports = {
	name: 'name',
	descriptions: '',
	checks: [
		{
			type: 'responseCompare',
			urls: ['http://url1.com', 'http://url2.com'],
			comparison: 'equal',
			name: 'response check',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: "Don't Panic",
			interval: '1s'
		},
		{
			type: 'responseCompare',
			urls: ['http://url1.com', 'http://url2.com'],
			comparison: 'equal',
			name: 'response check',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: "Don't Panic",
			interval: '1s',
			headers: {
				'x-api-key': 'mysecret'
			},
			normalizeResponse: (resp) => resp.replace(/1234/, 'dddd')
		}
	]
};
