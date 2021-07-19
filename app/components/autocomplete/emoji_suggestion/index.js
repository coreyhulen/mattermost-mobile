// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {addReactionToLatestPost} from '@actions/views/emoji';
import {autocompleteCustomEmojis} from '@mm-redux/actions/emojis';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {selectEmojisByName} from '@selectors/emojis';

import EmojiSuggestion from './emoji_suggestion';

const appsTakeOverProps = {
    emojis: [],
    customEmojisEnabled: false,
    theme: {},
};

function mapStateToProps(state, ownProps) {
    if (ownProps.appsTakeOver) {
        // Return empty values for the required fields.
        return appsTakeOverProps;
    }

    const emojis = selectEmojisByName(state);

    return {
        emojis,
        customEmojisEnabled: getConfig(state).EnableCustomEmoji === 'true',
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            addReactionToLatestPost,
            autocompleteCustomEmojis,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(EmojiSuggestion);
