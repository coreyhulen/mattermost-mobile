// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withKnobs, select} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react-native';

import React from 'react';

import Loading from './loading';

storiesOf('Loading Icon Story', module).
    addDecorator(withKnobs).
    add('loading icon', () => (
        <Loading
            size={select('size', {Large: 'large', Small: 'small'}, 'large')}
            color={select('color', {Red: 'red', Blue: 'blue', Yellow: 'yellow', Black: 'black'}, 'red')}
        />
    ));
