import React, { cloneElement, ComponentType, ReactElement, useRef } from 'react';

import { CSSTransition as ReactCSSTransition, TransitionGroup as ReactTransitionGroup } from 'react-transition-group';
import type { CSSTransitionProps } from 'react-transition-group/CSSTransition';
import type { TransitionGroupProps } from 'react-transition-group/TransitionGroup';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type CompatibleCSSTransitionProps = DistributiveOmit<CSSTransitionProps<HTMLElement>, 'children' | 'nodeRef'> & {
  children: ReactElement;
};

const CompatibleReactCSSTransition = ReactCSSTransition as ComponentType<any>;
const CompatibleReactTransitionGroup = ReactTransitionGroup as ComponentType<any>;

export const CSSTransition = ({ children, ...props }: CompatibleCSSTransitionProps) => {
  const nodeRef = useRef<HTMLElement>(null);

  return (
    <CompatibleReactCSSTransition {...props} nodeRef={nodeRef}>
      {cloneElement(children, { ref: nodeRef } as React.Attributes)}
    </CompatibleReactCSSTransition>
  );
};

export const TransitionGroup = (props: TransitionGroupProps) => (
  <CompatibleReactTransitionGroup component="div" childFactory={(child) => child} {...props} />
);
