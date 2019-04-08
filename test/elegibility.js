/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

const assert = require('assert').strict;
const eligibility = require('../lib/eligibility');

describe('eligibility()', () => {
  describe('Eligible', () => {
    it('CORS', () => {
      const allGood = {
        headers: {
          'access-control-allow-origin': '*'
        }
      };
      const result = eligibility(allGood);

      assert.deepEqual(result, []);
    });
  });

  describe('Non-eligible', () => {
    it('non-CORS', () => {
      const nonCORS = {
        headers: {
          dnt: '1'
        }
      };
      const result = eligibility(nonCORS);

      assert.deepEqual(result, ['non-cors']);
    });
  });
});
