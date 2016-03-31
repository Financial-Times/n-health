.PHONY: test

install:
	npm install

verify:
	nbt verify --skip-layout-checks

unit-test:
	export HOSTEDGRAPHITE_READ_APIKEY=test-graph-key; mocha

test: unit-test verify
