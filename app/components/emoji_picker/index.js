// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Fuse from 'fuse.js';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {incrementEmojiPickerPage} from '@actions/views/emoji';
import {getCustomEmojis} from '@mm-redux/actions/emojis';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {isLandscape} from '@selectors/device';
import {selectEmojisByName, selectEmojisBySection} from '@selectors/emojis';

import EmojiPicker from './emoji_picker';

function mapStateToProps(state) {
    const emojisBySection = selectEmojisBySection(state);
    const emojis = selectEmojisByName(state);
    const options = {
        shouldSort: false,
        ignoreLocation: true,
        includeMatches: true,
        findAllMatches: true,
    };

    const list = emojis.length ? emojis : [];
    const fuse = new Fuse(list, options);

    return {
        fuse,
        emojis,
        emojisBySection,
        isLandscape: isLandscape(state),
        theme: getTheme(state),
        customEmojisEnabled: getConfig(state).EnableCustomEmoji === 'true',
        customEmojiPage: state.views.emoji.emojiPickerCustomPage,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            getCustomEmojis,
            incrementEmojiPickerPage,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(EmojiPicker);
