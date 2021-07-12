// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {getStorybookUI, configure} from '@storybook/react-native';

import {Platform} from 'react-native';

import {STORYBOOK_HOST, STORYBOOK_PORT} from '@env';

// load react-native addons for storybook rn
import '@storybook/addon-ondevice-knobs/register';

import {loadStories} from './storyLoader';

// import stories
configure(() => {
    loadStories();
}, module);

// this seems to be required to get react-native-dotenv to load the env variables
// properly. Possibly something related to babel-loader
const port = STORYBOOK_PORT;
const host = STORYBOOK_HOST;

// Refer to https://github.com/storybookjs/storybook/tree/master/app/react-native#start-command-parameters
// To find allowed options for getStorybookUI
const StorybookUIRoot = getStorybookUI({
    port: port || 7007,
    host: host || (Platform.OS === 'ios' ? 'localhost' : '10.0.2.2'),
    onDeviceUI: true,
    resetStorybook: true,
});

export default StorybookUIRoot;
