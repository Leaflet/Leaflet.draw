#!/bin/bash

npm update

VERSION=$(node --eval "console.log(require('./package.json').version);")

npm test || exit 1

git checkout -b build

jake build[,,true]
jake docs

git add . -f

git commit -m "v$VERSION"

git tag v$VERSION -f
git push --tags -f

npm publish

git checkout master
git branch -D build
