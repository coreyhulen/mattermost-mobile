// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import fs from 'fs';

import FormData from 'form-data';

import client from './client';

export const getResponseFromError = (err) => {
    const {response} = err;
    if (!response) {
        const message = `No response from server at "${err.config.baseURL}".
If testing against a server other than the default local instance, you may set the server URL via "SITE_URL" environment variable.
`;

        // Throw an error instead of failing silently
        throw new Error(message);
    }

    const {data, status} = response;

    // Explicitly print out response data from server for ease of debugging
    console.warn(data); // eslint-disable-line no-console

    return {error: data, status};
};

export const apiUploadFile = async (name, absFilePath, requestOptions = {}) => {
    if (!fs.existsSync(absFilePath)) {
        return {error: {message: `File upload error. "${name}" file does not exist at ${absFilePath}`}};
    }

    const formData = new FormData();
    formData.append(name, fs.createReadStream(absFilePath));

    try {
        return await client.request({
            ...requestOptions,
            data: formData,
            headers: formData.getHeaders(),
        });
    } catch (err) {
        return getResponseFromError(err);
    }
};
