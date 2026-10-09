import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, type RefObject } from 'react';
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
  const itemSpacing = 240; 
  const trackHeight = Math.max(allWorks.length * itemSpacing, 1000);

  // Smooth momentum state tracking
  const targetRotationRef = useRef(rotation);
  const currentRotationRef = useRef(rotation);
  targetRotationRef.current = rotation;

  // Smooth animation loop (Lerp / Dampening)
  useEffect(() => {
    let animationFrameId: number;

    const smoothScrollLoop = () => {
      const diff = targetRotationRef.current - currentRotationRef.current;
      if (Math.abs(diff) > 0.01) {
        currentRotationRef.current += diff * 0.12; // 0.12 controls the glide speed/smoothness
        onRotate(currentRotationRef.current);
      }
      animationFrameId = requestAnimationFrame(smoothScrollLoop);
    };

    animationFrameId = requestAnimationFrame(smoothScrollLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [onRotate]);

  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const handleNativeWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [reelRef]);

  const rotateWithWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    // Push into the target rotation ref instead of snapping instantly
    targetRotationRef.current += delta * 0.7;
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
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        <div className="reel-axis" style={{ display: 'none' }} aria-hidden="true" />
        
        {availableWorks.map((work) => {
          const originalIndex = allWorks.findIndex((entry) => entry.id === work.id);
          
          let offset = ((originalIndex * itemSpacing) + rotation) % trackHeight;
          if (offset < -trackHeight / 2) offset += trackHeight;
          if (offset > trackHeight / 2) offset -= trackHeight;

          const distance = Math.abs(offset);
          const xShift = Math.pow(distance / 200, 2) * 50;
          const scale = Math.max(0.4, 1 - (distance * 0.0012));
          const zIndex = 1000 - Math.round(distance);
          const opacity = Math.max(0, 1 - (distance / 700));

          return (
            <button
              key={work.id}
              data-work-card
              data-work-id={work.id}
              className="reel-card"
              style={{
                left: `calc(50% + ${xShift}px)`,
                top: `calc(50% + ${offset}px)`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex,
                opacity,
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
      </div>
      <div className="reel-controls">
        <button className="rotate-button" type="button" onClick={() => { targetRotationRef.current += itemSpacing; }}>
          <ArrowDown size={15} />
        </button>
        <span className="mono">DRAG / SCROLL</span>
        <button className="rotate-button" type="button" onClick={() => { targetRotationRef.current -= itemSpacing; }}>
          <ArrowUp size={15} />
        </button>
      </div>
      <div className="reel-foot"><span className="mono">THE REEL TURNS ONLY WHEN YOU DO.</span></div>
    </div>
  );
}
