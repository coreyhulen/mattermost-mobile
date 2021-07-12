// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Animated,
    InteractionManager,
    Keyboard,
    TouchableWithoutFeedback,
    StyleSheet,
    View,
    Platform,
} from 'react-native';
import {SearchBar} from 'react-native-elements';

import CompassIcon from '@components/compass_icon';
import {memoizeResult} from '@mm-redux/utils/helpers';

const LEFT_COMPONENT_INITIAL_POSITION = Platform.OS === 'ios' ? 7 : 0;

export default class Search extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        onBlur: PropTypes.func,
        onFocus: PropTypes.func,
        onSearchButtonPress: PropTypes.func,
        onChangeText: PropTypes.func,
        onCancelButtonPress: PropTypes.func,
        onSelectionChange: PropTypes.func,
        backgroundColor: PropTypes.string,
        placeholderTextColor: PropTypes.string,
        titleCancelColor: PropTypes.string,
        tintColorSearch: PropTypes.string,
        tintColorDelete: PropTypes.string,
        selectionColor: PropTypes.string,
        inputStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        cancelButtonStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        autoFocus: PropTypes.bool,
        placeholder: PropTypes.string,
        cancelTitle: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]),
        returnKeyType: PropTypes.string,
        keyboardType: PropTypes.string,
        autoCapitalize: PropTypes.string,
        inputHeight: PropTypes.number,
        editable: PropTypes.bool,
        blurOnSubmit: PropTypes.bool,
        keyboardShouldPersist: PropTypes.bool,
        value: PropTypes.string,
        keyboardAppearance: PropTypes.string,
        showArrow: PropTypes.bool,
        searchBarRightMargin: PropTypes.number,
        leftComponent: PropTypes.element,
        searchIconSize: PropTypes.number,
        backArrowSize: PropTypes.number,
        deleteIconSize: PropTypes.number,
        showCancel: PropTypes.bool,
        containerHeight: PropTypes.number,
    };

    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        onSelectionChange: () => true,
        onBlur: () => true,
        editable: true,
        blurOnSubmit: false,
        keyboardShouldPersist: false,
        placeholderTextColor: 'grey',
        value: '',
        showArrow: false,
        showCancel: true,
        searchIconSize: 24,
        backArrowSize: 24,
        deleteIconSize: 20,
        searchBarRightMargin: 0,
        returnKeyType: 'search',
        keyboardType: 'default',
        containerHeight: 40,
    };

    constructor(props) {
        super(props);
        this.state = {
            leftComponentWidth: 0,
        };

        this.leftComponentAnimated = new Animated.Value(LEFT_COMPONENT_INITIAL_POSITION);
        this.searchContainerAnimated = new Animated.Value(0);
    }

    setSearchContainerRef = (ref) => {
        this.searchContainerRef = ref;
    }

    setInputKeywordRef = (ref) => {
        this.inputKeywordRef = ref;
    }

    blur = () => {
        this.inputKeywordRef.blur();
    };

    focus = () => {
        this.inputKeywordRef.focus();
    };

    onBlur = async () => {
        this.props.onBlur();

        if (this.props.leftComponent) {
            await this.collapseAnimation();
        }
    };

    onLeftComponentLayout = (event) => {
        const leftComponentWidth = event.nativeEvent.layout.width;
        this.setState({leftComponentWidth});
    };

    onSearch = async () => {
        if (this.props.keyboardShouldPersist === false) {
            await Keyboard.dismiss();
        }

        this.props.onSearchButtonPress(this.props.value);
    };

    onChangeText = (text) => {
        if (this.props.onChangeText) {
            this.props.onChangeText(text);
        }
    };

    onFocus = () => {
        InteractionManager.runAfterInteractions(async () => {
            if (this.props.onFocus) {
                this.props.onFocus();
            }

            if (this.props.leftComponent) {
                await this.expandAnimation();
            }
        });
    };

    onClear = () => {
        this.focus();
        this.props.onChangeText('', true);
    };

    onCancel = () => {
        Keyboard.dismiss();
        InteractionManager.runAfterInteractions(() => {
            if (this.props.onCancelButtonPress) {
                this.props.onCancelButtonPress();
            }
        });
    };

    onSelectionChange = (event) => {
        this.props.onSelectionChange(event);
    };

    expandAnimation = () => {
        return new Promise((resolve) => {
            Animated.parallel([
                Animated.timing(
                    this.leftComponentAnimated,
                    {
                        toValue: -115,
                        duration: 200,
                    },
                ),
                Animated.timing(
                    this.searchContainerAnimated,
                    {
                        toValue: this.state.leftComponentWidth * -1,
                        duration: 200,
                    },
                ),
            ]).start(resolve);
        });
    }

    collapseAnimation = () => {
        return new Promise((resolve) => {
            Animated.parallel([
                Animated.timing(
                    this.leftComponentAnimated,
                    {
                        toValue: LEFT_COMPONENT_INITIAL_POSITION,
                        duration: 200,
                    },
                ),
                Animated.timing(
                    this.searchContainerAnimated,
                    {
                        toValue: 0,
                        duration: 200,
                    },
                ),
            ]).start(resolve);
        });
    }

    render() {
        const {testID, backgroundColor, inputHeight, inputStyle, placeholderTextColor, tintColorSearch, cancelButtonStyle, tintColorDelete, titleCancelColor, searchBarRightMargin, containerHeight} = this.props;
        const searchClearButtonTestID = `${testID}.search.clear.button`;
        const searchCancelButtonTestID = `${testID}.search.cancel.button`;
        const searchInputTestID = `${testID}.search.input`;
        const searchBarStyle = getSearchBarStyle(
            backgroundColor,
            cancelButtonStyle,
            inputHeight,
            inputStyle,
            placeholderTextColor,
            tintColorDelete,
            tintColorSearch,
            titleCancelColor,
            searchBarRightMargin,
            containerHeight,
        );
        const {intl} = this.context;

        let clearIcon = null;
        let searchIcon = null;
        let cancelIcon = null;

        if (Platform.OS === 'ios') {
            clearIcon = (
                <CompassIcon
                    testID={searchClearButtonTestID}
                    name='close-circle'
                    size={18}
                    style={{color: searchBarStyle.clearIconColorIos}}
                    onPress={this.onClear}
                />
            );

            searchIcon = (
                <CompassIcon
                    name='magnify'
                    size={24}
                    style={[
                        styles.fullWidth,
                        searchBarStyle.searchIcon,
                    ]}
                />
            );
        } else {
            searchIcon = this.props.showArrow ?
                (
                    <TouchableWithoutFeedback onPress={this.onCancel}>
                        <CompassIcon
                            testID={searchCancelButtonTestID}
                            name='arrow-left'
                            size={this.props.backArrowSize}
                            color={searchBarStyle.clearIconColorAndroid}
                        />
                    </TouchableWithoutFeedback>
                ) :
                (
                    <CompassIcon
                        name='magnify'
                        size={this.props.searchIconSize}
                        color={searchBarStyle.searchIconColor}
                    />
                );

            // Making sure the icon won't change depending on whether the input is in focus on Android devices
            cancelIcon = (
                <CompassIcon
                    testID={searchCancelButtonTestID}
                    name='arrow-left'
                    size={25}
                    color={searchBarStyle.clearIconColorAndroid}
                    onPress={this.onCancel}
                />
            );

            clearIcon = (
                <CompassIcon
                    testID={searchClearButtonTestID}
                    name='close'
                    size={this.props.deleteIconSize}
                    color={searchBarStyle.clearIconColorAndroid}
                    onPress={this.onClear}
                />
            );
        }

        return (
            <View
                testID={testID}
                style={[searchBarStyle.container, this.props.containerStyle]}
            >
                {((this.props.leftComponent) ?
                    <Animated.View
                        style={[styles.leftComponent, {
                            left: this.leftComponentAnimated,
                        }]}
                        onLayout={this.onLeftComponentLayout}
                    >
                        {this.props.leftComponent}
                    </Animated.View> :
                    null
                )}
                <Animated.View
                    style={[
                        styles.fullWidth,
                        searchBarStyle.searchBarWrapper,
                        {
                            marginLeft: this.searchContainerAnimated,
                        },
                    ]}
                >
                    <SearchBar
                        testID={searchInputTestID}
                        autoCapitalize={this.props.autoCapitalize}
                        autoCorrect={false}
                        autoFocus={this.props.autoFocus}
                        blurOnSubmit={this.props.blurOnSubmit}
                        cancelButtonProps={{
                            buttonTextStyle: {
                                ...styles.text,
                                ...searchBarStyle.cancelButtonText,
                            },
                        }}
                        cancelButtonTitle={this.props.cancelTitle || intl.formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                        cancelIcon={cancelIcon}
                        clearIcon={clearIcon}
                        containerStyle={{
                            ...styles.searchContainer,
                            ...styles.fullWidth,
                            ...searchBarStyle.searchBarContainer,
                        }}
                        disableFullscreenUI={true}
                        editable={this.props.editable}
                        enablesReturnKeyAutomatically={true}
                        inputContainerStyle={{
                            ...styles.inputContainer,
                            ...searchBarStyle.inputContainer,
                        }}
                        inputStyle={{
                            ...styles.text,
                            ...styles.inputMargin,
                            ...searchBarStyle.inputStyle,
                        }}
                        keyboardAppearance={this.props.keyboardAppearance}
                        keyboardType={this.props.keyboardType}
                        leftIconContainerStyle={styles.leftIcon}
                        placeholder={this.props.placeholder || intl.formatMessage({id: 'search_bar.search', defaultMessage: 'Search'})}
                        placeholderTextColor={this.props.placeholderTextColor}
                        platform={Platform.OS}
                        onBlur={this.onBlur}
                        onCancel={this.onCancel}
                        onChangeText={this.onChangeText}
                        onClear={this.onClear}
                        onFocus={this.onFocus}
                        onSelectionChange={this.onSelectionChange}
                        onSubmitEditing={this.onSearch}
                        searchIcon={searchIcon}
                        selectionColor={this.props.selectionColor}
                        showCancel={this.props.showCancel}
                        ref={this.setInputKeywordRef}
                        returnKeyType={this.props.returnKeyType}
                        underlineColorAndroid='transparent'
                        value={this.props.value}
                    />
                </Animated.View>
            </View>
        );
    }
}

