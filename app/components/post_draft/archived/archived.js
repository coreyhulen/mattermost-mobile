// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {View} from 'react-native';
import Button from 'react-native-button';

import {popToRoot} from '@actions/navigation';
import FormattedMarkdownText from '@components/formatted_markdown_text';
import FormattedText from '@components/formatted_text';
import {t} from '@utils/i18n';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class Archived extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        deactivated: PropTypes.bool,
        rootId: PropTypes.string,
        selectPenultimateChannel: PropTypes.func.isRequired,
        teamId: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
    }

    onCloseChannelPress = () => {
        const {rootId, teamId} = this.props;
        this.props.selectPenultimateChannel(teamId);
        if (rootId) {
            popToRoot();
        }
    };

    message = () => {
        const {deactivated} = this.props;
        if (deactivated) {
            // only applies to DM's when the user was deactivated
            return {
                id: t('create_post.deactivated'),
                defaultMessage: 'You are viewing an archived channel with a deactivated user.',
            };
        }

        return {
            id: t('archivedChannelMessage'),
            defaultMessage: 'You are viewing an **archived channel**. New messages cannot be posted.',
        };
    };

    render() {
        const {testID, theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <View
                testID={testID}
                style={style.archivedWrapper}
            >
                <FormattedMarkdownText
                    {...this.message()}
                    theme={theme}
                    style={style.archivedText}
                />
                <Button
                    containerStyle={style.closeButton}
                    onPress={this.onCloseChannelPress}
                >
                    <FormattedText
                        id='center_panel.archived.closeChannel'
                        defaultMessage='Close Channel'
                        style={style.closeButtonText}
                    />
                </Button>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => ({
    archivedWrapper: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
        backgroundColor: theme.centerChannelBg,
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.20),
    },
    archivedText: {
        textAlign: 'center',
        color: theme.centerChannelColor,
    },
    closeButton: {
        backgroundColor: theme.buttonBg,
        alignItems: 'center',
        paddingTop: 5,
        paddingBottom: 5,
        borderRadius: 4,
        marginTop: 10,
        height: 40,
    },
    closeButtonText: {
        marginTop: 7,
        color: 'white',
        fontWeight: 'bold',
    },
}));
