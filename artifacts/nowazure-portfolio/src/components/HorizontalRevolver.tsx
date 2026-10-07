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
  // Constant pixel distance between cards
  const itemSpacing = 175; 
  // Ensure the invisible track is tall enough so cards can teleport seamlessly off-screen
  const trackHeight = Math.max(availableWorks.length * itemSpacing, 1000); 

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
    onRotate(rotation - delta * 0.4); 
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
          // This applies the exact top/bottom dropshadow gradients from your paint.net mockup
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        <div
          className="reel-axis"
          style={{ transform: 'translate(-50%, -50%)', opacity: 0.05, height: '80%' }}
          aria-hidden="true"
        />
        {availableWorks.map((work, availableIndex) => {
          const originalIndex = allWorks.findIndex((entry) => entry.id === work.id);
          
          // Continuous looping vertical math
          let offset = ((availableIndex * itemSpacing) + rotation) % trackHeight;
          if (offset < 0) offset += trackHeight;
          if (offset > trackHeight / 2) offset -= trackHeight;

          return (
            <button
              key={work.id}
              data-work-card
              data-work-id={work.id}
              className="reel-card"
              style={{
                left: '50%',
                top: `calc(50% + ${offset}px)`,
                transform: `translate(-50%, -50%)`,
                zIndex: 100,
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
        <button
          className="rotate-button"
          type="button"
          onClick={() => onRotate(rotation + itemSpacing)}
        >
          <ArrowDown size={15} />
        </button>
        <span className="mono">DRAG / SCROLL</span>
        <button
          className="rotate-button"
          type="button"
          onClick={() => onRotate(rotation - itemSpacing)}
        >
          <ArrowUp size={15} />
        </button>
      </div>
      <div className="reel-foot"><span className="mono">THE REEL TURNS ONLY WHEN YOU DO.</span></div>
    </div>
  );
}
