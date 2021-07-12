// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const path = require('path');

const sanitizeFilename = require('sanitize-filename');

const SANITIZE_OPTIONS = {replacement: '_'};
const sanitize = (filename) => sanitizeFilename(filename, SANITIZE_OPTIONS);

class CustomPathBuilder {
    constructor({rootDir}) {
        this.rootDir = rootDir;
    }

    buildPathForTestArtifact(artifactName, testSummary = null) {
        const fullName = (testSummary && testSummary.fullName) || '';
        const segments = [this.rootDir, sanitize(fullName), sanitize(artifactName)];
        return path.join(...segments.filter(Boolean));
    }
}

module.exports = ({rootDir}) => {
    return new CustomPathBuilder({rootDir});
};
