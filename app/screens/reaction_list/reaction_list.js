// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {View} from 'react-native';
import {Navigation} from 'react-native-navigation';

import {dismissModal} from '@actions/navigation';
import SlideUpPanel from '@components/slide_up_panel';
import {ALL_EMOJIS} from '@constants/emoji';
import {
    generateUserProfilesById,
    getMissingUserIds,
    getReactionsByName,
    getSortedReactionsForHeader,
    getUniqueUserIds,
    sortReactions,
} from '@utils/reaction';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ReactionHeader from './reaction_header';
import ReactionRow from './reaction_row';

export default class ReactionList extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            getMissingProfilesByIds: PropTypes.func.isRequired,
        }).isRequired,
        isLandscape: PropTypes.bool,
        reactions: PropTypes.object.isRequired,
        theme: PropTypes.object.isRequired,
        teammateNameDisplay: PropTypes.string,
        userProfiles: PropTypes.array,
    };

    static defaultProps = {
        userProfiles: [],
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props) {
        super(props);
        const {reactions, userProfiles} = props;
        const reactionsByName = getReactionsByName(reactions);

        this.state = {
            allUserIds: getUniqueUserIds(reactions),
            reactions,
            reactionsByName,
            selected: ALL_EMOJIS,
            sortedReactions: sortReactions(reactionsByName),
            sortedReactionsForHeader: getSortedReactionsForHeader(reactionsByName),
            userProfiles,
            userProfilesById: generateUserProfilesById(userProfiles),
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        let newState = null;
        if (nextProps.reactions !== prevState.reactions) {
            const {reactions} = nextProps;
            const reactionsByName = getReactionsByName(reactions);

            newState = {
                allUserIds: getUniqueUserIds(reactions),
                reactions,
                reactionsByName,
                sortedReactions: sortReactions(reactionsByName),
                sortedReactionsForHeader: getSortedReactionsForHeader(reactionsByName),
            };
        }

        if (nextProps.userProfiles !== prevState.userProfiles) {
            const userProfilesById = generateUserProfilesById(nextProps.userProfiles);
            if (newState) {
                newState.userProfilesById = userProfilesById;
            } else {
                newState = {userProfilesById};
            }
        }

        return newState;
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);

        this.getMissingProfiles();
    }

    componentDidUpdate(_, prevState) {
        if (prevState.allUserIds !== this.state.allUserIds) {
            this.getMissingProfiles();
        }
    }

    navigationButtonPressed({buttonId}) {
        if (buttonId === 'close-reaction-list') {
            this.close();
        }
    }

    close = () => {
        dismissModal();
    };

    getMissingProfiles = () => {
        const {allUserIds, userProfiles, userProfilesById} = this.state;
        if (userProfiles.length !== allUserIds.length) {
            const missingUserIds = getMissingUserIds(userProfilesById, allUserIds);

            if (missingUserIds.length > 0) {
                this.props.actions.getMissingProfilesByIds(missingUserIds);
            }
        }
    }

    handleOnSelectReaction = (emoji) => {
        this.setState({selected: emoji});

        if (this.slideUpPanel) {
            this.slideUpPanel.scrollToTop();
        }
    };

    refSlideUpPanel = (r) => {
        this.slideUpPanel = r;
    };

    renderReactionRows = () => {
        const {
            teammateNameDisplay,
            theme,
        } = this.props;
        const {
            reactionsByName,
            selected,
            sortedReactions,
            userProfilesById,
        } = this.state;
        const style = getStyleSheet(theme);
        const reactions = selected === ALL_EMOJIS ? sortedReactions : reactionsByName[selected];

        return reactions.map(({emoji_name: emojiName, user_id: userId}) => (
            <View
                key={emojiName + userId}
                style={style.rowContainer}
            >
                <ReactionRow
                    emojiName={emojiName}
                    teammateNameDisplay={teammateNameDisplay}
                    theme={theme}
                    user={userProfilesById[userId]}
                />
                <View style={style.separator}/>
            </View>
        ));
    };

    renderHeader = (forwardedRef) => {
        const {theme} = this.props;
        const {selected, sortedReactionsForHeader} = this.state;

        return (
            <ReactionHeader
                selected={selected}
                onSelectReaction={this.handleOnSelectReaction}
                reactions={sortedReactionsForHeader}
                theme={theme}
                forwardedRef={forwardedRef}
            />
        );
    };

    render() {
        const {isLandscape, theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <View
                style={style.flex}
                testID='reaction_list.screen'
            >
                <SlideUpPanel
                    ref={this.refSlideUpPanel}
                    onRequestClose={this.close}
                    initialPosition={0.55}
                    header={this.renderHeader}
                    headerHeight={37.5}
                    key={`landscape-${isLandscape}`}
                    theme={theme}
                >
                    {this.renderReactionRows()}
                </SlideUpPanel>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        flex: {
            flex: 1,
        },
        headerContainer: {
            height: 37.5,
        },
        rowContainer: {
            justifyContent: 'center',
            height: 45,
        },
        separator: {
            height: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        },
    };
});
