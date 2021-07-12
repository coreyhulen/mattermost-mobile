// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {
    TouchableHighlight,
    View,
} from 'react-native';

import Badge from '@components/badge';
import CompassIcon from '@components/compass_icon';
import TeamIcon from '@components/team_icon';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class SwitchTeamsButton extends React.PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        currentTeamId: PropTypes.string,
        onShowTeams: PropTypes.func.isRequired,
        mentionCount: PropTypes.number.isRequired,
        teamsCount: PropTypes.number.isRequired,
        theme: PropTypes.object.isRequired,
    };

    showTeams = preventDoubleTap(() => {
        this.props.onShowTeams();
    });

    render() {
        const {
            testID,
            currentTeamId,
            mentionCount,
            teamsCount,
            theme,
        } = this.props;

        if (!currentTeamId) {
            return null;
        }

        if (teamsCount < 2) {
            return null;
        }

        const styles = getStyleSheet(theme);

        const lowMentionCount = mentionCount <= 0;
        const minWidth = lowMentionCount ? 8 : 20;
        const badgeStyle = lowMentionCount ? styles.smallBadge : styles.badge;
        const containerStyle = lowMentionCount ? styles.smallBadgeContainer : styles.badgeContainer;
        const badgeTestID = `${testID}.badge`;

        const badge = (
            <Badge
                testID={badgeTestID}
                containerStyle={containerStyle}
                style={badgeStyle}
                countStyle={styles.mention}
                minWidth={minWidth}
                count={mentionCount}
            />
        );

        const itemTestID = `${testID}.${currentTeamId}`;
        const teamIconTestID = `${testID}.team_icon`;

        return (
            <View testID={testID}>
                <TouchableHighlight
                    onPress={this.showTeams}
                    underlayColor={changeOpacity(theme.sidebarHeaderBg, 0.5)}
                >
                    <View
                        testID={itemTestID}
                        style={styles.switcherContainer}
                    >
                        <CompassIcon
                            name='chevron-left'
                            size={24}
                            style={styles.switcherArrow}
                        />
                        <TeamIcon
                            testID={teamIconTestID}
                            teamId={currentTeamId}
                            styleContainer={styles.teamIconContainer}
                            styleText={styles.teamIconText}
                            styleImage={styles.teamIcon}
                        />
                    </View>
                </TouchableHighlight>
                {badge}
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        badge: {
            backgroundColor: theme.mentionBg,
            height: 20,
            padding: 3,
        },
        smallBadge: {
            backgroundColor: theme.mentionBg,
            height: 8,
            padding: 3,
        },
        badgeContainer: {
            borderColor: theme.sidebarBg,
            borderRadius: 14,
            borderWidth: 2,
            position: 'absolute',
            right: 0,
            top: -9,
        },
        smallBadgeContainer: {
            borderColor: theme.sidebarBg,
            borderRadius: 14,
            borderWidth: 2,
            position: 'absolute',
            right: 6,
            top: -5,
        },
        mention: {
            color: theme.mentionColor,
            fontSize: 10,
            fontWeight: 'bold',
        },
        switcherArrow: {
            color: theme.sidebarHeaderBg,
            top: 1,
            left: -2,
        },
        switcherContainer: {
            alignItems: 'center',
            backgroundColor: theme.sidebarHeaderTextColor,
            borderRadius: 2,
            flexDirection: 'row',
            justifyContent: 'center',
            height: 36,
            marginRight: 12,
            width: 57,
        },
        teamIcon: {
            width: 24,
            height: 24,
        },
        teamIconContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            height: 24,
            width: 24,
        },
        teamIconText: {
            fontFamily: 'Open Sans',
            fontSize: 14,
        },
    };
});
