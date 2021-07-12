// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';

import ReactionPicker from './reaction_picker';

function mapStateToProps(state) {
    return {
        theme: getTheme(state),
        recentEmojis: state.views.recentEmojis,
    };
}

export default connect(mapStateToProps)(ReactionPicker);
