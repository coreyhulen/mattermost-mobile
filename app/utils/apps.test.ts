// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {AppBinding, AppCall} from '@mm-redux/types/apps';

import {fillAndTrimBindingsInformation} from './apps';

describe('Apps Utils', () => {
    describe('fillAndTrimBindingsInformation', () => {
        test('Apps IDs, and Calls propagate down, and locations get formed', () => {
            const inBinding: AppBinding = {
                app_id: 'id',
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc2',
                        bindings: [
                            {
                                location: 'loc3',
                            } as AppBinding,
                            {
                                location: 'loc4',
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        location: 'loc5',
                    } as AppBinding,
                ],
            } as AppBinding;

            const outBinding: AppBinding = {
                app_id: 'id',
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc1/loc2',
                        app_id: 'id',
                        call: {
                            path: 'url',
                        } as AppCall,
                        bindings: [
                            {
                                location: 'loc1/loc2/loc3',
                                app_id: 'id',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                            {
                                location: 'loc1/loc2/loc4',
                                app_id: 'id',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        location: 'loc1/loc5',
                        app_id: 'id',
                        call: {
                            path: 'url',
                        } as AppCall,
                    },
                ],
            } as AppBinding;

            fillAndTrimBindingsInformation(inBinding);
            expect(inBinding).toEqual(outBinding);
        });

        test('Do not overwrite calls nor ids on the way down.', () => {
            const inBinding: AppBinding = {
                app_id: 'id',
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        app_id: 'id2',
                        location: 'loc2',
                        bindings: [
                            {
                                location: 'loc3',
                            } as AppBinding,
                            {
                                location: 'loc4',
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        call: {
                            path: 'url2',
                        } as AppCall,
                        location: 'loc5',
                    } as AppBinding,
                ],
            } as AppBinding;

            const outBinding: AppBinding = {
                app_id: 'id',
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc1/loc2',
                        app_id: 'id2',
                        call: {
                            path: 'url',
                        } as AppCall,
                        bindings: [
                            {
                                location: 'loc1/loc2/loc3',
                                app_id: 'id2',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                            {
                                location: 'loc1/loc2/loc4',
                                app_id: 'id2',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        location: 'loc1/loc5',
                        app_id: 'id',
                        call: {
                            path: 'url2',
                        } as AppCall,
                    },
                ],
            } as AppBinding;

            fillAndTrimBindingsInformation(inBinding);
            expect(inBinding).toEqual(outBinding);
        });

        test('Populate ids on the way up.', () => {
            const inBinding: AppBinding = {
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc2',
                        bindings: [
                            {
                                app_id: 'id1',
                                location: 'loc3',
                            } as AppBinding,
                            {
                                app_id: 'id2',
                                location: 'loc4',
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        app_id: 'id3',
                        location: 'loc5',
                    } as AppBinding,
                ],
            } as AppBinding;

            const outBinding: AppBinding = {
                app_id: 'id1',
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc1/loc2',
                        app_id: 'id1',
                        call: {
                            path: 'url',
                        } as AppCall,
                        bindings: [
                            {
                                location: 'loc1/loc2/loc3',
                                app_id: 'id1',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                            {
                                location: 'loc1/loc2/loc4',
                                app_id: 'id2',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        location: 'loc1/loc5',
                        app_id: 'id3',
                        call: {
                            path: 'url',
                        } as AppCall,
                    },
                ],
            } as AppBinding;

            fillAndTrimBindingsInformation(inBinding);
            expect(inBinding).toEqual(outBinding);
        });

        test('Populate calls on the way up.', () => {
            const inBinding: AppBinding = {
                location: 'loc1',
                bindings: [
                    {
                        location: 'loc2',
                        bindings: [
                            {
                                app_id: 'id1',
                                location: 'loc3',
                                call: {
                                    path: 'url1',
                                } as AppCall,
                            } as AppBinding,
                            {
                                app_id: 'id2',
                                location: 'loc4',
                                call: {
                                    path: 'url2',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        app_id: 'id3',
                        location: 'loc5',
                        call: {
                            path: 'url3',
                        } as AppCall,
                    } as AppBinding,
                ],
            } as AppBinding;

            const outBinding: AppBinding = {
                app_id: 'id1',
                location: 'loc1',
                call: {
                    path: 'url1',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc1/loc2',
                        app_id: 'id1',
                        call: {
                            path: 'url1',
                        } as AppCall,
                        bindings: [
                            {
                                location: 'loc1/loc2/loc3',
                                app_id: 'id1',
                                call: {
                                    path: 'url1',
                                } as AppCall,
                            } as AppBinding,
                            {
                                location: 'loc1/loc2/loc4',
                                app_id: 'id2',
                                call: {
                                    path: 'url2',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        location: 'loc1/loc5',
                        app_id: 'id3',
                        call: {
                            path: 'url3',
                        } as AppCall,
                    },
                ],
            } as AppBinding;

            fillAndTrimBindingsInformation(inBinding);
            expect(inBinding).toEqual(outBinding);
        });

        test('Trim branches without app_id.', () => {
            const inBinding: AppBinding = {
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc2',
                        bindings: [
                            {
                                location: 'loc3',
                            } as AppBinding,
                            {
                                app_id: 'id',
                                location: 'loc4',
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        location: 'loc5',
                    } as AppBinding,
                ],
            } as AppBinding;

            const outBinding: AppBinding = {
                app_id: 'id',
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc1/loc2',
                        app_id: 'id',
                        call: {
                            path: 'url',
                        } as AppCall,
                        bindings: [
                            {
                                location: 'loc1/loc2/loc4',
                                app_id: 'id',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                ],
            } as AppBinding;

            fillAndTrimBindingsInformation(inBinding);
            expect(inBinding).toEqual(outBinding);
        });

        test('Trim branches without call.', () => {
            const inBinding: AppBinding = {
                location: 'loc1',
                app_id: 'id',
                bindings: [
                    {
                        location: 'loc2',
                        bindings: [
                            {
                                location: 'loc3',
                            } as AppBinding,
                            {
                                location: 'loc4',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        location: 'loc5',
                    } as AppBinding,
                ],
            } as AppBinding;

            const outBinding: AppBinding = {
                app_id: 'id',
                location: 'loc1',
                call: {
                    path: 'url',
                } as AppCall,
                bindings: [
                    {
                        location: 'loc1/loc2',
                        app_id: 'id',
                        call: {
                            path: 'url',
                        } as AppCall,
                        bindings: [
                            {
                                location: 'loc1/loc2/loc4',
                                app_id: 'id',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                ],
            } as AppBinding;

            fillAndTrimBindingsInformation(inBinding);
            expect(inBinding).toEqual(outBinding);
        });

        test('Trim mixed invalid branches.', () => {
            const inBinding: AppBinding = {
                location: 'loc1',
                bindings: [
                    {
                        location: 'loc2',
                        bindings: [
                            {
                                location: 'loc3',
                            } as AppBinding,
                            {
                                location: 'loc4',
                                call: {
                                    path: 'url',
                                } as AppCall,
                            } as AppBinding,
                        ],
                    } as AppBinding,
                    {
                        app_id: 'id',
                        location: 'loc5',
                    } as AppBinding,
                ],
            } as AppBinding;

            const outBinding: AppBinding = {
                location: 'loc1',
                bindings: [] as AppBinding[],
            } as AppBinding;

            fillAndTrimBindingsInformation(inBinding);
            expect(inBinding).toEqual(outBinding);
        });
    });
});
