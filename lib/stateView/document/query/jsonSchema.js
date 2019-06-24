module.exports = {
  type: 'object',
  properties: {
    where: {
      $id: 'where',
      type: 'array',
      definitions: {
        field: {
          $id: 'field',
          type: 'string',
          minLength: 1,
          maxLength: 255,
          pattern: '^(\\$id|\\$userId|[a-zA-Z0-9-_.]+)$',
        },
        scalarTypes: {
          $id: 'scalarTypes',
          oneOf: [
            {
              type: 'string',
              maxLength: 512,
            },
            {
              type: 'number',
            },
            {
              type: 'boolean',
            },
          ],
        },
      },
      // Condition
      items: {
        type: 'array',
        oneOf: [
          // Comparisons
          {
            items: [
              {
                $ref: 'field',
              },
              {
                type: 'string',
                enum: ['<', '<=', '==', '>', '>='],
              },
              {
                $ref: 'scalarTypes',
              },
            ],
          },
          // in
          {
            items: [
              {
                $ref: 'field',
              },
              {
                type: 'string',
                const: 'in',
              },
              {
                type: 'array',
                items: {
                  $ref: 'scalarTypes',
                },
                uniqueItems: true,
                minItems: 1,
                maxItems: 100,
              },
            ],
          },
          // startsWith
          {
            items: [
              {
                $ref: 'field',
              },
              {
                type: 'string',
                const: 'startsWith',
              },
              {
                type: 'string',
                minLength: 1,
                maxLength: 255,
              },
            ],
          },
          // elementMatch
          {
            items: [
              {
                $ref: 'field',
              },
              {
                type: 'string',
                const: 'elementMatch',
              },
              {
                allOf: [
                  {
                    $ref: 'where',
                  },
                  {
                    type: 'array',
                    minItems: 2,
                  },
                ],
              },
            ],
          },
          // length
          {
            items: [
              {
                $ref: 'field',
              },
              {
                type: 'string',
                const: 'length',
              },
              {
                type: 'number',
                minimum: 0,
                multipleOf: 1.0,
              },
            ],
          },
          // contains
          {
            items: [
              {
                $ref: 'field',
              },
              {
                type: 'string',
                const: 'contains',
              },
              {
                oneOf: [
                  {
                    $ref: 'scalarTypes',
                  },
                  {
                    type: 'array',
                    items: {
                      $ref: 'scalarTypes',
                    },
                    uniqueItems: true,
                    minItems: 1,
                    maxItems: 100,
                  },
                ],
              },
            ],
          },
        ],
        additionalItems: false,
        minItems: 3,
        maxItems: 3,
      },
      maxItems: 10,
    },
    limit: {
      type: 'number',
      minValue: 1,
      maxValue: 100,
      multipleOf: 1.0,
      default: 100,
    },
    orderBy: {
      type: 'array',
      items: {
        type: 'array',
        items: [
          {
            $ref: 'field',
          },
          {
            type: 'string',
            enum: ['asc', 'desc'],
          },
        ],
        minItems: 2,
        maxItems: 2,
        additionalItems: false,
      },
      minItems: 1,
      maxItems: 2,
    },
  },
  oneOf: [
    {
      type: 'object',
      properties: {
        startAt: {
          type: 'number',
          minValue: 1,
          maxValue: 20000,
        },
      },
    },
    {
      type: 'object',
      properties: {
        startAfter: {
          type: 'number',
          minValue: 1,
          maxValue: 20000,
        },
      },
    },
  ],
  additionalProperties: false,
};
