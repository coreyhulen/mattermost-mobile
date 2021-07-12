// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getDimensions} from '@selectors/device';

import SlideUpPanel from './slide_up_panel';

function mapStateToProps(state, ownProps) {
    const dimensions = getDimensions(state);
    return {
        containerHeight: ownProps.containerHeight || dimensions.deviceHeight,
    };
}

export default connect(mapStateToProps, null, null, {forwardRef: true})(SlideUpPanel);
