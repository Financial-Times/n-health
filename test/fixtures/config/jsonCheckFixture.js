'use strict';
module.exports = {
	name: 'json check fixture',
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
			interval: '1s',
			callback: function (json) {
				return json.propertyToCheck;
			},
			fetchOptions: {
				headers: {
					ApiKey: 'ApiKey'
				}
			}
		}
	]
};
