import type { PointerEvent as ReactPointerEvent, Ref, WheelEvent as ReactWheelEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PortfolioWork } from '../data/portfolio.config';

type HorizontalRevolverProps = {
  allWorks: PortfolioWork[];
  availableWorks: PortfolioWork[];
  reelRef: Ref<HTMLDivElement>;
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
  onOpenWork,
  onClickWork,
  onPlaceByKeyboard,
}: HorizontalRevolverProps) {
  const rotationStep = allWorks.length > 0 ? 360 / allWorks.length : 0;

  const rotateWithWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    onRotate(rotation + delta * 0.28);
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
        aria-label="Horizontal work carousel. Drag left or right, or use the mouse wheel to rotate."
      >
        <div
          className="reel-axis"
          style={{ transform: 'translate(-50%, -50%)' }}
          aria-hidden="true"
        />
        {availableWorks.map((work, availableIndex) => {
          const originalIndex = allWorks.findIndex((entry) => entry.id === work.id);
          const angle = (availableIndex / availableWorks.length) * 360 + rotation;
          const radians = angle * Math.PI / 180;
          const z = Math.cos(radians) * 100;
          const x = Math.sin(radians) * 101;
          const scale = 0.73 + ((z + 100) / 200) * 0.3;
          const isFront = z > 20;

          return (
            <button
              key={work.id}
              data-work-card
              data-work-id={work.id}
              data-testid={`reel-frame-${work.id}`}
              className={`reel-card ${isFront ? 'is-front' : ''}`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: '50%',
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${Math.sin(radians) * 4}deg)`,
                zIndex: Math.round(z + 110),
                opacity: z < -75 ? 0.52 : 1,
              }}
              onPointerDown={(event) => onBeginWorkDrag(event, work)}
              onClick={() => onClickWork(work)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onOpenWork(work);
                }
                if (event.key === ' ') {
                  event.preventDefault();
                  onPlaceByKeyboard(work, originalIndex);
                }
              }}
              aria-label={`${work.title}. Drag to add to canvas, click or press Enter to inspect, press Space to place.`}
              title={`Drag ${work.title} to your wall`}
            >
              <img src={work.image} alt="" draggable={false} />
              <span className="reel-card-no mono">0{originalIndex + 1}</span>
            </button>
          );
        })}
        {availableWorks.length === 0 && (
          <div className="reel-empty" role="status">
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
          onClick={() => onRotate(rotation - rotationStep)}
          aria-label="Rotate reel left"
          data-testid="button-rotate-reel-left"
        >
          <ArrowLeft size={15} />
        </button>
        <span className="mono">DRAG LEFT / RIGHT · SCROLL</span>
        <button
          className="rotate-button"
          type="button"
          onClick={() => onRotate(rotation + rotationStep)}
          aria-label="Rotate reel right"
          data-testid="button-rotate-reel-right"
        >
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="reel-foot"><span className="mono">THE REEL TURNS ONLY WHEN YOU DO.</span></div>
    </div>
  );
}
