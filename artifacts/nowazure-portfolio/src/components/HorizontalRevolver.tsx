import { useEffect, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, type RefObject } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PortfolioWork } from '../data/portfolio.config';

type HorizontalRevolverProps = {
  allWorks: PortfolioWork[];
  availableWorks: PortfolioWork[];
  reelRef: RefObject<HTMLDivElement | null>;
  rotation: number;
  onRotate: (rotation: number) => void;
  onBeginReelDrag: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onBeginWorkDrag: (event: ReactPointerEvent<HTMLButtonElement>, work: PortfolioWork) => void;
  onOpenWork: (work: PortfolioWork) => void;
  onClickWork: (work: PortfolioWork) => void;
  onPlaceByKeyboard: (work: PortfolioWork, index: number) => void;
};

export function HorizontalRevolver({
  allWorks,
  availableWorks,
  reelRef,
  rotation,
  onRotate,
  onBeginReelDrag,
  onBeginWorkDrag,
  onPlaceByKeyboard,
}: HorizontalRevolverProps) {
  const rotationStep = allWorks.length > 0 ? 360 / allWorks.length : 0;

  // Locks the native window scroll when hovering the revolver
  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const handleNativeWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [reelRef]);

  const rotateWithWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    onRotate(rotation + delta * 0.15); // Slightly slower for the flat wheel
  };

  return (
    <div className="reel-panel">
      <div className="reel-heading">
        <span className="section-label">THE REVOLVER</span>
        <span className="mono reel-count">
          {String(availableWorks.length).padStart(2, '0')} / {String(allWorks.length).padStart(2, '0')} FRAMES
        </span>
      </div>
      <p className="reel-instruction">Drag a frame onto your wall.<br />Turn the reel left or right to look around.</p>
      <div
        className="reel-control"
        ref={reelRef}
        onPointerDown={onBeginReelDrag}
        onWheel={rotateWithWheel}
        role="group"
      >
        <div
          className="reel-axis"
          style={{ 
            left: '85%', top: '50%', 
            width: '300px', height: '300px',
            transform: 'translate(-50%, -50%)',
            opacity: 0.15
          }}
          aria-hidden="true"
        />
        {availableWorks.map((work, availableIndex) => {
          const originalIndex = allWorks.findIndex((entry) => entry.id === work.id);
          
          // Add 180 degrees so the first item starts on the visible left side
          const angle = (availableIndex / availableWorks.length) * 360 + rotation + 180;
          const radians = (angle * Math.PI) / 180;
          
          // 2D Revolver Wheel Math
          const radius = 150; 
          const x = Math.cos(radians) * radius;
          const y = Math.sin(radians) * radius;
          
          // Fade the card out smoothly as it rotates behind the right edge
          const opacity = Math.max(0, 1 - (Math.cos(radians) * 1.5));
          const isBehind = Math.cos(radians) > 0.4;

          return (
            <button
              key={work.id}
              data-work-card
              data-work-id={work.id}
              className="reel-card"
              style={{
                left: `calc(85% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                // Tilts the card to match the curvature of the cylinder
                transform: `translate(-50%, -50%) rotate(${angle - 180}deg)`,
                zIndex: 100,
                opacity: Math.min(1, opacity),
                pointerEvents: isBehind ? 'none' : 'auto',
              }}
              onPointerDown={(event) => onBeginWorkDrag(event, work)}
              onKeyDown={(event) => {
                if (event.key === ' ') {
                  event.preventDefault();
                  onPlaceByKeyboard(work, originalIndex);
                }
              }}
              aria-label={`${work.title}. Drag to add to canvas.`}
            >
              <img src={work.image} alt="" draggable={false} />
              <span className="reel-card-no mono" style={{ transform: 'rotate(0deg)' }}>0{originalIndex + 1}</span>
            </button>
          );
        })}
        {availableWorks.length === 0 && (
          <div className="reel-empty">
            <span className="serif">Every frame is on your wall.</span>
            <span>Drag a placed frame back here or reset the canvas.</span>
          </div>
        )}
        <div className="reel-reticle" style={{ left: '85%', top: '50%' }} aria-hidden="true"><span /><span /></div>
      </div>
      <div className="reel-controls">
        <button
          className="rotate-button"
          type="button"
          onClick={() => onRotate(rotation - rotationStep)}
        >
          <ArrowLeft size={15} />
        </button>
        <span className="mono">DRAG / SCROLL</span>
        <button
          className="rotate-button"
          type="button"
          onClick={() => onRotate(rotation + rotationStep)}
        >
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="reel-foot"><span className="mono">THE REEL TURNS ONLY WHEN YOU DO.</span></div>
    </div>
  );
}
