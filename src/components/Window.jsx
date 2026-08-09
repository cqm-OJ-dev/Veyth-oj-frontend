import React, { useRef, useState, useEffect } from 'react';
import './Window.css';

export default function Window({ id, title, zIndex, onFocus, onClose, children, minimized = false, maximized = false, onMinimize, onMaximize, initialPos = { x: 100, y: 100 }, initialSize = { w: 800, h: 500 } }) {
  const winRef = useRef(null);
  const [pos, setPos] = useState(initialPos);
  const [size, setSize] = useState(initialSize);
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleSnap = () => {
      if (!winRef.current || maximized) return;
      const rect = winRef.current.getBoundingClientRect();
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      if (pos.y <= 10) {
        if (onMaximize) onMaximize(id);
        return;
      }
      if (pos.x <= 10) {
        setPos({ x: 0, y: 0 });
        setSize({ w: Math.floor(screenW / 2) - 4, h: screenH - 80 });
        return;
      }
      if (pos.x + rect.width >= screenW - 10) {
        setPos({ x: Math.floor(screenW / 2) + 4, y: 0 });
        setSize({ w: Math.floor(screenW / 2) - 4, h: screenH - 80 });
        return;
      }
    };

    const onMove = (e) => {
      if (!dragging) return;
      setPos({ x: e.clientX - rel.x, y: e.clientY - rel.y });
    };
    const onUp = () => {
      if (dragging) {
        handleSnap();
      }
      setDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, rel, pos, maximized, onMaximize, id]);

  // resizing
  const [resizing, setResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);

  useEffect(() => {
    const onResizeMove = (e) => {
      if (!resizing || !resizeDir) return;
      const rect = winRef.current.getBoundingClientRect();
      let newW = size.w;
      let newH = size.h;
      let newX = pos.x;
      let newY = pos.y;
      if (resizeDir.includes('e')) {
        newW = Math.max(200, e.clientX - rect.left);
      }
      if (resizeDir.includes('s')) {
        newH = Math.max(120, e.clientY - rect.top);
      }
      if (resizeDir.includes('w')) {
        const diff = e.clientX - rect.left;
        newW = Math.max(200, rect.width - diff);
        newX = rect.left + diff;
      }
      if (resizeDir.includes('n')) {
        const diff = e.clientY - rect.top;
        newH = Math.max(120, rect.height - diff);
        newY = rect.top + diff;
      }
      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });
    };
    const onResizeUp = (e) => {
      if (resizing) setResizing(false);
      setResizeDir(null);
    };
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
    return () => {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
    };
  }, [resizing, resizeDir, pos, size]);

  const onMouseDown = (e) => {
    onFocus(id);
    if (e.target.classList.contains('win-title') || e.target.closest('.win-title')) {
      const rect = winRef.current.getBoundingClientRect();
      setRel({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setDragging(true);
    }
  };

  const handleMaximize = () => {
    if (onMaximize) onMaximize(id);
  };

  const handleMinimize = () => {
    if (onMinimize) onMinimize(id);
  };

  // When minimized we completely hide the window (no titlebar shown)
  if (minimized) return null;

  return (
    <div
      ref={winRef}
      className={`win-window ${maximized ? 'maximized' : ''}`}
      onMouseDown={onMouseDown}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex }}
    >
      <div className="win-title" onDoubleClick={handleMaximize}>
        <div className="win-title-text">{title}</div>
        <div className="win-controls">
          <button className="win-btn" onClick={(e) => { e.stopPropagation(); handleMinimize(); }}>&#8211;</button>
          <button className="win-btn" onClick={(e) => { e.stopPropagation(); handleMaximize(); }}>&#9723;</button>
          <button className="win-btn close" onClick={(e) => { e.stopPropagation(); onClose(id); }}>&times;</button>
        </div>
      </div>

      {!minimized && (
        <div className="win-content">
          {children}
        </div>
      )}
      <div className="win-resize-handle n" onMouseDown={(e)=>{ e.stopPropagation(); setResizeDir('n'); setResizing(true); }} />
      <div className="win-resize-handle e" onMouseDown={(e)=>{ e.stopPropagation(); setResizeDir('e'); setResizing(true); }} />
      <div className="win-resize-handle s" onMouseDown={(e)=>{ e.stopPropagation(); setResizeDir('s'); setResizing(true); }} />
      <div className="win-resize-handle w" onMouseDown={(e)=>{ e.stopPropagation(); setResizeDir('w'); setResizing(true); }} />
      <div className="win-resize-handle se" onMouseDown={(e)=>{ e.stopPropagation(); setResizeDir('se'); setResizing(true); }} />
      <div className="win-resize-handle ne" onMouseDown={(e)=>{ e.stopPropagation(); setResizeDir('ne'); setResizing(true); }} />
      <div className="win-resize-handle sw" onMouseDown={(e)=>{ e.stopPropagation(); setResizeDir('sw'); setResizing(true); }} />
      <div className="win-resize-handle nw" onMouseDown={(e)=>{ e.stopPropagation(); setResizeDir('nw'); setResizing(true); }} />
    </div>
  );
}
