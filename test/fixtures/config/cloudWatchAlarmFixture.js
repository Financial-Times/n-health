'use strict';
module.exports = {
	name: 'cloudwatch',
	descriptions: '',
	checks: [
		{
			type: 'cloudWatchAlarm',
			cloudWatchAlarmName: 'test',
			name: 'test',
			severity: 2,
			businessImpact: 'catastrophic',
			technicalSummary: 'god knows',
			panicGuide: "Don't Panic"
		}
	]
};
