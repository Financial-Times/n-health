module.exports = {
	name: 'pingdom-fixture',
	description: '',
	checks: [
		{
			type: 'pingdom',
			name: 'test',
			checkId: '1571768',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic'
		}
	]
};
