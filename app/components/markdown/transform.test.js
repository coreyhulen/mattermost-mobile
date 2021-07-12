// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Node, Parser} from 'commonmark';

import {
    addListItemIndices,
    combineTextNodes,
    getFirstMention,
    highlightMentions,
    highlightTextNode,
    pullOutImages,
} from '@components/markdown/transform';

/* eslint-disable no-console, no-underscore-dangle */

describe('Components.Markdown.transform', () => {
    const parser = new Parser();

    describe('combineTextNodes', () => {
        const tests = [{
            name: 'no text nodes',
            input: {
                type: 'document',
                children: [{
                    type: 'thematic_break',
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'thematic_break',
                }],
            },
        }, {
            name: 'one text node',
            input: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a sentence',
                    }],
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a sentence',
                    }],
                }],
            },
        }, {
            name: 'multiple text nodes',
            input: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This ',
                    }, {
                        type: 'text',
                        literal: 'is a',
                    }, {
                        type: 'text',
                        literal: ' sen',
                    }, {
                        type: 'text',
                        literal: 'tence',
                    }],
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a sentence',
                    }],
                }],
            },
        }, {
            name: 'mixed formatting',
            input: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'text',
                            literal: 'is a',
                        }],
                    }, {
                        type: 'text',
                        literal: ' sen',
                    }, {
                        type: 'text',
                        literal: 'tence',
                    }],
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'text',
                            literal: 'is a',
                        }],
                    }, {
                        type: 'text',
                        literal: ' sentence',
                    }],
                }],
            },
        }, {
            name: 'multiple paragraphs',
            input: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a ',
                    }, {
                        type: 'text',
                        literal: 'paragraph',
                    }],
                }, {
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is',
                    }, {
                        type: 'text',
                        literal: ' another ',
                    }, {
                        type: 'text',
                        literal: 'paragraph',
                    }],
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a paragraph',
                    }],
                }, {
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is another paragraph',
                    }],
                }],
            },
        }, {
            name: 'MM-12880 merging text followed by non-text',
            input: 'test: *italics*',
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'test: ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'text',
                            literal: 'italics',
                        }],
                    }],
                }],
            },
        }, {
            name: 'MM-12880 merging text followed by image',
            input: 'test: ![image](https://example.com/image)',
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'test: ',
                    }, {
                        type: 'image',
                        destination: 'https://example.com/image',
                        title: '',
                        children: [{
                            type: 'text',
                            literal: 'image',
                        }],
                    }],
                }],
            },
        }];

        for (const test of tests) {
            it(test.name, () => {
                const input = typeof test.input === 'string' ? parser.parse(test.input) : makeAst(test.input);
                const expected = makeAst(test.expected);
                const actual = combineTextNodes(input);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(astToString(actual), astToString(expected));
                assert.deepStrictEqual(stripUnusedFields(actual), stripUnusedFields(expected));
            });
        }
    });

    describe('addListItemIndices', () => {
        it('unordered list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    children: [{
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const actual = addListItemIndices(input);

            assert.ok(verifyAst(actual));
            assert.deepStrictEqual(actual, expected);
        });

        it('ordered list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    listStart: 7,
                    listDelimiter: 'period',
                    children: [{
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    listStart: 7,
                    listDelimiter: 'period',
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const actual = addListItemIndices(input);

            assert.ok(verifyAst(actual));
            assert.deepStrictEqual(actual, expected);
        });

        it('nested lists', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    listStart: 7,
                    listDelimiter: 'period',
                    children: [{
                        type: 'item',
                        children: [{
                            type: 'list',
                            listType: 'bullet',
                            listTight: true,
                            listStart: 3,
                            listDelimiter: 'period',
                            children: [{
                                type: 'item',
                                children: [{
                                    type: 'pargraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'one',
                                    }],
                                }],
                            }, {
                                type: 'item',
                                children: [{
                                    type: 'list',
                                    listTight: true,
                                    children: [{
                                        type: 'item',
                                        children: [{
                                            type: 'pargraph',
                                            children: [{
                                                type: 'text',
                                                literal: 'one',
                                            }],
                                        }],
                                    }, {
                                        type: 'item',
                                        children: [{
                                            type: 'pargraph',
                                            children: [{
                                                type: 'text',
                                                literal: 'two',
                                            }],
                                        }],
                                    }],
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }, {
                    type: 'list',
                    listTight: true,
                    children: [{
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    listStart: 7,
                    listDelimiter: 'period',
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'list',
                            listType: 'bullet',
                            listTight: true,
                            listStart: 3,
                            listDelimiter: 'period',
                            children: [{
                                type: 'item',
                                index: 3,
                                children: [{
                                    type: 'pargraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'one',
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 4,
                                children: [{
                                    type: 'list',
                                    listTight: true,
                                    children: [{
                                        type: 'item',
                                        index: 1,
                                        children: [{
                                            type: 'pargraph',
                                            children: [{
                                                type: 'text',
                                                literal: 'one',
                                            }],
                                        }],
                                    }, {
                                        type: 'item',
                                        index: 2,
                                        children: [{
                                            type: 'pargraph',
                                            children: [{
                                                type: 'text',
                                                literal: 'two',
                                            }],
                                        }],
                                    }],
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }, {
                    type: 'list',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const actual = addListItemIndices(input);

            assert.ok(verifyAst(actual));
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('pullOutImages', () => {
        it('simple example with no images', () => {
            const input = parser.parse('test');
            const expected = parser.parse('test');
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('complex example with no images', () => {
            const inputString = '- abc\n    1. def\n\n    2. ghi\n\n3. jkl\n- mno\n    1. pqr\n---\n# vwx\n\nyz';
            const input = parser.parse(inputString);
            const expected = parser.parse(inputString);
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('paragraph', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('paragraph with surrounding text', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is text with ',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }, {
                        type: 'text',
                        literal: ' in it',
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is text with ',
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'paragraph',
                    continue: true,
                    children: [{
                        type: 'text',
                        literal: 'in it', // Note that we remove the preceding whitespace
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('paragraph with multiple images', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image2',
                        children: [{
                            type: 'text',
                            literal: 'another image',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'paragraph',
                    continue: true,
                    children: [],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image2',
                    children: [{
                        type: 'text',
                        literal: 'another image',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('headings', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'heading',
                    level: 1,
                    children: [{
                        type: 'text',
                        literal: 'This is the start 1',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 1',
                        }],
                    }],
                }, {
                    type: 'heading',
                    level: 4,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 2',
                        }],
                    }, {
                        type: 'text',
                        literal: 'This is the end 2',
                    }],
                }, {
                    type: 'heading',
                    level: 2,
                    children: [{
                        type: 'text',
                        literal: 'This is the start 3',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 3',
                        }],
                    }, {
                        type: 'text',
                        literal: 'This is the end 3',
                    }],
                }, {
                    type: 'heading',
                    level: 3,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 4a',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 4b',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'heading',
                    level: 1,
                    children: [{
                        type: 'text',
                        literal: 'This is the start 1',
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image 1',
                    }],
                }, {
                    type: 'heading',
                    level: 4,
                    children: [],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image 2',
                    }],
                }, {
                    type: 'heading',
                    level: 4,
                    continue: true,
                    children: [{
                        type: 'text',
                        literal: 'This is the end 2',
                    }],
                }, {
                    type: 'heading',
                    level: 2,
                    children: [{
                        type: 'text',
                        literal: 'This is the start 3',
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image 3',
                    }],
                }, {
                    type: 'heading',
                    level: 2,
                    continue: true,
                    children: [{
                        type: 'text',
                        literal: 'This is the end 3',
                    }],
                }, {
                    type: 'heading',
                    level: 3,
                    children: [],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image 4a',
                    }],
                }, {
                    type: 'heading',
                    level: 3,
                    continue: true,
                    children: [],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image 4b',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('block quote', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('block quote with other text', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'text',
                            literal: 'This is ',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }, {
                            type: 'text',
                            literal: ' in a sentence',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'text',
                            literal: 'This is ',
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'block_quote',
                    continue: true,
                    children: [{
                        type: 'paragraph',
                        continue: true,
                        children: [{
                            type: 'text',
                            literal: 'in a sentence',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('unordered list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 3,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is moretext',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'paragraph',
                            children: [],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 3,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is moretext',
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('ordered list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'paragraph',
                            children: [],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('complicated list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }, {
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 9,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }, {
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 10,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 11,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 8,
                        continue: true,
                        children: [{
                            type: 'paragraph',
                            continue: true,
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 8,
                        continue: true,
                        children: [{
                            type: 'paragraph',
                            continue: true,
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 9,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }, {
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 10,
                        children: [{
                            type: 'paragraph',
                            children: [],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 11,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('nested lists', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'list',
                            listType: 'bulleted',
                            listTight: false,
                            children: [{
                                type: 'item',
                                index: 3,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }, {
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 4,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }, {
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'list',
                            listType: 'ordered',
                            listTight: true,
                            children: [{
                                type: 'item',
                                index: 1,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }, {
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 2,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }, {
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }],
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'list',
                            listType: 'bulleted',
                            listTight: false,
                            children: [{
                                type: 'item',
                                index: 3,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        continue: true,
                        children: [{
                            type: 'list',
                            listType: 'bulleted',
                            listTight: false,
                            continue: true,
                            children: [{
                                type: 'item',
                                index: 4,
                                children: [{
                                    type: 'paragraph',
                                    children: [],
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        continue: true,
                        children: [{
                            type: 'list',
                            listType: 'bulleted',
                            listTight: false,
                            continue: true,
                            children: [{
                                type: 'item',
                                index: 4,
                                continue: true,
                                children: [{
                                    type: 'paragraph',
                                    continue: true,
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'list',
                            listType: 'ordered',
                            listTight: true,
                            children: [{
                                type: 'item',
                                index: 1,
                                children: [{
                                    type: 'paragraph',
                                    children: [],
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 2,
                        continue: true,
                        children: [{
                            type: 'list',
                            listType: 'ordered',
                            listTight: true,
                            continue: true,
                            children: [{
                                type: 'item',
                                index: 1,
                                continue: true,
                                children: [{
                                    type: 'paragraph',
                                    continue: true,
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 2,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('complex example with images', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bulleted',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/abc',
                                children: [{
                                    type: 'text',
                                    literal: 'abc',
                                }],
                            }],
                        }, {
                            type: 'list',
                            listType: 'numbered',
                            listTight: false,
                            children: [{
                                type: 'item',
                                index: 1,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/def',
                                        children: [{
                                            type: 'text',
                                            literal: 'def',
                                        }],
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 2,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/ghi',
                                        children: [{
                                            type: 'text',
                                            literal: 'ghi',
                                        }],
                                    }],
                                }],
                            }],
                        }],

                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 3,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/jkl',
                                children: [{
                                    type: 'text',
                                    literal: 'jkl',
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/mno',
                            children: [{
                                type: 'text',
                                literal: 'mno',
                            }],
                        }, {
                            type: 'softbreak',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/pqr',
                            children: [{
                                type: 'text',
                                literal: 'pqr',
                            }],
                        }],
                    }],
                }, {
                    type: 'thematic_break',
                }, {
                    type: 'heading',
                    level: 1,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'vw',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'x',
                        }],
                    }],
                }, {
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'yz',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bulleted',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'paragraph',
                            children: [],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/abc',
                    children: [{
                        type: 'text',
                        literal: 'abc',
                    }],
                }, {
                    type: 'list',
                    listType: 'bulleted',
                    listTight: true,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        continue: true,
                        children: [{
                            type: 'list',
                            listType: 'numbered',
                            listTight: false,
                            children: [{
                                type: 'item',
                                index: 1,
                                children: [{
                                    type: 'paragraph',
                                    children: [],
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/def',
                    children: [{
                        type: 'text',
                        literal: 'def',
                    }],
                }, {
                    type: 'list',
                    listType: 'bulleted',
                    listTight: true,
                    continue: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        continue: true,
                        children: [{
                            type: 'list',
                            listType: 'numbered',
                            listTight: false,
                            continue: true,
                            children: [{
                                type: 'item',
                                index: 2,
                                children: [{
                                    type: 'paragraph',
                                    children: [],
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/ghi',
                    children: [{
                        type: 'text',
                        literal: 'ghi',
                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 3,
                        children: [{
                            type: 'paragraph',
                            children: [],
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/jkl',
                    children: [{
                        type: 'text',
                        literal: 'jkl',
                    }],
                }, {
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/mno',
                    children: [{
                        type: 'text',
                        literal: 'mno',
                    }],
                }, {
                    type: 'block_quote',
                    continue: true,
                    children: [{
                        type: 'paragraph',
                        continue: true,
                        children: [{
                            type: 'softbreak',
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/pqr',
                    children: [{
                        type: 'text',
                        literal: 'pqr',
                    }],
                }, {
                    type: 'thematic_break',
                }, {
                    type: 'heading',
                    level: 1,
                    children: [],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'vw',
                    }],
                }, {
                    type: 'heading',
                    level: 1,
                    continue: true,
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'x',
                    }],
                }, {
                    type: 'paragraph',
                    children: [],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'yz',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('simple link', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        children: [],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    linkDestination: 'http://example.com',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('link in sentence', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        children: [{
                            type: 'text',
                            literal: 'This is ',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }, {
                            type: 'text',
                            literal: ' in a sentence.',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        children: [{
                            type: 'text',
                            literal: 'This is ',
                        }],
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    linkDestination: 'http://example.com',
                    children: [{
                        type: 'text',
                        literal: 'an image',
                    }],
                }, {
                    type: 'paragraph',
                    continue: true,
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        continue: true,
                        children: [{
                            type: 'text',
                            literal: 'in a sentence.',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('table', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'table',
                    children: [{
                        type: 'table_row',
                        isHeading: true,
                        children: [{
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }],
                        }, {
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'text',
                                literal: 'This is ',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }, {
                                type: 'text',
                                literal: ' in a sentence.',
                            }],
                        }],
                    }, {
                        type: 'table_row',
                        isHeading: true,
                        children: [{
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'text',
                                literal: 'This is ',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }, {
                                type: 'text',
                                literal: ' in a sentence.',
                            }],
                        }, {
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'table',
                    children: [{
                        type: 'table_row',
                        isHeading: true,
                        children: [{
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }],
                        }, {
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'text',
                                literal: 'This is ',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }, {
                                type: 'text',
                                literal: ' in a sentence.',
                            }],
                        }],
                    }, {
                        type: 'table_row',
                        isHeading: true,
                        children: [{
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'text',
                                literal: 'This is ',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }, {
                                type: 'text',
                                literal: ' in a sentence.',
                            }],
                        }, {
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('adjacent images and text', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'First:',
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'Image',
                        }],
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'text',
                        literal: 'Second:',
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'Image',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'First:',
                    }, {
                        type: 'softbreak',
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'Image',
                    }],
                }, {
                    type: 'paragraph',
                    continue: true,
                    children: [{
                        type: 'softbreak',
                    }, {
                        type: 'text',
                        literal: 'Second:',
                    }, {
                        type: 'softbreak',
                    }],
                }, {
                    type: 'image',
                    destination: 'http://example.com/image',
                    children: [{
                        type: 'text',
                        literal: 'Image',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('highlightMentions', () => {
        const tests = [{
            name: 'no mentions',
            input: 'These are words',
            mentionKeys: [],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are words',
                    }],
                }],
            },
        }, {
            name: 'not an at-mention',
            input: 'These are words',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }],
                }],
            },
        }, {
            name: 'at-mention for another user',
            input: 'This is @user',
            mentionKeys: [{key: '@words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is ',
                    }, {
                        type: 'at_mention',
                        _mentionName: 'user',
                        children: [{
                            type: 'text',
                            literal: '@user',
                        }],
                    }],
                }],
            },
        }, {
            name: 'at-mention',
            input: 'These are @words',
            mentionKeys: [{key: '@words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'at_mention',
                            _mentionName: 'words',
                            children: [{
                                type: 'text',
                                literal: '@words',
                            }],
                        }],
                    }],
                }],
            },
        }, {
            name: 'at-mention and non-at-mention for same word',
            input: 'These are @words',
            mentionKeys: [{key: 'words'}, {key: '@words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'at_mention',
                            _mentionName: 'words',
                            children: [{
                                type: 'text',
                                literal: '@words',
                            }],
                        }],
                    }],
                }],
            },
        }, {
            name: 'case insensitive mentions',
            input: 'These are Words and wORDS',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'Words',
                        }],
                    }, {
                        type: 'text',
                        literal: ' and ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'wORDS',
                        }],
                    }],
                }],
            },
        }, {
            name: 'case sesitive mentions',
            input: 'These are Words and wORDS',
            mentionKeys: [{key: 'Words', caseSensitive: true}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'Words',
                        }],
                    }, {
                        type: 'text',
                        literal: ' and wORDS',
                    }],
                }],
            },
        }, {
            name: 'bold',
            input: 'These are **words** in a sentence',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'strong',
                        children: [{
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }],
                    }, {
                        type: 'text',
                        literal: ' in a sentence',
                    }],
                }],
            },
        }, {
            name: 'italics',
            input: 'These _are Words in_ a sentence',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'text',
                            literal: 'are ',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'Words',
                            }],
                        }, {
                            type: 'text',
                            literal: ' in',
                        }],
                    }, {
                        type: 'text',
                        literal: ' a sentence',
                    }],
                }],
            },
        }, {
            name: 'code span',
            input: 'These are `words`',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'code',
                        literal: 'words',
                    }],
                }],
            },
        }, {
            name: 'code block',
            input: '```\nThese are\nwords\n```',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'code_block',
                    literal: 'These are\nwords\n',
                }],
            },
        }, {
            name: 'link text',
            input: 'These are [words words](https://example.com)',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'link',
                        destination: 'https://example.com',
                        title: '',
                        children: [{
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }, {
                            type: 'text',
                            literal: ' ',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }],
                    }],
                }],
            },
        }, {
            name: 'link url',
            input: 'This is [a link](https://example.com/words)',
            mentionKeys: [{key: 'example'}, {key: 'com'}, {key: 'https'}, {key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is ',
                    }, {
                        type: 'link',
                        destination: 'https://example.com/words',
                        title: '',
                        children: [{
                            type: 'text',
                            literal: 'a link',
                        }],
                    }],
                }],
            },
        }, {
            name: 'autolinked url',
            input: 'https://example.com/words',
            mentionKeys: [{key: 'example'}, {key: 'com'}, {key: 'https'}, {key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'https://example.com/words',
                        title: '',
                        children: [{
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'https',
                            }],
                        }, {
                            type: 'text',
                            literal: '://',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'example',
                            }],
                        }, {
                            type: 'text',
                            literal: '.',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'com',
                            }],
                        }, {
                            type: 'text',
                            literal: '/',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }],
                    }],
                }],
            },
        }, {
            name: 'words with punctuation',
            input: 'words. (words) words/words/words words:words',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: '. (',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: ') ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: '/',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: '/',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: ' ',
                    }, {
                        type: 'link',
                        destination: 'words:words',
                        title: '',
                        children: [{
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }, {
                            type: 'text',
                            literal: ':',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }],
                    }],
                }],
            },
        }, {
            name: 'multibyte keyword',
            input: '我爱吃番茄炒饭',
            mentionKeys: [{key: '番茄'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: '我爱吃',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: '番茄',
                        }],
                    }, {
                        type: 'text',
                        literal: '炒饭',
                    }],
                }],
            },
        }, {
            name: 'multiple multibyte keywords',
            input: 'CJK is 中國日本한국.',
            mentionKeys: [{key: '中國'}, {key: '日本'}, {key: '한국'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'CJK is ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: '中國',
                        }],
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: '日本',
                        }],
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: '한국',
                        }],
                    }, {
                        type: 'text',
                        literal: '.',
                    }],
                }],
            },
        }, {
            name: 'Mention followed by a period',
            input: 'This is a mention for @channel.',
            mentionKeys: [{key: 'channel'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a mention for ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'at_mention',
                            _mentionName: 'channel.',
                            children: [{
                                type: 'text',
                                literal: '@channel.',
                            }],
                        }],
                    }],
                }],
            },
        }];

        for (const test of tests) {
            it(test.name, () => {
                const input = combineTextNodes(parser.parse(test.input));
                const expected = makeAst(test.expected);
                const actual = highlightMentions(input, test.mentionKeys);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(stripUnusedFields(actual), stripUnusedFields(expected));
            });
        }
    });

    describe('getFirstMention', () => {
        const tests = [{
            name: 'no mention keys',
            input: 'apple banana orange',
            mentionKeys: [],
            expected: {index: -1, mention: null},
        }, {
            name: 'single mention',
            input: 'apple banana orange',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 6, mention: {key: 'banana'}},
        }, {
            name: 'multiple mentions',
            input: 'apple banana orange',
            mentionKeys: [{key: 'apple'}, {key: 'orange'}],
            expected: {index: 0, mention: {key: 'apple'}},
        }, {
            name: 'case sensitive',
            input: 'apple APPLE Apple aPPle',
            mentionKeys: [{key: 'Apple', caseSensitive: true}],
            expected: {index: 12, mention: {key: 'Apple', caseSensitive: true}},
        }, {
            name: 'followed by period',
            input: 'banana.',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 0, mention: {key: 'banana'}},
        }, {
            name: 'followed by underscores',
            input: 'banana__',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 0, mention: {key: 'banana'}},
        }, {
            name: 'in brackets',
            input: '(banana)',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 1, mention: {key: 'banana'}},
        }, {
            name: 'following punctuation',
            input: ':banana',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 1, mention: {key: 'banana'}},
        }, {
            name: 'not part of another word',
            input: 'pineapple',
            mentionKeys: [{key: 'apple'}],
            expected: {index: -1, mention: null},
        }, {
            name: 'no error from weird mention keys',
            input: 'apple banana orange',
            mentionKeys: [{key: '*\\3_.'}],
            expected: {index: -1, mention: null},
        }, {
            name: 'no blank mention keys',
            input: 'apple banana orange',
            mentionKeys: [{key: ''}],
            expected: {index: -1, mention: null},
        }, {
            name: 'multibyte key',
            input: '좋은 하루 되세요.',
            mentionKeys: [{key: '하루'}],
            expected: {index: 3, mention: {key: '하루'}},
        }];

        for (const test of tests) {
            it(test.name, () => {
                const actual = getFirstMention(test.input, test.mentionKeys);

                assert.deepStrictEqual(actual, test.expected);
            });
        }
    });

    describe('highlightTextNode', () => {
        const type = 'my_highlight';
        const literal = 'This is a sentence';

        const tests = [{
            name: 'highlight entire text',
            start: 0,
            end: literal.length,
            expected: [{
                type,
                children: [{
                    type: 'text',
                    literal,
                }],
            }],
        }, {
            name: 'highlight start of text',
            start: 0,
            end: 6,
            expected: [{
                type,
                children: [{
                    type: 'text',
                    literal: 'This i',
                }],
            }, {
                type: 'text',
                literal: 's a sentence',
            }],
        }, {
            name: 'highlight end of text',
            start: 8,
            end: literal.length,
            expected: [{
                type: 'text',
                literal: 'This is ',
            }, {
                type,
                children: [{
                    type: 'text',
                    literal: 'a sentence',
                }],
            }],
        }, {
            name: 'highlight middle of text',
            start: 5,
            end: 12,
            expected: [{
                type: 'text',
                literal: 'This ',
            }, {
                type,
                children: [{
                    type: 'text',
                    literal: 'is a se',
                }],
            }, {
                type: 'text',
                literal: 'ntence',
            }],
        }];

        for (const test of tests) {
            it(test.name + ', without siblings', () => {
                const actual = makeAst({
                    type: 'parent',
                    children: [{
                        type: 'text',
                        literal,
                    }],
                });
                const expected = makeAst({
                    type: 'parent',
                    children: test.expected,
                });

                const node = actual.firstChild;
                assert.equal(node.type, 'text');

                const highlighted = highlightTextNode(node, test.start, test.end, type);
                assert.equal(highlighted.type, type);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(actual, expected);
            });

            it(test.name + ', with siblings', () => {
                const actual = makeAst({
                    type: 'parent',
                    children: [{
                        type: 'previous',
                    }, {
                        type: 'text',
                        literal,
                    }, {
                        type: 'next',
                    }],
                });
                const expected = makeAst({
                    type: 'parent',
                    children: [
                        {
                            type: 'previous',
                        },
                        ...test.expected,
                        {
                            type: 'next',
                        },
                    ],
                });

                const node = actual.firstChild.next;
                assert.equal(node.type, 'text');

                const highlighted = highlightTextNode(node, test.start, test.end, type);
                assert.equal(highlighted.type, type);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(actual, expected);
            });
        }
    });
});

