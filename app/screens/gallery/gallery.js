// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Platform, StatusBar} from 'react-native';

import {mergeNavigationOptions, popTopScreen} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import {isImage} from '@utils/file';

import Footer from './footer';
import GalleryViewer from './gallery_viewer';

export default class Gallery extends PureComponent {
    static propTypes = {
        componentId: PropTypes.string.isRequired,
        deviceHeight: PropTypes.number.isRequired,
        deviceWidth: PropTypes.number.isRequired,
        files: PropTypes.array,
        index: PropTypes.number.isRequired,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        files: [],
    };

    static contextTypes = {
        intl: intlShape,
    };

    constructor(props) {
        super(props);

        this.state = {
            index: props.index,
            footerVisible: true,
        };

        this.footer = React.createRef();
    }

    componentDidMount() {
        this.cancelTopBar = setTimeout(() => {
            this.initHeader();
        }, Platform.OS === 'ios' ? 200 : 0);
    }

    componentWillUnmount() {
        StatusBar.setHidden(false, 'fade');
        if (this.cancelTopBar) {
            clearTimeout(this.cancelTopBar);
        }
    }

    initHeader = async (idx = this.state.index) => {
        const {formatMessage} = this.context.intl;
        const {files} = this.props;
        const index = idx;
        const closeButton = await CompassIcon.getImageSource('close', 24, '#ffffff');
        const sharedElementTransitions = [];
        const file = files[index];

        if (isImage(file) && index < 4) {
            sharedElementTransitions.push({
                fromId: `gallery-${file.id}`,
                toId: `image-${file.id}`,
                duration: 300,
                interpolation: {type: 'accelerateDecelerate', factor: 8},
            });
        }

        let title;
        if (files.length > 1) {
            title = formatMessage({id: 'mobile.gallery.title', defaultMessage: '{index} of {total}'}, {
                index: index + 1,
                total: files.length,
            });
        }
        const options = {
            topBar: {
                visible: this.footer.current?.getWrappedInstance().isVisible(),
                background: {
                    color: '#000',
                },
                title: {
                    text: title,
                    color: '#FFF',
                },
                backButton: {
                    enableMenu: false,
                    visible: true,
                    icon: closeButton,
                },
            },
            animations: {
                pop: {
                    sharedElementTransitions,
                },
            },
        };

        mergeNavigationOptions(this.props.componentId, options);
    }

    close = () => {
        const {componentId} = this.props;
        const color = Platform.select({android: 'transparent', ios: '#000'});
        const options = {
            layout: {
                backgroundColor: color,
                componentBackgroundColor: color,
            },
            topBar: {
                visible: true,
            },
        };

        mergeNavigationOptions(componentId, options);
        StatusBar.setHidden(false, 'fade');
        popTopScreen(componentId);
    };

    handlePageSelected = (index) => {
        this.setState({index}, this.initHeader);
    };

    handleTapped = (display) => {
        let visible;
        if (display === undefined) {
            visible = this.footer.current?.getWrappedInstance()?.toggle();
        } else {
            visible = display;
            this.footer.current?.getWrappedInstance()?.setVisible(display);
        }

        const options = {
            topBar: {
                background: {
                    color: '#000',
                },
                visible,
            },
        };
        if (Platform.OS === 'ios') {
            StatusBar.setHidden(!visible, 'fade');
        }
        this.setState({footerVisible: visible});
        mergeNavigationOptions(this.props.componentId, options);
    };

    render() {
        const {deviceHeight, deviceWidth, files, theme} = this.props;
        const {index, footerVisible} = this.state;

        return (
            <>
                <GalleryViewer
                    key={`gallery-${deviceWidth}`}
                    files={files}
                    footerVisible={footerVisible}
                    width={deviceWidth}
                    height={deviceHeight}
                    initialIndex={index}
                    isLandscape={deviceWidth > deviceHeight}
                    onClose={this.close}
                    onPageSelected={this.handlePageSelected}
                    onTap={this.handleTapped}
                    theme={theme}
                />
                <Footer
                    ref={this.footer}
                    file={files[index]}
                />
            </>
        );
    }
}
