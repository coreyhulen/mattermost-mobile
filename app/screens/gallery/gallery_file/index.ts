// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {canDownloadFilesOnMobile} from '@mm-redux/selectors/entities/general';

import GalleryFile from './gallery_file';

import type {GlobalState} from '@mm-redux/types/store';

function mapStateToProps(state: GlobalState) {
    return {
        canDownloadFiles: canDownloadFilesOnMobile(state),
    };
}

export default connect(mapStateToProps)(GalleryFile);
