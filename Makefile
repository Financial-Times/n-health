.PHONY: test


verify:
	nbt verify --skip-layout-checks | grep -v Warning

unit-test:
	mocha

test: verify unit-test

deploy-major:
	npm version major
	npm publish
	git push && git push --tags

deploy-minor:
	npm version minor
	npm publish
	git push && git push --tags

deploy-patch:
	npm version patch
	npm publish
	git push && git push --tags
