import { get, has, isEmpty } from 'lodash';

const getDraftRelations = (data, ctSchema, components) => {
  const getDraftRelationsCount = (data, schema) =>
    Object.keys(data).reduce((acc, current) => {
      const type = get(schema, ['schema', 'attributes', current, 'type'], 'string');
      const relationType = get(schema, ['schema', 'attributes', current, 'relationType'], '');
      const isMorph = relationType.toLowerCase().includes('morph');
      const oneWayTypes = ['oneWay', 'oneToOne', 'manyToOne'];
      const currentData = data[current];

      if (type === 'dynamiczone') {
        currentData.forEach(curr => {
          const compoSchema = get(components, curr.__component, {});

          acc += getDraftRelationsCount(curr, compoSchema);
        });
      }

      if (type === 'component') {
        const isRepeatable = get(schema, ['schema', 'attributes', current, 'repeatable'], false);
        const compoUID = get(schema, ['schema', 'attributes', current, 'component'], '');
        const compoSchema = get(components, compoUID, {});

        if (isRepeatable) {
          currentData.forEach(curr => {
            acc += getDraftRelationsCount(curr, compoSchema);
          });
        } else {
          acc += getDraftRelationsCount(currentData, compoSchema);
        }
      }

      if (type === 'relation' && !isMorph) {
        if (oneWayTypes.includes(relationType)) {
          const hasDraftAndPublish = has(currentData, 'published_at');

          if (hasDraftAndPublish && isEmpty(currentData.published_at)) {
            acc += 1;
          }
        } else {
          currentData.forEach(value => {
            if (has(value, 'published_at') && isEmpty(value.published_at)) {
              acc += 1;
            }
          });
        }
      }

      return acc;
    }, 0);

  const count = getDraftRelationsCount(data, ctSchema, components);

  return count;
};

export default getDraftRelations;
