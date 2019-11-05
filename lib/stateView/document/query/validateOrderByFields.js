function checkIndices(compoundIndex, conditions) {
  return compoundIndex
    .every(([field, direction]) => conditions
      .some(([conditionField, conditionDirection]) => {
        const directionToCompare = conditionDirection === '*' ? direction : conditionDirection;

        return field === conditionField && direction === directionToCompare;
      }));
}

/**
 * Validate query to sort by only indexed fields
 *
 * @typedef validateOrderByFields
 * @param {Array} dataContractIndexFields
 * @param {Array} orderByConditions
 * @param {Array} [whereConditions]
 * @returns {Array}
 */
function validateOrderByFields(
  dataContractIndexFields,
  orderByConditions,
  whereConditions = [],
) {
  // flat where conditions and set sort directions
  const compiledWhereBy = whereConditions.reduce(
    (fields, [field, operator, elementMatchValue]) => {
      let fieldsToAdd = [];

      if (operator === 'elementMatch') {
        fieldsToAdd = elementMatchValue.map(([item]) => [
          `${field}.${item}`,
          '*',
        ]);
      } else {
        fieldsToAdd = [[field, '*']];
      }

      return fields.concat(fieldsToAdd);
    },
    [],
  );

  // convert dataContractIndex index objects to array
  let compiledDataContractIndexFields = dataContractIndexFields.map(
    compoundIndex => compoundIndex.map((index) => {
      const [[field, direction]] = Object.entries(index);

      return [field, direction];
    }),
  );

  // mongoDB can sort by two directions in single field indices. So we can add this directions.
  const additionalIndices = [];
  compiledDataContractIndexFields.forEach((compoundIndex) => {
    if (compoundIndex.length === 1) {
      const [field, direction] = compoundIndex[0];
      const newDirection = direction === 'asc' ? 'desc' : 'asc';
      const alreadyHasIndex = compiledDataContractIndexFields.some(
        (indexArray) => {
          const [oldField, oldDirection] = indexArray[0];

          return (
            indexArray.length === 1
            && oldField === field
            && oldDirection === newDirection
          );
        },
      );

      if (!alreadyHasIndex) {
        additionalIndices.push([[field, newDirection]]);
      }
    }
  });

  compiledDataContractIndexFields = compiledDataContractIndexFields.concat(
    additionalIndices,
  );

  // leave only indices that contain all orderBy fields
  compiledDataContractIndexFields = compiledDataContractIndexFields.filter(
    compoundIndex => orderByConditions
      .every(([field, direction]) => compoundIndex
        .some(
          ([indexField, indexDirection]) => field === indexField && direction === indexDirection,
        )),
  );

  // leave only only fields that not pass out validation
  return orderByConditions
    .filter(([field]) => (
      !compiledDataContractIndexFields
        .find(index => index
          .find(([indexField], i) => {
            if (indexField !== field) {
              return false;
            }

            // part of compound index before our orderBy field
            const compoundIndexBefore = index.slice(0, i);

            // part of compound index after our orderBy field
            const compoundIndexAfter = index.slice(i, index.length);

            // check that all index fields of this part are inside where or orderBy conditions
            const compoundFieldsBeforeIsOk = checkIndices(compoundIndexBefore, compiledWhereBy)
                || checkIndices(compoundIndexBefore, orderByConditions);

            // check that all index fields of this part are inside orderBy conditions
            const compoundFieldsAfterIsOk = checkIndices(
              compoundIndexAfter.slice(0, orderByConditions.length),
              orderByConditions,
            );

            return compoundFieldsBeforeIsOk && compoundFieldsAfterIsOk;
          }))
    ))
    // return only fields
    .map(([field]) => field);
}

module.exports = validateOrderByFields;
