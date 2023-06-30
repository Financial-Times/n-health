module.exports = {
	name: 'graphite check fixture',
	description: '',
	checks: [
		{
			type: 'graphiteWorking',
			name: 'test1',
			metric: 'next.fastly.f8585BOxnGQDMbnkJoM1e.all.requests',
			severity: 2,
			businessImpact: 'loss of millions in pounds'
		},
		{
			type: 'graphiteWorking',
			name: 'test1',
			metric: 'next.fastly.f8585BOxnGQDMbnkJoM1e.all.requests',
			severity: 2,
			businessImpact: 'loss of millions in pounds',
			time : "-30minutes",
			interval:10,
			override:{
				weekend : {
					time : "-60minutes",
					metric: "next.fastly.f8585BOxnGQDMbnkJoM1e.weekend.requests"
				}
			}
		}
	]
};
