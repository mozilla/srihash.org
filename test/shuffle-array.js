/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

const assert = require('assert').strict;
const shuffleArray = require('../lib/shuffle-array');

describe('shuffleArray()', () => {
  it('preserves length', () => {
    const a = ['a', 'b', 'c', 'd'];
    const result = shuffleArray(a);

    assert.equal(result.length, a.length);
  });

  it('returns all elements', () => {
    const a = ['a', 'b'];
    const result = shuffleArray(a);

    assert.equal(result[0] === 'a' || result[1] === 'a', true);
    assert.equal(result[0] === 'b' || result[1] === 'b', true);
  });

  it('clones the array', () => {
    const a = ['a'];
    const result = shuffleArray(a);

    a[0] = 'b';
    assert.equal(result[0], 'a');
  });
});
