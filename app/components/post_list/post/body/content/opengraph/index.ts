// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {Preferences} from '@mm-redux/constants';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getOpenGraphMetadataForUrl as selectOpenGraphMetadataForUrl} from '@mm-redux/selectors/entities/posts';
import {getBool} from '@mm-redux/selectors/entities/preferences';

import Opengraph from './opengraph';

import type {Post, PostMetadata} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    isReplyPost: boolean;
    post: Post;
    theme: Theme;
}

function selectOpenGraphData(url: string, metadata?: PostMetadata) {
    if (!metadata || !metadata.embeds) {
        return undefined;
    }

    return metadata.embeds.find((embed) => {
        return embed.type === 'opengraph' && embed.url === url ? embed.data : undefined;
    });
}

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const {post} = ownProps;
    const config = getConfig(state);
    const link = post.metadata?.embeds?.[0]?.url;
    const previewsEnabled = getBool(state, Preferences.CATEGORY_DISPLAY_SETTINGS, Preferences.LINK_PREVIEW_DISPLAY, true);

    const removeLinkPreview = post.props?.remove_link_preview === 'true';

    let openGraphData: Record<string, any> | undefined = selectOpenGraphMetadataForUrl(state, post.id, link);
    if (!openGraphData) {
        const data = selectOpenGraphData(link, post.metadata);
        openGraphData = data?.data;
    }

    return {
        openGraphData,
        showLinkPreviews: previewsEnabled && config.EnableLinkPreviews === 'true' && !removeLinkPreview,
    };
}

export default connect(mapStateToProps)(Opengraph);
