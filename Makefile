node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

IGNORE_A11Y = true

.PHONY: test

test-unit:
	KEEN_READ_KEY=123 KEEN_PROJECT_ID=abc FT_GRAPHITE_KEY=123 HEROKU_AUTH_TOKEN=token mocha

test-int:
	mocha int-tests/ -r loadvars.js

test: verify test-unit
