# n-health [![CircleCI](https://circleci.com/gh/Financial-Times/n-health.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-health)

Makes it easy to add a variety of healthchecks to an app.

## Adding Health Checks
To Add more health checks create a new file in the `config` directory.  It should be a .js file which exports an object.  The object must have the following properties:

* name: A name for the healthcheck - is supposed to match to a name in the CMDB, ideally
* description: Test description for the checks - for reference only
* checks: Array of checks - see below for check config

## Standard check options

* name, severity, businessImpact, technicalSummary and panicGuide are all required. See the [specification](https://docs.google.com/document/edit?id=1ftlkDj1SUXvKvKJGvoMoF1GnSUInCNPnNGomqTpJaFk) for details
* interval: time between checks in milliseconds or any string compatible with [ms](https://www.npmjs.com/package/ms) [default: 1minute]
* type: The type of check (see below)
* officeHoursOnly: [default: false] For queries that will probably fail out of hours (e.g. Internet Explorer usage, B2B stuff), set this to true and the check will pass on weekends and outside office hours. Use sparingly.

## Healthcheck types and options

### pingdom
Will poll the pingdom API to get the status of a specific check

* checkId: The id of the check in pingdom

### responseCompare
Fetches from multiple urls and compares the responses. Useful to check that replication is working

* urls: An array of urls to call
* comparison: Type of comparison to apply to the responses (Only "equal" so far

### json
Calls a url, gets some json and runs a callback to check its form

* url: url to call and get the json
* fetchOptions: Object to pass to fetch, see https://www.npmjs.com/package/node-fetch#options for more information.
* callback: A function to run on the response.  Accepts the parsed json as an argument and should return true or false

### aggregate
Reports on the status of other checks.  Useful if you have a multi-region service and, if one check fails it is not as bad as if ALL the checks fail.

* watch: Array of names of checks to aggregate
* mode: Aggregate mode.  I think "atLeastOne" is the only valid option so far

### graphiteSpike
Compares current and historical graphite metrics to see if there is a spike

* numerator: [required] Name of main graphite metric to count (may contain wildcards)
* divisor: [optional] Name of graphite metric to divide by (may contain wildcards)
* normalize: [optional] Boolean indicating whether to normalize to adjust for difference in size between sample and baseline timescales. Default is `true` if no divisor specified, `false` otherwise.
* samplePeriod: [default: '10min'] Length of time to count metrics for a sample of current behaviour
* baselinePeriod: [default: '7d'] Length of time to count metrics for to establish baseline behaviour
* direction: [default: 'up'] Direction in which to look for spikes; 'up' = sharp increase in activity, 'down' = sharp decrease in activity
* threshold: [default: 3] Amount of difference between current and baseline activity which registers as a spike e.g. 5 means current activity must be 5 times greater/less than the baseline activity

### graphiteThreshold
Checks whether the value of a graphite metric has crossed a threshold

* metric: [required] Name of graphite metric to count (may contain wildcards)
* threshold: [required] Value to check the metrics against
* samplePeriod: [default: '10min'] Length of time to count metrics for a sample of current behaviour
* direction: [default: 'above'] Direction on which to trigger the healthcheck;
	- 'above' = alert if value goes above the threshold
	- 'below' = alert if value goes below the threshold

### graphiteWorking

Checks if the value of a graphite metric has received data recently.

* metric: [required] Name of graphite metric to count (may contain wildcards)
	- Use `summarize` if the metric receives data infrequently, e.g. `summarize(next.heroku.next-article.some-infrequent-periodic-metric, '30mins', 'sum', true)`
* time: [default: '-5minutes'] Length of time to count metrics

### cloudWatchThreshold
Checks whether the value of a CloudWatch metric has crossed a threshold

_Note: this assumes that `AWS_ACCESS_KEY` & `AWS_SECRET_ACCESS_KEY` are implictly available as environment variables on process.env_


* cloudWatchRegion = [default 'eu-west-1'] AWS region the metrics are stored
* cloudWatchMetricName = [required] Name of the CloudWatch metric to count
* cloudWatchNamespace = [required] Namespace the metric resides in
* cloudWatchStatistic = [default 'Sum'] Data aggregation type to return
* cloudWatchDimensions = Optional array of metric data to query
* samplePeriod: [default: 300] Length of time in seconds to count metrics for a sample of current behaviour
* threshold: [required] Value to check the metrics against
* direction: [default: 'above'] Direction on which to trigger the healthcheck;
	- 'above' = alert if value goes above the threshold
	- 'below' = alert if value goes below the threshold

### cloudWatchAlarm
Checks whether the state of a CloudWatch alarm is health

_Note: this assumes that `AWS_ACCESS_KEY` & `AWS_SECRET_ACCESS_KEY` are implictly available as environment variables on process.env_

* cloudWatchRegion = [default 'eu-west-1'] AWS region the metrics are stored
* cloudWatchAlarmName = [required] Name of the CloudWatch alarm to check

### keenThreshold
Checks whether the result of a keen query for a metric has crossed a threshold

_Note: this assumes that `KEEN_READ_KEY` & `KEEN_PROJECT_ID` are implicitly available as environment variables on process.env_

* query: [required] Query to run to get a count, in the format of [keen-query](https://github.com/Financial-Times/keen-query).
* threshold: [required] Value to check the metric against
* timeframe: [default: 'this_60_minutes'] timeframe to run keen query against.
* direction: [default: 'below'] Direction on which to trigger the healthcheck;
	- 'above' = alert if value goes above the threshold
	- 'below' = alert if value goes below the threshold

_Warning_: Keen sometimes has a lag before ingesting, particularly during high traffic periods. It's recommended to have a minimum timeframe of 60 minutes, if not more.

### keenSpike
Checks current keen data for a spike of a defined percentage above/below historical keen data from the same period, a defined number of days ago.

_Note: this assumes that `KEEN_READ_KEY` & `KEEN_PROJECT_ID` are implicitly available as environment variables on process.env_

* query: [required] Query to run to get a count, in the format of [keen-query](https://github.com/Financial-Times/keen-query).
* threshold: [default: 0.2] Percentage value to check the metric against e.g. 0.2 checks if current data is more than 20% above/below historical data.
* timeframe: [default: '2'] Number of days to run sample and baseline keen queries against.
* baselinePeriod: [default: '7'] Number of days ago to run baseline keen query e.g. if timeframe is '2', the default baselinePeriod will be 7-9 days ago.
* direction: [default: 'below'] Direction on which to trigger the healthcheck;
	- 'above' = alert if value goes above the threshold
	- 'below' = alert if value goes below the threshold

_Warning_: Keen sometimes has a lag before ingesting, particularly during high traffic periods. It's recommended to have a minimum timeframe of 60 minutes, if not more.
