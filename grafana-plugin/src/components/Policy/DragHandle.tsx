import React from 'react';

import { cx } from '@emotion/css';
import { Icon, useStyles2 } from '@grafana/ui';
import { bem } from 'styles/utils.styles';

import { useSortableItemContext } from 'components/SortableList/SortableItemContext';

import { getPolicyStyles } from './Policy.styles';

const _DragHandle = ({ disabled }: { disabled?: boolean }) => {
  const styles = useStyles2(getPolicyStyles);
  const sortable = useSortableItemContext();

  return (
    <div
      {...sortable?.attributes}
      {...sortable?.listeners}
      className={cx(styles.control, styles.handle, { [bem(styles.handle, 'disabled')]: disabled })}
    >
      <Icon name="draggabledots" />
    </div>
  );
};

export const DragHandle = _DragHandle;
