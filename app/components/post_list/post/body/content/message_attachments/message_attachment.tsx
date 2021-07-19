// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import {getMarkdownBlockStyles, getMarkdownTextStyles} from '@utils/markdown';
import {getStatusColors} from '@utils/message_attachment_colors';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {isValidUrl, isSVGLink} from '@utils/url';

import type {MessageAttachment as MessageAttachmentType} from '@mm-redux/types/message_attachments';
import type {PostMetadata} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';

import AttachmentActions from './attachment_actions';
import AttachmentAuthor from './attachment_author';
import AttachmentFields from './attachment_fields';
import AttachmentImage from './attachment_image';
import AttachmentPreText from './attachment_pretext';
import AttachmentText from './attachment_text';
import AttachmentThumbnail from './attachment_thumbnail';
import AttachmentTitle from './attachment_title';
import AttachmentFooter from './attachment_footer';

type Props = {
    attachment: MessageAttachmentType,
    metadata?: PostMetadata,
    postId: string,
    theme: Theme,
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderRightColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderBottomWidth: 1,
            borderRightWidth: 1,
            borderTopWidth: 1,
            marginTop: 5,
            padding: 12,
        },
        border: {
            borderLeftColor: changeOpacity(theme.linkColor, 0.6),
            borderLeftWidth: 3,
        },
        message: {
            color: theme.centerChannelColor,
            fontSize: 15,
            lineHeight: 20,
        },
    };
});

export default function MessageAttachment({attachment, metadata, postId, theme}: Props) {
    const style = getStyleSheet(theme);
    const blockStyles = getMarkdownBlockStyles(theme);
    const textStyles = getMarkdownTextStyles(theme);
    const STATUS_COLORS = getStatusColors(theme);
    const hasImage = Boolean(metadata?.images?.[attachment.image_url]) || isSVGLink(attachment.image_url);

    let borderStyle;
    if (attachment.color) {
        if (attachment.color[0] === '#') {
            borderStyle = {borderLeftColor: attachment.color};
        } else if (STATUS_COLORS[attachment.color]) {
            borderStyle = {borderLeftColor: STATUS_COLORS[attachment.color]};
        }
    }

    return (
        <>
            <AttachmentPreText
                baseTextStyle={style.message}
                blockStyles={blockStyles}
                metadata={metadata}
                textStyles={textStyles}
                value={attachment.pretext}
            />
            <View style={[style.container, style.border, borderStyle]}>
                {Boolean(attachment.author_icon && attachment.author_name) &&
                <AttachmentAuthor
                    icon={attachment.author_icon}
                    link={attachment.author_link}
                    name={attachment.author_name}
                    theme={theme}
                />
                }
                {Boolean(attachment.title) &&
                <AttachmentTitle
                    link={attachment.title_link}
                    theme={theme}
                    value={attachment.title}
                />
                }
                {isValidUrl(attachment.thumb_url) &&
                <AttachmentThumbnail uri={attachment.thumb_url}/>
                }
                {Boolean(attachment.text) &&
                <AttachmentText
                    baseTextStyle={style.message}
                    blockStyles={blockStyles}
                    hasThumbnail={Boolean(attachment.thumb_url)}
                    metadata={metadata}
                    textStyles={textStyles}
                    value={attachment.text}
                    theme={theme}
                />
                }
                {Boolean(attachment.fields?.length) &&
                <AttachmentFields
                    baseTextStyle={style.message}
                    blockStyles={blockStyles}
                    fields={attachment.fields}
                    metadata={metadata}
                    textStyles={textStyles}
                    theme={theme}
                />
                }
                {Boolean(attachment.footer) &&
                <AttachmentFooter
                    icon={attachment.footer_icon}
                    text={attachment.footer}
                    theme={theme}
                />
                }
                {Boolean(attachment.actions?.length) &&
                <AttachmentActions
                    actions={attachment.actions!}
                    postId={postId}
                    theme={theme}
                />
                }
                {hasImage &&
                    <AttachmentImage
                        imageUrl={attachment.image_url}
                        imageMetadata={metadata?.images?.[attachment.image_url]}
                        postId={postId}
                        theme={theme}
                    />
                }
            </View>
        </>
    );
}