// Testing and debugging functions

// Confirms that all parent, child, and sibling linkages are correct and go both ways.
function verifyAst(node) {
    if (node.prev && node.prev.next !== node) {
        console.error('node is not linked properly to prev'); //eslint-disable-line no-console
        return false;
    }

    if (node.next && node.next.prev !== node) {
        console.error('node is not linked properly to next'); //eslint-disable-line no-console
        return false;
    }

    if (!node.firstChild && node.lastChild) {
        console.error('node has children, but is not linked to first child'); //eslint-disable-line no-console
        return false;
    }

    if (node.firstChild && !node.lastChild) {
        console.error('node has children, but is not linked to last child'); //eslint-disable-line no-console
        return false;
    }

    for (let child = node.firstChild; child; child = child.next) {
        if (child.parent !== node) {
            console.error('node is not linked properly to child'); //eslint-disable-line no-console
            return false;
        }

        if (!verifyAst(child)) {
            return false;
        }

        if (!child.next && child !== node.lastChild) {
            console.error('node children are not linked correctly'); //eslint-disable-line no-console
            return false;
        }
    }

    if (node.firstChild && node.firstChild.prev) {
        console.error('node\'s first child has previous sibling'); //eslint-disable-line no-console
        return false;
    }

    if (node.lastChild && node.lastChild.next) {
        console.error('node\'s last child has next sibling'); //eslint-disable-line no-console
        return false;
    }

    return true;
}

