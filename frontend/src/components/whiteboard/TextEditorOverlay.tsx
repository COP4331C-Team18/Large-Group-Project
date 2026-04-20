import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';

type Props = {
  yElement: Y.Map<any> | null;
  worldToScreen: (wx: number, wy: number, vp: any) => { x: number; y: number };
  vp: { x: number; y: number; scale: number };
  onClose: () => void;
};

export default function TextEditorOverlay({ yElement, worldToScreen, vp, onClose }: Props) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!yElement) return;
    const ytext = yElement.get('content') as Y.Text;
    if (taRef.current) {
      taRef.current.value = ytext.toString();
      taRef.current.focus();
      taRef.current.select();
    }
  }, [yElement]);

  useEffect(() => {
    if (!yElement || !taRef.current) return;

    const syncSize = () => {
      const element = taRef.current;
      if (!element) return;
      const scale = Math.max(0.1, vp.scale);
      // Persist size in world units (not screen pixels) to avoid shrink/grow drift across zoom levels.
      const width = Math.max(180 / scale, Math.round(element.offsetWidth / scale));
      const height = Math.max(72 / scale, Math.round(element.offsetHeight / scale));
      const currentWidth = yElement.get('width') as number;
      const currentHeight = yElement.get('height') as number;
      const widthDiff = Math.abs(width - currentWidth);
      const heightDiff = Math.abs(height - currentHeight);
      // Ignore tiny resize noise from browser/layout jitter.
      if (widthDiff < 1 && heightDiff < 1) return;

      yElement.doc?.transact(() => {
        yElement.set('width', width);
        yElement.set('height', height);
      });
    };

    syncSize();

    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = new ResizeObserver(() => syncSize());
    resizeObserverRef.current.observe(taRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [yElement, vp.scale]);

  if (!yElement) return null;

  const x = yElement.get('x') as number;
  const y = yElement.get('y') as number;
  const width = yElement.get('width') as number;
  const height = yElement.get('height') as number;
  const fontSize = yElement.get('fontSize') as number;
  const color = (yElement.get('color') as string) || '#111410';
  const opacity = Math.min(1, Math.max(0, (yElement.get('opacity') as number) ?? 1));
  const rgbHex = color.replace('#', '').trim();
  const expanded = rgbHex.length === 3 ? rgbHex.split('').map((ch) => ch + ch).join('') : rgbHex;
  const parsed = Number.parseInt(expanded.padEnd(6, '0').slice(0, 6), 16);
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.62 ? '#111410' : '#FFFFFF';

  const screen = worldToScreen(x, y, vp);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ytext = yElement.get('content') as Y.Text;
    const value = e.target.value;
    ytext.doc?.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, value);
    });
  };

  const handleBlur = () => onClose();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <textarea
      ref={taRef}
      placeholder="Type here..."
      wrap="soft"
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
      style={{
        position: 'absolute',
        left: Math.round(screen.x),
        top: Math.round(screen.y),
        width: Math.round(width * vp.scale),
        height: Math.round(height * vp.scale),
        minWidth: 180,
        minHeight: 72,
        fontSize: Math.max(12, fontSize * vp.scale),
        fontFamily: 'sans-serif',
        padding: 6,
        border: `2px solid ${color}`,
        borderRadius: 8,
        boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
        background: `rgba(${r}, ${g}, ${b}, ${opacity})`,
        color: textColor,
        zIndex: 9999,
        resize: 'both',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        outline: 'none',
      }}
    />
  );
}
