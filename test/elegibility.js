/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

const assert = require('assert').strict;
const eligibility = require('../lib/eligibility');

describe('eligibility()', () => {
  describe('Eligible', () => {
    it('CORS', () => {
      const allGood = {
        headersMap: {
          'access-control-allow-origin': '*'
        },
        headers: {
          get: (key) => allGood.headersMap[key]
        }
      };
      const result = eligibility(allGood);

      assert.deepEqual(result, []);
    });
  });

  describe('Non-eligible', () => {
    it('non-CORS', () => {
      const nonCORS = {
        headersMap: {
          dnt: '1'
        },
        headers: {
          get: (key) => nonCORS.headersMap[key]
        }
      };
      const result = eligibility(nonCORS);

      assert.deepEqual(result, ['non-cors']);
    });
  });
});
