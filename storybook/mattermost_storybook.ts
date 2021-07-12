// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import DevMenu from 'react-native-dev-menu';
import {Navigation} from 'react-native-navigation';

import {goToScreen} from '@actions/navigation';
import {withReduxProvider} from '@screens';
DevMenu.addItem('StoryBook', () => goToScreen('StoryBook', 'StoryBook'));

Navigation.registerComponent('StoryBook', () => withReduxProvider(require('../storybook').default));
