import { createContext, useContext } from 'react';

import { useSortable } from '@dnd-kit/sortable';

export type SortableItemContextValue = Pick<
  ReturnType<typeof useSortable>,
  'attributes' | 'listeners' | 'setNodeRef'
> & {
  style: React.CSSProperties;
};

export const SortableItemContext = createContext<SortableItemContextValue | null>(null);

export const useSortableItemContext = () => useContext(SortableItemContext);
