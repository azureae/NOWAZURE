import { useEffect, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, type RefObject } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
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
  
  // The radius of our "Ferris wheel". 
  // 300px creates a gentle curve as the cards travel top to bottom.
  const radius = 300; 

  // Locks native window scrolling when hovering the revolver
  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const handleNativeWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [reelRef]);

  const rotateWithWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    // Spinning the mouse wheel now moves the rotation angle directly
    onRotate(rotation + delta * 0.15); 
  };

  return (
    <div className="reel-panel">
      <div className="reel-heading">
        <span className="section-label">THE REVOLVER</span>
        <span className="mono reel-count">
          {String(availableWorks.length).padStart(2, '0')} / {String(allWorks.length).padStart(2, '0')} FRAMES
        </span>
      </div>
      <p className="reel-instruction">Drag a frame onto your wall.<br />Scroll or drag up/down to browse.</p>
      <div
        className="reel-control"
        ref={reelRef}
        onPointerDown={onBeginReelDrag}
        onWheel={rotateWithWheel}
        role="group"
        style={{
          overflow: 'hidden',
          // The gradient dropshadows from your Paint.net reference
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        <div className="reel-axis" style={{ display: 'none' }} aria-hidden="true" />
        
        {availableWorks.map((work, availableIndex) => {
          const originalIndex = allWorks.findIndex((entry) => entry.id === work.id);
          
          // 180 degrees places the 0th item on the far-left edge of the circle
          const angle = (availableIndex / availableWorks.length) * 360 + rotation + 180;
          const radians = (angle * Math.PI) / 180;
          
          const x = Math.cos(radians) * radius;
          const y = Math.sin(radians) * radius;
          
          // Hides the cards completely when they travel down the right side of the wheel
          const isRightSide = Math.cos(radians) > 0;

          return (
            <button
              key={work.id}
              data-work-card
              data-work-id={work.id}
              className="reel-card"
              style={{
                // Anchor the center of the wheel far to the right (50% + 300px)
                left: `calc(50% + ${radius}px + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                // The cards translate but do NOT rotate, keeping them horizontal
                transform: `translate(-50%, -50%)`,
                zIndex: 100,
                opacity: isRightSide ? 0 : 1,
                pointerEvents: isRightSide ? 'none' : 'auto',
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
              <span className="reel-card-no mono">0{originalIndex + 1}</span>
            </button>
          );
        })}
        {availableWorks.length === 0 && (
          <div className="reel-empty">
            <span className="serif">Every frame is on your wall.</span>
            <span>Drag a placed frame back here or reset the canvas.</span>
          </div>
        )}
        <div className="reel-reticle" aria-hidden="true"><span /><span /></div>
      </div>
      <div className="reel-controls">
        <button className="rotate-button" type="button" onClick={() => onRotate(rotation + rotationStep)}>
          <ArrowDown size={15} />
        </button>
        <span className="mono">DRAG / SCROLL</span>
        <button className="rotate-button" type="button" onClick={() => onRotate(rotation - rotationStep)}>
          <ArrowUp size={15} />
        </button>
      </div>
      <div className="reel-foot"><span className="mono">THE REEL TURNS ONLY WHEN YOU DO.</span></div>
    </div>
  );
}