const getSearchBarStyle = memoizeResult((
    backgroundColor,
    cancelButtonStyle,
    inputHeight,
    inputStyle,
    placeholderTextColor,
    tintColorDelete,
    tintColorSearch,
    titleCancelColor,
    searchBarRightMargin,
    containerHeight,
) => ({
    cancelButtonText: {
        ...cancelButtonStyle,
        color: titleCancelColor,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        height: containerHeight,
        overflow: 'hidden',
    },
    clearIconColorIos: tintColorDelete || styles.defaultColor.color,
    clearIconColorAndroid: titleCancelColor || placeholderTextColor,
    inputStyle: {
        ...inputStyle,
        backgroundColor: 'transparent',
        height: inputHeight,
    },
    inputContainer: {
        backgroundColor: inputStyle.backgroundColor,
        height: inputHeight,
    },
    searchBarWrapper: {
        marginRight: searchBarRightMargin,
        height: Platform.select({
            ios: inputHeight || containerHeight - 10,
            android: inputHeight,
        }),
    },
    searchBarContainer: {
        backgroundColor,
    },
    searchIcon: {
        color: tintColorSearch || placeholderTextColor,
        top: 8,
    },
    searchIconColor: tintColorSearch || placeholderTextColor,
}));

const styles = StyleSheet.create({
    defaultColor: {
        color: 'grey',
    },
    fullWidth: {
        flex: 1,
    },
    inputContainer: {
        borderRadius: Platform.select({
            ios: 2,
            android: 0,
        }),
    },
    inputMargin: {
        marginLeft: 4,
        paddingTop: 0,
        marginTop: Platform.select({
            ios: 0,
            android: 8,
        }),
    },
    leftIcon: {
        marginLeft: 4,
        width: 30,
    },
    searchContainer: {
        paddingTop: 0,
        paddingBottom: 0,
    },
    text: {
        fontSize: Platform.select({
            ios: 14,
            android: 15,
        }),
        color: '#fff',
    },
    leftComponent: {
        position: 'relative',
        marginLeft: 2,
    },
});
