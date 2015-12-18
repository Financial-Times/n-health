.PHONY: test


verify:
	nbt verify --skip-layout-checks

unit-test:
	export HOSTEDGRAPHITE_READ_APIKEY=test-graph-key; mocha test/all.spec.js

test: unit-test verify
