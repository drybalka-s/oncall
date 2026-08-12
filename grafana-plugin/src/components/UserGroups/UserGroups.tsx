import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cx } from '@emotion/css';
import { Stack, IconButton, useStyles2 } from '@grafana/ui';
import { arrayMoveImmutable } from 'array-move';
import { UserActions } from 'helpers/authorization/authorization';
import { bem } from 'styles/utils.styles';

import { Text } from 'components/Text/Text';
import { RemoteSelect } from 'containers/RemoteSelect/RemoteSelect';
import { ApiSchemas } from 'network/oncall-api/api.types';

import { fromPlainArray, toPlainArray } from './UserGroups.helpers';
import { getUserGroupStyles } from './UserGroups.styles';
import { Item } from './UserGroups.types';

interface UserGroupsProps {
  value: Array<Array<ApiSchemas['User']['pk']>>;
  onChange: (value: Array<Array<ApiSchemas['User']['pk']>>) => void;
  isMultipleGroups: boolean;
  renderUser: (id: string) => React.ReactElement;
  showError?: boolean;
  disabled?: boolean;
}

export const UserGroups = (props: UserGroupsProps) => {
  const styles = useStyles2(getUserGroupStyles);
  const { value, onChange, isMultipleGroups, renderUser, showError, disabled } = props;

  const handleAddUserGroup = useCallback(() => {
    onChange([...value, []]);
  }, [value]);

  const handleDeleteUser = (index: number) => {
    const newGroups = [...value];
    let k = -1;
    for (let i = 0; i < value.length; i++) {
      k++;
      const users = value[i];
      for (let j = 0; j < users.length; j++) {
        k++;

        if (k === index) {
          newGroups[i] = newGroups[i].filter((_item, itemIndex) => itemIndex !== j);
          onChange(newGroups.filter((group) => group.length));
          return;
        }
      }
    }
  };

  const handleUserAdd = useCallback(
    (pk: ApiSchemas['User']['pk']) => {
      if (!pk) {
        return;
      }

      const newGroups = [...value];
      let lastGroup = newGroups[newGroups.length - 1];
      if (!isMultipleGroups || (lastGroup && !lastGroup.length)) {
        if (!lastGroup) {
          lastGroup = [];
          newGroups.push(lastGroup);
        }
        lastGroup.push(pk);
      } else {
        newGroups.push([pk]);
      }

      onChange(newGroups);
    },
    [value]
  );

  const items = useMemo(() => toPlainArray(value), [value]);

  const onSortEnd = useCallback(
    ({ oldIndex, newIndex }) => {
      const newPlainArray = arrayMoveImmutable(items, oldIndex, newIndex);

      onChange(fromPlainArray(newPlainArray, newIndex > items.length));
    },
    [items]
  );

  const getDeleteItemHandler = (index: number) => {
    return () => {
      handleDeleteUser(index);
    };
  };

  const renderItem = (item: Item, index: number, dragHandleProps: DragHandleProps) => (
    <>
      {renderUser(item.data)}
      {!disabled && (
        <div className={styles.userButtons}>
          <Stack>
            <IconButton
              aria-label="Remove"
              className={styles.icon}
              name="trash-alt"
              onClick={getDeleteItemHandler(index)}
            />
            <IconButton
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              aria-label="Drag"
              className={cx('icon')}
              name="draggabledots"
            />
          </Stack>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.root}>
      <Stack direction="column">
        {!disabled && (
          <RemoteSelect
            key={items.length}
            showSearch
            placeholder="Add user"
            href={`/users/?permission=${UserActions.NotificationsRead.permission}&filters=true`}
            value={null}
            onChange={handleUserAdd}
            showError={showError}
            maxMenuHeight={150}
            requiredUserAction={UserActions.UserSettingsWrite}
          />
        )}
        <SortableList
          renderItem={renderItem}
          items={items}
          onSortEnd={onSortEnd}
          handleAddGroup={handleAddUserGroup}
          isMultipleGroups={isMultipleGroups}
          allowCreate={!disabled}
          disabled={disabled}
        />
      </Stack>
    </div>
  );
};

type DragHandleProps = Pick<ReturnType<typeof useSortable>, 'attributes' | 'listeners'>;

interface SortableItemProps {
  id: string;
  className?: string;
  disabled?: boolean;
  children: (dragHandleProps: DragHandleProps) => ReactNode;
}

const SortableItem = ({ id, className, disabled, children }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

  return (
    <li
      ref={setNodeRef}
      className={className}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: isDragging ? 'relative' : undefined,
        zIndex: isDragging ? 1062 : undefined,
      }}
    >
      {children({ attributes, listeners })}
    </li>
  );
};

interface SortableListProps {
  items: Item[];
  handleAddGroup: () => void;
  isMultipleGroups: boolean;
  renderItem: (item: Item, index: number, dragHandleProps: DragHandleProps) => React.ReactElement;
  onSortEnd: ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => void;
  allowCreate?: boolean;
  disabled?: boolean;
}

export const SortableList = ({
  items,
  handleAddGroup,
  isMultipleGroups,
  renderItem,
  onSortEnd,
  allowCreate,
  disabled,
}: SortableListProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const styles = useStyles2(getUserGroupStyles);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const sortableItems = items.filter((item) => item.type === 'item' || isMultipleGroups).map((item) => item.key);

  useEffect(() => {
    const container = listRef.current;
    if (!container) {
      return;
    }

    container.scroll({
      left: 0,
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [items]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.key === active.id);
    const newIndex = items.findIndex((item) => item.key === over.id);
    if (oldIndex >= 0 && newIndex >= 0) {
      onSortEnd({ oldIndex, newIndex });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        <ul className={styles.groups} ref={listRef}>
          {items.map((item, index) =>
            item.type === 'item' ? (
              <SortableItem key={item.key} id={item.key} className={styles.user} disabled={disabled}>
                {(dragHandleProps) => renderItem(item, index, dragHandleProps)}
              </SortableItem>
            ) : isMultipleGroups ? (
              <SortableItem key={item.key} id={item.key} className={styles.separator} disabled={disabled}>
                {() => <Text type="secondary">{item.data.name}</Text>}
              </SortableItem>
            ) : null
          )}
          {allowCreate && isMultipleGroups && items[items.length - 1]?.type === 'item' && (
            <li
              onClick={handleAddGroup}
              className={cx(styles.separator, { [bem(styles.separator, 'clickable')]: true })}
            >
              <Text type="primary">+ Add user group</Text>
            </li>
          )}
        </ul>
      </SortableContext>
    </DndContext>
  );
};
