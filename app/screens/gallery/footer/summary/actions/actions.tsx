// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import mattermostManaged from '@mattermost-managed';

import Action from './action';

import type {ActionsProps, ManagedConfig} from '@mm-types/screens/gallery';

const styles = StyleSheet.create({
    contaier: {
        flexDirection: 'row',
        marginRight: 8,
    },
    download: {
        marginLeft: 24,
    },
});

const Actions = (props: ActionsProps) => {
    const [managedConfig, setManagedConfig] = useState<ManagedConfig|null>(null);

    const configChanged = (config: ManagedConfig) => {
        setManagedConfig(config);
    };

    useEffect(() => {
        mattermostManaged.getConfig().then(configChanged);
    }, []);

    useEffect(() => {
        const listener = mattermostManaged.addEventListener('managedConfigDidChange', configChanged);

        return () => {
            mattermostManaged.removeEventListener(listener);
        };
    }, []);

    let linkActionVisible = !props.file.id.startsWith('uid') && props.enablePublicLink;
    if (managedConfig?.copyPasteProtection === 'true') {
        linkActionVisible = false;
    }

    return (
        <View style={styles.contaier}>
            <Action
                action={props.linkAction}
                visible={linkActionVisible}
            >
                <CompassIcon
                    color='#FFFFFF'
                    name='link-variant'
                    size={24}
                />
            </Action>
            <Action
                action={props.downloadAction}
                style={styles.download}
                visible={props.canDownloadFiles}
            >
                <CompassIcon
                    color='#FFFFFF'
                    name='export-variant'
                    size={24}
                />
            </Action>
        </View>
    );
};

export default Actions;
