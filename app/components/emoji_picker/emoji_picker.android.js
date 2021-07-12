// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import SearchBar from '@components/search_bar';
import {changeOpacity, getKeyboardAppearanceFromTheme} from '@utils/theme';

import EmojiPickerBase, {getStyleSheetFromTheme} from './emoji_picker_base';

export default class EmojiPicker extends EmojiPickerBase {
    render() {
        const {formatMessage} = this.context.intl;
        const {testID, theme} = this.props;
        const {searchTerm} = this.state;
        const searchBarTestID = `${testID}.search_bar`;
        const styles = getStyleSheetFromTheme(theme);

        const searchBarInput = {
            backgroundColor: theme.centerChannelBg,
            color: theme.centerChannelColor,
            fontSize: 13,
        };

        return (
            <React.Fragment>
                <View
                    testID={testID}
                    style={styles.searchBar}
                >
                    <SearchBar
                        testID={searchBarTestID}
                        ref={this.setSearchBarRef}
                        placeholder={formatMessage({id: 'search_bar.search', defaultMessage: 'Search'})}
                        cancelTitle={formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                        backgroundColor='transparent'
                        inputHeight={33}
                        inputStyle={searchBarInput}
                        placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                        tintColorSearch={changeOpacity(theme.centerChannelColor, 0.8)}
                        tintColorDelete={changeOpacity(theme.centerChannelColor, 0.5)}
                        titleCancelColor={theme.centerChannelColor}
                        onChangeText={this.changeSearchTerm}
                        onCancelButtonPress={this.cancelSearch}
                        autoCapitalize='none'
                        value={searchTerm}
                        keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                        onAnimationComplete={this.setRebuiltEmojis}
                    />
                </View>
                <View style={styles.container}>
                    {this.renderListComponent(2)}
                    {!searchTerm &&
                    <View style={styles.bottomContentWrapper}>
                        <View style={styles.bottomContent}>
                            {this.renderSectionIcons()}
                        </View>
                    </View>
                    }
                </View>
            </React.Fragment>
        );
    }
}
