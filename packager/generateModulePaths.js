// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-console */
const execSync = require('child_process').execSync;
const fs = require('fs');

const pjson = require('../package.json');

const moduleNames = require('./moduleNames');

const localPrefix = `${pjson.name}/`;

// Transforming to Module Paths
// This script will convert the module names found in moduleNames.js
// to the absolute module path that we need.
const modulePaths = moduleNames.map((moduleName) => {
    if (moduleName.startsWith(localPrefix)) {
        return `./${moduleName.substring(localPrefix.length)}`;
    }
    if (moduleName.endsWith('.js') || moduleName.endsWith('.ts')) {
        return `./node_modules/${moduleName}`;
    }
    try {
        const result = execSync(
            `grep "@providesModule ${moduleName}" $(find . -name ${moduleName}\\\\.js) -l`,
        ).toString().trim().split('\n')[0];

        if (result != null) {
            return result;
        }
    } catch (e) {
        return null;
    }
    return null;
});

const paths = modulePaths.filter((path) => path != null).map((path) => `'${path}'`).join(',\n');

const fileData = `module.exports = [${paths}];`;

fs.writeFile('./packager/modulePaths.js', fileData, (err) => {
    if (err) {
        console.log(err);
    }

    console.log('Done');
});
