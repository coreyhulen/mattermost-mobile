// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import PropTypes from 'prop-types';
import {
    Text,
    TouchableHighlight,
    View,
} from 'react-native';

import Badge from '@components/badge';
import CompassIcon from '@components/compass_icon';
import TeamIcon from '@components/team_icon';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class TeamsListItem extends React.PureComponent {
	public props: any;
	public testID: any;
	public currentTeamId: any;
	public currentUrl: any;
	public displayName: any;
	public mentionCount: any;
	public name: any;
	public teamId: any;
	public theme: any;
    static propTypes = {
        testID: PropTypes.string,
        currentTeamId: PropTypes.string.isRequired,
        currentUrl: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired,
        mentionCount: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        selectTeam: PropTypes.func.isRequired,
        teamId: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
    };

    selectTeam = preventDoubleTap(() => {
        this.props.selectTeam(this.props.teamId);
    });

    render() {
        const {
            testID,
            currentTeamId,
            currentUrl,
            displayName,
            mentionCount,
            name,
            teamId,
            theme,
        } = this.props;
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
                countStyle={styles.mention}
                count={mentionCount}
                minWidth={minWidth}
                style={badgeStyle}
            />
        );

        let current;
        if (teamId === currentTeamId) {
            const currentTestID = `${testID}.current`;

            current = (
                <View
                    testID={currentTestID}
                    style={styles.checkmarkContainer}
                >
                    <CompassIcon
                        name='check'
                        style={styles.checkmark}
                    />
                </View>
            );
        }

        const itemTestID = `${testID}.${teamId}`;
        const displayNameTestID = `${testID}.display_name`;
        const teamIconTestID = `${testID}.team_icon`;

        return (
            <View
                testID={testID}
                style={styles.teamWrapper}
            >
                <TouchableHighlight
                    underlayColor={changeOpacity(theme.sidebarTextHoverBg, 0.5)}
                    onPress={this.selectTeam}
                >
                    <View
                        testID={itemTestID}
                        style={styles.teamContainer}
                    >
                        <View>
                            <TeamIcon
                                testID={teamIconTestID}
                                teamId={teamId}
                                styleContainer={styles.teamIconContainer}
                                styleText={styles.teamIconText}
                            />
                            {badge}
                        </View>
                        <View style={styles.teamNameContainer}>
                            <Text
                                testID={displayNameTestID}
                                numberOfLines={1}
                                ellipsizeMode='tail'
                                style={styles.teamName}
                            >
                                {displayName}
                            </Text>
                            <Text
                                numberOfLines={1}
                                ellipsizeMode='tail'
                                style={styles.teamUrl}
                            >
                                {`${currentUrl}/${name}`}
                            </Text>
                        </View>
                        {current}
                    </View>
                </TouchableHighlight>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        teamWrapper: {
            marginTop: 10,
        },
        teamContainer: {
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            marginHorizontal: 16,
            paddingVertical: 10,
        },
        teamNameContainer: {
            flex: 1,
            flexDirection: 'column',
            marginLeft: 10,
        },
        teamName: {
            color: theme.sidebarText,
            fontSize: 18,
        },
        teamIconContainer: {
            width: 40,
            height: 40,
            backgroundColor: '#ffffff',
        },
        teamIconText: {
            fontSize: 18,
        },
        teamUrl: {
            color: changeOpacity(theme.sidebarText, 0.5),
            fontSize: 12,
        },
        checkmarkContainer: {
            alignItems: 'flex-end',
        },
        checkmark: {
            color: theme.sidebarText,
            fontSize: 20,
        },
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
            right: -12,
            top: -10,
        },
        smallBadgeContainer: {
            borderColor: theme.sidebarBg,
            borderRadius: 14,
            borderWidth: 2,
            position: 'absolute',
            right: -7,
            top: -6,
        },
        mention: {
            color: theme.mentionColor,
            fontSize: 10,
            fontWeight: 'bold',
        },
    };
});
