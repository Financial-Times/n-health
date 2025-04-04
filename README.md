# n-health

Collection of healthcheck classes to use in your nodejs application.   
To create a new health check, please follow the [current standard](https://docs.google.com/document/edit?id=1ftlkDj1SUXvKvKJGvoMoF1GnSUInCNPnNGomqTpJaFk)

## Usage

`n-health` exports a function that loads [healthcheck configuration](#healthcheck-configuration) files from a folder:

```js
const nHealth = require('n-health');

const healthChecks = nHealth(
	'path/to/healthchecks' // by default, `/healthchecks` or `/config` in the root of your application
)
```

It returns an object with an `asArray` method. If you're using `n-express`, pass this array as the `healthChecks` option:

```js
const nExpress = require('@financial-times/n-express')

nExpress({
	healthChecks: healthChecks.asArray()
})
```

If you're not using n-express, you should create a `/__health` endpoint which returns the following JSON structure (see the [specification](https://docs.google.com/document/edit?id=1ftlkDj1SUXvKvKJGvoMoF1GnSUInCNPnNGomqTpJaFk) for details):

```json
{
	"schemaVersion": 1,
	"name": "app name",
	"systemCode": "biz-ops system code",
	"description": "human readable description",
	"checks": []
}
```

`checks` should be an array of check status objects. You can get this by calling `getStatus` on each item in the array, for example with `healthChecks.asArray().map(check => check.getStatus())`.

### Custom healthchecks

If you require a healthcheck not provided by n-health, you can pass a second argument to `nHealth`, which should be a path to a folder of files exporting custom healthcheck classes. These modules should export a class that extends `n-health`'s `Check` class and implements the `tick` method, which is periodically called to update the check's `status`. It can also implement the `init` to do something when the check is first run. Both of these methods can be `async` if you need to do something like make a request.

```js
const {Check, status} = require('n-health');

class RandomCheck extends Check {
	tick() {
		this.status = Math.random() < 0.5 ? status.PASSED : status.FAILED;
	}
}

module.exports = RandomCheck;
```

See the [src/checks](src/checks) folder for some examples.

## Healthcheck configuration

A healthcheck config is a Javascript file that exports an object with these properties.

* `name`: A name for the healthcheck - is supposed to match to a name in biz-ops, ideally
* `description`: Test description for the checks - for reference only
* `checks`: Array of [check objects](#check-objects)

### Check objects

#### Common options

* `type`: The type of check, which should be one of the types below. That check type's options should also be included in the object as required.
* `name`, `severity`, `businessImpact`, `technicalSummary` and `panicGuide` are all required. See the [specification](https://docs.google.com/document/edit?id=1ftlkDj1SUXvKvKJGvoMoF1GnSUInCNPnNGomqTpJaFk) for details
* `interval`: time between checks in milliseconds or any string compatible with [ms](https://www.npmjs.com/package/ms) [default: 1minute]
* `officeHoursOnly`: [default: `false`] For queries that will probably fail out of hours (e.g. Internet Explorer usage, B2B stuff), set this to true and the check will pass on weekends and outside office hours (defined as 8am-6pm UTC). Use sparingly.

#### `responseCompare`
Fetches from multiple urls and compares the responses. Useful to check that replication is working

* `urls`: An array of urls to call
* `comparison`: Type of comparison to apply to the responses:
	- `'equal'` the check succeeds if all the responses have the same status

#### `json`
Calls a url, gets some json and runs a callback to check its form

* `url`: url to call and get the json
* `fetchOptions`: Object to pass to fetch, see https://www.npmjs.com/package/node-fetch#options for more information.
* `callback`: A function to run on the response. Accepts the parsed json as an argument and should return true or false

#### `aggregate`
Reports on the status of other checks. Useful if you have a multi-region service and, if one check fails it is not as bad as if ALL the checks fail.

* `watch`: Array of names of checks to aggregate
* `mode`: Aggregate mode:
	- `'atLeastOne'` the check succeeds if at least one of its subchecks succeeds

#### `graphiteSpike`

> [!CAUTION]
> The `graphiteSpike` check type has been removed. If you need to create alerts based on Graphite data you must now do so in the [grafana repo](https://github.com/Financial-Times/grafana).

#### `graphiteThreshold`
Checks whether the value of a graphite metric has crossed a threshold

> [!CAUTION]
> The `graphiteThreshold` check type has been removed. If you need to create alerts based on Graphite data you must now do so in the [grafana repo](https://github.com/Financial-Times/grafana).

#### `graphiteWorking`

> [!CAUTION]
> The `graphiteWorking` check type has been removed. If you need to create alerts based on Graphite data you must now do so in the [grafana repo](https://github.com/Financial-Times/grafana).

#### `cloudWatchThreshold`
Checks whether the value of a CloudWatch metric has crossed a threshold

_Note: this assumes that `AWS_ACCESS_KEY` & `AWS_SECRET_ACCESS_KEY` are implicitly available as environment variables on process.env_

* `cloudWatchRegion` = [default `'eu-west-1'`] AWS region the metrics are stored
* `cloudWatchMetricName` = [required] Name of the CloudWatch metric to count
* `cloudWatchNamespace` = [required] Namespace the metric resides in
* `cloudWatchStatistic` = [default `'Sum'`] Data aggregation type to return
* `cloudWatchDimensions` = Optional array of metric data to query
* `samplePeriod`: [default: `300`] Length of time in seconds to count metrics for a sample of current behaviour
* `threshold`: [required] Value to check the metrics against
* `direction`: [default: `'above'`] Direction on which to trigger the healthcheck:
	- `'above'` = alert if value goes above the threshold
	- `'below'` = alert if value goes below the threshold

#### `cloudWatchAlarm`
Checks whether the state of a CloudWatch alarm is health

_Note: this assumes that `AWS_ACCESS_KEY` & `AWS_SECRET_ACCESS_KEY` are implicitly available as environment variables on process.env_

* `cloudWatchRegion` = [default `'eu-west-1'`] AWS region the metrics are stored
* `cloudWatchAlarmName` = [required] Name of the CloudWatch alarm to check

#### `fastlyKeyExpiration`
Checks if the expiration date of a Fastly key is due for the next 2 weeks

_Note: there are some default properties_
** _panic guide: 'Contact the Slack channel #fastly-support to rotate the keys https://financialtimes.slack.com/archives/C2GFE1C9X'_
** _technicalSummary: 'Check the Fastly key in the api token information endpoint to obtain the expiration date'_
** _severity = 2_

* `fastlyKey` =  The value of the fastly key to check

_Note: if the expiration date is past, the severity level is 1_
