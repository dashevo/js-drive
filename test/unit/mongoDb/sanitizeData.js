const { sanitize, unsanitize, VALID_PREFIX } = require('../../../lib/mongoDb/sanitizeData');

describe('sanitizeData', () => {
  let unsanitizedData;
  let sanitizedData;

  beforeEach(() => {
    sanitizedData = {
      [`${VALID_PREFIX}$a`]: {
        a: 1,
        b: 2,
        [`${VALID_PREFIX}$c`]: {
          a: 1,
          b: 2,
        },
      },
      b: [
        { [`${VALID_PREFIX}$a`]: 1 },
        { b: 2 },
        { c: 3 },
      ],
      c: 3,
    };

    unsanitizedData = {
      $a: {
        a: 1,
        b: 2,
        $c: {
          a: 1,
          b: 2,
        },
      },
      b: [
        { $a: 1 },
        { b: 2 },
        { c: 3 },
      ],
      c: 3,
    };
  });

  describe('sanitize', () => {
    it('should add more dollar char to dollar-prefixed fields', () => {
      const result = sanitize(unsanitizedData);

      expect(result).to.be.deep.equal(sanitizedData);
    });
  });

  describe('unsanitize', () => {
    it('should remove dollar-char from dollar-prefixed fields', () => {
      const result = unsanitize(sanitizedData);

      expect(result).to.be.deep.equal(unsanitizedData);
    });
  });
});