function astToString(node, indent = '') { // eslint-disable-line no-unused-vars
    if (!node) {
        return '';
    }

    let out = '';

    out += indent + nodeToString(node) + '\n';

    for (let child = node.firstChild; child !== null; child = child.next) {
        out += astToString(child, indent + '  ');
    }

    return out;
}

const neighbours = ['parent', 'prev', 'next', 'firstChild', 'lastChild'];
const importantFields = ['literal', 'destination', 'title', 'level', 'listType', 'listTight', 'listDelimiter', 'mentionName', 'channelName', 'emojiName', 'continue', 'index'];
function nodeToString(node) {
    let out = node.type;

    for (const neighbour of neighbours) {
        if (node[neighbour]) {
            out += ' ' + neighbour + '=`' + node[neighbour].type;
            if (node[neighbour].type === 'text') {
                out += ':' + node[neighbour].literal;
            }
            out += '`';
        }
    }

    for (const field of importantFields) {
        if (node[field]) {
            out += ' ' + field + '=`' + node[field] + '`';
        }
    }

    return out;
}

const ignoredKeys = {_sourcepos: true, _lastLineBlank: true, _open: true, _string_content: true, _info: true, _isFenced: true, _fenceChar: true, _fenceLength: true, _fenceOffset: true, _onEnter: true, _onExit: true};
function astToJson(node, visited = [], indent = '') {
    let out = '{';

    const myVisited = [...visited];
    myVisited.push(node);

    const keys = Object.keys(node).filter((key) => !ignoredKeys[key]);
    if (keys.length > 0) {
        out += '\n';
    }

    for (const [i, key] of keys.entries()) {
        out += indent + '  "' + key + '":';

        const value = node[key];
        if (myVisited.indexOf(value) !== -1) {
            out += '[Circular]';
        } else if (value === null) {
            out += 'null';
        } else if (typeof value === 'number') {
            out += value;
        } else if (typeof value === 'string') {
            out += '"' + value + '"';
        } else if (typeof value === 'boolean') {
            out += String(value);
        } else if (typeof value === 'object') {
            out += astToJson(value, myVisited, indent + '  '); // eslint-disable-line @typescript-eslint/no-unused-vars
        }

        if (i !== keys.length - 1) {
            out += ',\n';
        }
    }

    if (keys.length > 0) {
        out += '\n' + indent;
    }

    out += '}';

    return out;
}

// Converts an AST represented as a JavaScript object into a full Commonmark-compatitle AST.
// This function is intended for use while testing. An example of input would be:
// {
//     type: 'document',
//     children: [{
//         type: 'heading',
//         level: 2,
//         children: [{
//             type: 'text',
//             literal: 'This is a heading'
//         }]
//     }, {
//         type: 'paragraph',
//         children: [{
//             type: 'text',
//             literal: 'This is a paragraph'
//         }]
//     }]
// }
function makeAst(input) {
    const {type, children, ...other} = input;

    const node = new Node(type);

    for (const key of Object.keys(other)) {
        node[key] = other[key];
    }

    if (children) {
        for (const child of children) {
            node.appendChild(makeAst(child));
        }
    }

    return node;
}

// Remove any fields from the AST that are only used while parsing to make testing equality easier.
function stripUnusedFields(node) {
    const walker = node.walker();

    let e;
    while ((e = walker.next())) {
        e.node._open = false;
        e.node._size = null;
        e.node._sourcepos = null;

        e.node._fenceChar = null;
        e.node._fenceLength = 0;
        e.node._fenceOffset = 0;
        e.node._info = '';
        e.node._isFenced = false;
    }

    return node;
}
