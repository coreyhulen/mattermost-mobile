// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-console */
const fs = require('fs');
const resolve = require('path').resolve;

const modulesRegex = /\/(node_modules)/;

// This script will let the react native packager what modules to include
// in the main bundle and what modules to blacklist from the inline requires
// this modules are taken from the modulePaths.js file

const config = {
    transformer: {
        getTransformOptions: (entryFile, {platform}) => {
            console.log('BUILDING MODULES FOR', platform);
            const moduleMap = {};
            let modulePaths = [];
            if (platform === 'android') {
                modulePaths = require('./packager/modules.android');
            } else {
                modulePaths = require('./packager/modules.ios');
            }
            modulePaths.forEach((path) => {
                let fsFile = path;
                if (path.match(modulesRegex).length > 1) {
                    fsFile = path.replace(modulesRegex, '');
                }

                if (fs.existsSync(fsFile)) {
                    moduleMap[resolve(path)] = true;
                }
            });

            return {
                preloadedModules: moduleMap,
                transform: {
                    inlineRequires: {
                        blockList: moduleMap,
                    },
                },
            };
        },
    },
    maxWorkers: 4,
};

module.exports = config;
