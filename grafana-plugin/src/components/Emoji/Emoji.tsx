import React from 'react';

import emojiData from 'emojilib/emojis.json';

interface EmojiProps {
  text: string;
  className?: string;
}

const emojify = (text: string) =>
  text.replace(/:[\w\-+]+:/g, (alias) => emojiData[alias.slice(1, -1)]?.char ?? alias);

export const Emoji = ({ text, className }: EmojiProps) => <span className={className}>{emojify(text)}</span>;

export default Emoji;
