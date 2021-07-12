// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as RNPlaceholder from 'rn-placeholder';

import FormattedText from '@components/formatted_text';
import {INDICATOR_BAR_HEIGHT} from '@constants/view';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

function calculateMaxRows(height) {
    return Math.round(height / 100);
}

function Media(color) {
    return (
        <RNPlaceholder.PlaceholderMedia
            color={changeOpacity(color, 0.15)}
            isRound={true}
            size={32}
            style={{marginRight: 10}}
        />
    );
}

export default class ChannelLoader extends PureComponent {
    static propTypes = {
        backgroundColor: PropTypes.string,
        channelIsLoading: PropTypes.bool.isRequired,
        style: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        theme: PropTypes.object.isRequired,
        height: PropTypes.number,
        retryLoad: PropTypes.func,
    };

    constructor(props) {
        super(props);

        const height = props.height || Dimensions.get('window').height;
        const maxRows = calculateMaxRows(height);

        this.state = {
            barsOpacity: new Animated.Value(0.6),
            switch: false,
            maxRows,
        };

        this.top = new Animated.Value(-INDICATOR_BAR_HEIGHT);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const state = {};

        if (nextProps.height) {
            state.maxRows = calculateMaxRows(nextProps.height);
        }
        if (!nextProps.channelIsLoading && prevState.switch) {
            state.switch = false;
            state.channel = null;
        }

        return Object.keys(state) ? state : null;
    }

    componentDidMount() {
        if (this.props.retryLoad) {
            this.stillLoadingTimeout = setTimeout(this.showIndicator, 10000);
            this.retryLoadInterval = setInterval(this.props.retryLoad, 10000);
        }
    }

    componentWillUnmount() {
        clearTimeout(this.stillLoadingTimeout);
        clearInterval(this.retryLoadInterval);
    }

    showIndicator = () => {
        Animated.timing(this.top, {
            toValue: 0,
            duration: 300,
            delay: 500,
            useNativeDriver: false,
        }).start();
    }

    buildSections({key, style, bg, color}) {
        return (
            <View
                key={key}
                style={[style.section, {backgroundColor: bg}]}
            >
                <RNPlaceholder.Placeholder
                    Animation={(props) => (
                        <RNPlaceholder.Fade
                            {...props}
                            style={{backgroundColor: changeOpacity(bg, 0.9)}}
                        />
                    )}
                    Left={Media.bind(undefined, color)}
                    styles={{left: {color: changeOpacity(color, 0.15)}}}
                >
                    <RNPlaceholder.PlaceholderLine color={changeOpacity(color, 0.15)}/>
                    <RNPlaceholder.PlaceholderLine
                        color={changeOpacity(color, 0.15)}
                        width={80}
                    />
                    <RNPlaceholder.PlaceholderLine
                        color={changeOpacity(color, 0.15)}
                        width={60}
                    />
                </RNPlaceholder.Placeholder>
            </View>
        );
    }

    handleLayout = (e) => {
        const {height} = e.nativeEvent.layout;
        const maxRows = calculateMaxRows(height);
        this.setState({maxRows});
    }

    render() {
        const {
            channelIsLoading,
            style: styleProp,
            theme,
        } = this.props;

        if (!channelIsLoading) {
            return null;
        }

        const style = getStyleSheet(theme);
        const bg = this.props.backgroundColor || theme.centerChannelBg;

        return (
            <View
                style={[style.container, styleProp, {backgroundColor: bg}]}
                onLayout={this.handleLayout}
            >
                <Animated.View
                    style={[style.indicator, {top: this.top}]}
                >
                    <AnimatedSafeAreaView
                        edges={['left', 'right']}
                        style={style.indicatorWrapper}
                    >
                        <View style={style.activityIndicator}>
                            <ActivityIndicator
                                color='#FFFFFF'
                                size='small'
                            />
                        </View>
                        <FormattedText
                            id='mobile.channel_loader.still_loading'
                            defaultMessage='Still trying to load your content...'
                            style={style.indicatorText}
                        />
                    </AnimatedSafeAreaView>
                </Animated.View>
                {Array(this.state.maxRows).fill().map((item, index) => this.buildSections({
                    key: index,
                    style,
                    bg,
                    color: theme.centerChannelColor,
                }))}
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
            overflow: 'hidden',
        },
        section: {
            backgroundColor: theme.centerChannelBg,
            flex: 1,
            paddingLeft: 12,
            paddingRight: 20,
            marginVertical: 10,
        },
        indicator: {
            position: 'absolute',
            height: INDICATOR_BAR_HEIGHT,
            width: '100%',
            ...Platform.select({
                android: {
                    elevation: 9,
                },
                ios: {
                    zIndex: 9,
                },
            }),
            backgroundColor: '#3D3C40',
        },
        indicatorWrapper: {
            alignItems: 'center',
            height: INDICATOR_BAR_HEIGHT,
            flexDirection: 'row',
            paddingLeft: 12,
            paddingRight: 5,
        },
        indicatorText: {
            color: '#fff',
            fontWeight: 'bold',
        },
        activityIndicator: {
            alignItems: 'flex-start',
            height: 24,
            justifyContent: 'center',
            paddingRight: 10,
        },
    };
});
