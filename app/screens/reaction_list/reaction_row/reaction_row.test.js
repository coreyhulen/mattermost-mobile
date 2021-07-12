// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import ReactionRow from './index';

describe('ReactionRow', () => {
    const baseProps = {
        emojiName: 'smile',
        teammateNameDisplay: 'username',
        theme: Preferences.THEMES.default,
        user: {id: 'user_id', username: 'username'},
    };

    test('should match snapshot, renderContent', () => {
        const wrapper = shallow(
            <ReactionRow {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
