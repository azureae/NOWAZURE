import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronDown, Circle, MoveUpRight, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { portfolioServices, portfolioWorks, type PortfolioWork } from './data/portfolio.config';
import { homepageSlideshow } from './data/homepage-slideshow.config';
import { HorizontalRevolver } from './components/HorizontalRevolver';

// === COLLABORATIONS DATA ===
// You can use direct paths like '/images/my-logo.png' if they are in the public/images folder
const collaborationsData = [
  { id: 'c1', name: 'Λstray', image: '/images/astraylogo.png', fallback: 'AS', description: 'Roblox UGC Community well-known for their high-quality yet affordable tactical gear. A lot of the products you see here have been made for them.', link: 'https://www.roblox.com/communities/10792969/stray' },
  { id: 'c2', name: 'Indonesia', image: '/images/indonesialogo.png', fallback: 'IN', description: 'Indonesian Ro-Nation community built by @kohrenhund, a good friend of mine.', link: 'https://www.roblox.com/communities/14319584/Indonesia' },
  { id: 'c3', name: 'Miyake Clan', image: '/images/saitologo.png', fallback: 'MC', description: 'Samurai clan based in the Sengoku Jidai community, currently defunct, but some of the products showcased here are made for them.', link: 'https://www.roblox.com/communities/718216474/Miyak-Clan' },
  { id: 'c4', name: 'HINOWA', image: '/images/hinowalogo.png', fallback: 'HN', description: 'Roblox community branded as a family. This is where I hail from, but they help me make some quick cash sometimes.', link: 'http://roblox.com/communities/14215769/Hinowa' },
];

type PlacedWork = { id: string; workId: string; x: number; y: number; tilt: number; layer: number };
type ReturnFlight = { id: string; workId: string; fromX: number; fromY: number; toX: number; toY: number; width: number; delay: number };
type ActiveGesture =
  | { kind: 'reel'; x: number; y: number; rotation: number }
  | { kind: 'pending-card'; id: string; workId: string; startX: number; startY: number; rotation: number }
  | { kind: 'gallery-item'; id: string; workId: string; x: number; y: number }
  | { kind: 'canvas-item'; id: string; workId: string; x: number; y: number; originX: number; originY: number };

const nav = [
  { label: 'HOME', href: '#home' },
  { label: 'ABOUT ME', href: '#about' },
  { label: 'MY WORKS', href: '#works' },
  { label: 'CONTACT ME', href: '#contact' },
];

function App() {
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const imageViewerStageRef = useRef<HTMLDivElement>(null);
  const imageTriggerRef = useRef<HTMLButtonElement>(null);
  const gestureRef = useRef<ActiveGesture | null>(null);
  const imagePanGestureRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const rotationRef = useRef(0);
  const lastGalleryDragRef = useRef(0);
  
  const [sceneIndex, setSceneIndex] = useState(0);
  const [wipe, setWipe] = useState(false);
  const [rotation, setRotation] = useState(0);
  rotationRef.current = rotation;
  const [placed, setPlaced] = useState<PlacedWork[]>([]);
  const placedRef = useRef<PlacedWork[]>([]);
  placedRef.current = placed;
  const [returnFlights, setReturnFlights] = useState<ReturnFlight[]>([]);
  const [selected, setSelected] = useState<PortfolioWork | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [topLayer, setTopLayer] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragGhost, setDragGhost] = useState<{ workId: string; x: number; y: number } | null>(null);
  const [openService, setOpenService] = useState<string | null>(null);
  const [openCollab, setOpenCollab] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const logoY = useTransform(scrollYProgress, [0, 0.8], [0, reducedMotion ? 0 : 370]);
  const logoRotate = useTransform(scrollYProgress, [0, 0.8], [0, reducedMotion ? 0 : 9]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.34, 0.8], [1, 0.75, 0]);
  const curtainScale = useTransform(scrollYProgress, [0.02, 0.78], [0.04, 1]);
  const curtainOpacity = useTransform(scrollYProgress, [0.08, 0.45], [0.25, 1]);
  const activeScene = homepageSlideshow.scenes[sceneIndex];
  const availableWorks = portfolioWorks.filter((work) => !placed.some((item) => item.workId === work.id));

  const reelSlotCenter = (workId: string) => {
    const controlBounds = reelRef.current?.getBoundingClientRect();
    const index = portfolioWorks.findIndex((work) => work.id === workId);
    if (!controlBounds || index < 0) return null;
    
    const itemSpacing = 240;
    const trackHeight = Math.max(portfolioWorks.length * itemSpacing, 1000);
    let offset = ((index * itemSpacing) + rotationRef.current) % trackHeight;
    if (offset < -trackHeight / 2) offset += trackHeight;
    if (offset > trackHeight / 2) offset -= trackHeight;

    const distance = Math.abs(offset);
    const xShift = Math.pow(distance / 200, 2) * 50;
    const baseX = controlBounds.left + (controlBounds.width * 0.50); // Matches the new 50% center

    return {
      x: baseX + xShift,
      y: controlBounds.top + (controlBounds.height / 2) + offset,
    };
  };

  const updateImageZoom = (nextZoom: number) => {
    const zoom = Math.max(0.5, Math.min(3, Math.round(nextZoom * 100) / 100));
    setImageZoom(zoom);
    if (zoom <= 1) {
      setImagePan({ x: 0, y: 0 });
      imagePanGestureRef.current = null;
    }
  };

  const openImageViewer = () => {
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
    imagePanGestureRef.current = null;
    window.requestAnimationFrame(() => imageTriggerRef.current?.focus());
  };

  const zoomImageWithWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateImageZoom(imageZoom + (event.deltaY < 0 ? 0.12 : -0.12));
  };

  const beginImagePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (imageZoom <= 1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    imagePanGestureRef.current = { x: event.clientX, y: event.clientY, originX: imagePan.x, originY: imagePan.y };
  };

  const moveImagePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = imagePanGestureRef.current;
    if (!gesture) return;
    setImagePan({ x: gesture.originX + event.clientX - gesture.x, y: gesture.originY + event.clientY - gesture.y });
  };

  const endImagePan = () => { imagePanGestureRef.current = null; };

  const sendWorksBack = (items: PlacedWork[], stagger = 0.05) => {
    const collage = collageRef.current;
    const collageBounds = collage?.getBoundingClientRect();
    if (!collage || !collageBounds) return;
    const placedElements = Array.from(collage.querySelectorAll<HTMLElement>('[data-placed-id]'));
    const flights = items.flatMap((item, index) => {
      const element = placedElements.find((candidate) => candidate.dataset.placedId === item.id);
      const bounds = element?.getBoundingClientRect();
      const target = reelSlotCenter(item.workId);
      if (!target) return [];
      const fromX = bounds ? bounds.left + bounds.width / 2 : collageBounds.left + (item.x / 100) * collageBounds.width;
      const fromY = bounds ? bounds.top + bounds.height / 2 : collageBounds.top + (item.y / 100) * collageBounds.height;
      return [{
        id: item.id, workId: item.workId, fromX, fromY, toX: target.x, toY: target.y,
        width: bounds?.width ?? 150, delay: reducedMotion ? 0 : index * stagger,
      }];
    });
    setReturnFlights((current) => [...current, ...flights]);
  };

  const returnAll = () => {
    if (placed.length === 0) return;
    sendWorksBack(placed);
    setPlaced([]);
  };

  useEffect(() => {
    if (reducedMotion || homepageSlideshow.scenes.length < 2) return;
    const timer = window.setInterval(() => {
      setWipe(true);
      window.setTimeout(() => setSceneIndex((index) => (index + 1) % homepageSlideshow.scenes.length), homepageSlideshow.wipeMs * 0.48);
      window.setTimeout(() => setWipe(false), homepageSlideshow.wipeMs);
    }, homepageSlideshow.intervalMs);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (!imageViewerOpen) return;
    const stage = imageViewerStageRef.current;
    if (!stage) return;
    const preventBackgroundScroll = (event: WheelEvent) => event.preventDefault();
    stage.addEventListener('wheel', preventBackgroundScroll, { passive: false });
    return () => stage.removeEventListener('wheel', preventBackgroundScroll);
  }, [imageViewerOpen]);

  useEffect(() => {
    if (!imageViewerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [imageViewerOpen]);

  useEffect(() => {
    if (!imageViewerOpen) return;
    const handleViewerKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeImageViewer(); } 
      else if (event.key === '+' || event.key === '=') { event.preventDefault(); updateImageZoom(imageZoom + 0.25); } 
      else if (event.key === '-') { event.preventDefault(); updateImageZoom(imageZoom - 0.25); }
    };
    window.addEventListener('keydown', handleViewerKeys);
    return () => window.removeEventListener('keydown', handleViewerKeys);
  }, [imageViewerOpen, imageZoom]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;

      if (gesture.kind === 'pending-card') {
        const dx = event.clientX - gesture.startX;
        const dy = event.clientY - gesture.startY;
        if (dx < -20) {
          gestureRef.current = { kind: 'gallery-item', id: gesture.id, workId: gesture.workId, x: event.clientX, y: event.clientY };
          setDragGhost({ workId: gesture.workId, x: event.clientX, y: event.clientY });
        } else if (Math.abs(dy) > 10 || dx > 20) {
          gestureRef.current = { kind: 'reel', x: gesture.startX, y: gesture.startY, rotation: gesture.rotation };
        }
      } else if (gesture.kind === 'reel') {
        setRotation(gesture.rotation - (event.clientY - gesture.y) * 1.5);
      } else if (gesture.kind === 'gallery-item') {
        setDragGhost({ workId: gesture.workId, x: event.clientX, y: event.clientY });
      } else if (gesture.kind === 'canvas-item') {
        setPlaced((items) =>
          items.map((item) =>
            item.id === gesture.id
              ? {
                  ...item,
                  x: Math.max(7, Math.min(93, gesture.originX + ((event.clientX - gesture.x) / (collageRef.current?.clientWidth || 1)) * 100)),
                  y: Math.max(12, Math.min(88, gesture.originY + ((event.clientY - gesture.y) / (collageRef.current?.clientHeight || 1)) * 100)),
                }
              : item,
          ),
        );
      }
    };
    const up = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      if (gesture.kind === 'gallery-item' && collageRef.current) {
        if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 7) lastGalleryDragRef.current = Date.now();
        const box = collageRef.current.getBoundingClientRect();
        if (event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) {
          const bounds = collageRef.current.getBoundingClientRect();
          setTopLayer((layer) => layer + 1);
          setPlaced((items) => [...items, {
            id: gesture.id, workId: gesture.workId,
            x: Math.max(7, Math.min(93, ((event.clientX - bounds.left) / bounds.width) * 100)),
            y: Math.max(12, Math.min(88, ((event.clientY - bounds.top) / bounds.height) * 100)),
            tilt: [-5, 3, 6, -2, 4][items.length % 5], layer: topLayer + 1,
          }]);
        }
      } else if (gesture.kind === 'canvas-item' && reelRef.current) {
        const bounds = reelRef.current.getBoundingClientRect();
        const overReel = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
        if (overReel) {
          const item = placedRef.current.find((value) => value.id === gesture.id);
          if (item) {
            sendWorksBack([item], 0);
            setPlaced((items) => items.filter((value) => value.id !== item.id));
          }
        }
      }
      if (gesture.kind === 'gallery-item') setDragGhost(null);
      gestureRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [topLayer]);

  const beginReelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-work-card]')) return;
    gestureRef.current = { kind: 'reel', x: event.clientX, y: event.clientY, rotation };
  };

  const beginWorkDrag = (event: ReactPointerEvent<HTMLButtonElement>, work: PortfolioWork) => {
    gestureRef.current = { kind: 'pending-card', id: `${work.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, workId: work.id, startX: event.clientX, startY: event.clientY, rotation };
  };

  const beginCanvasDrag = (event: ReactPointerEvent<HTMLButtonElement>, item: PlacedWork) => {
    if ((event.target as HTMLElement).closest('.inspect-hit')) return;
    const bounds = collageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setTopLayer((layer) => layer + 1);
    setPlaced((items) => items.map((value) => value.id === item.id ? { ...value, layer: topLayer + 1 } : value));
    gestureRef.current = { kind: 'canvas-item', id: item.id, workId: item.workId, x: event.clientX, y: event.clientY, originX: item.x, originY: item.y };
  };

  const addByKeyboard = (work: PortfolioWork, index: number) => {
    if (placedRef.current.some((item) => item.workId === work.id)) return;
    setTopLayer((layer) => layer + 1);
    setPlaced((items) => [
      ...items,
      { id: `${work.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, workId: work.id, x: 23 + (index % 3) * 23, y: 34 + Math.floor(index / 3) * 27, tilt: [-5, 3, 6, -2, 4][items.length % 5], layer: topLayer + 1 },
    ]);
  };

  return (
    <main className="grain">
      <header className="topbar">
        <a className="mini-mark" href="#home" aria-label="Nowazure home">n<span>.</span></a>
        <nav className={`topnav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          {nav.map((item, index) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              <span className="nav-index">0{index + 1}</span>{item.label}
            </a>
          ))}
        </nav>
        <button className="menu-toggle mono" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation">
          {menuOpen ? 'CLOSE' : 'MENU'} <span>{menuOpen ? '−' : '+'}</span>
        </button>
      </header>
      <section id="home" className="hero" ref={heroRef} aria-label="Nowazure portfolio introduction">
        <div className="hero-backdrop" key={activeScene.id} style={{ backgroundImage: `url("${activeScene.image}")` }} />
        <div className="hero-vignette" />
        <div className="hero-scene-meta mono"><Circle size={7} fill="currentColor" /> FEATURED STUDY <span>{String(sceneIndex + 1).padStart(2, '0')} / {String(homepageSlideshow.scenes.length).padStart(2, '0')}</span></div>
        <div className={`red-wipe ${wipe ? 'wipe-active' : ''}`} style={{ animationDuration: `${homepageSlideshow.wipeMs}ms` }} aria-hidden="true" />
        <div className="hero-side-note mono">ROBLOX STUDIO <i /> CINEMATIC WORLDS</div>
        <div className="hero-copy">
          <motion.div className="hero-brand" style={{ y: logoY, rotate: logoRotate, opacity: logoOpacity }}>
            <p className="hero-est mono">INDEPENDENT VIGNETTE ARTIST <span>— EST. 2019</span></p>
            <h1 className="serif">nowazure<span className="brand-dot">.</span></h1>
          </motion.div>
          <motion.div className="hero-statement" style={{ opacity: logoOpacity }}>
            <span className="statement-line" />
            <p>Oculos ad astra, pedes in terra.</p>
          </motion.div>
          <a className="hero-cta mono" href="#works">STEP INTO THE WORK <ArrowDownRight size={15} /></a>
        </div>
        <div className="hero-bottom">
          <span className="mono">SCENES, NOT SCREENSHOTS.</span>
          <span className="hero-scroll mono"><ArrowDown size={13} /> SCROLL TO EXPLORE</span>
          <span className="mono">01 — 05</span>
        </div>
        <motion.div className="hero-curtain" style={{ scaleY: curtainScale, opacity: curtainOpacity }} />
        <div className="scene-caption"><span className="mono">NOW SHOWING</span><b>{activeScene.title}</b></div>
      </section>

      <section className="intro-strip">
        <div className="intro-number mono">01 <span> / THE PRACTICE</span></div>
        <p className="intro-copy serif">I make places feel like <em>something just happened</em> — or is about to.</p>
        <p className="intro-aside">Cinematic scenes and visual identities for Roblox worlds with a story to tell.</p>
      </section>

      <section id="about" className="about-section section-shell">
        <div className="section-head">
          <span className="section-label">A LITTLE ABOUT THE WORK</span>
          <span className="mono section-count">02 / 04</span>
        </div>
        <div className="about-grid">
          <h2 className="serif">Who am I,<br /><em>and what do I do?</em></h2>
          <div className="about-prose">
            <p>I’m nowazure, a Philippines-based Roblox vignette artist drawn to the moments between the action. I build cinematic scenes, thumbnails, logos, and visual identities that give a game its own atmosphere.</p>
            <p>Before I start working, I always find myself asking: If I was in that moment, how would I capture it? The answer becomes the mood and the story. Afterwards, you make attempts at imitating life just like how you'd see it in your own eyes.</p>
            <div className="tool-list"><span className="section-label">IN THE TOOLKIT</span><div><span>Roblox Studio</span><i /> <span>Blender</span><i /> <span>Paint.NET</span></div></div>
          </div>
        </div>
        <div className="about-foot"><span className="mono">SCENE BUILDER / IMAGE MAKER</span><span className="mono">AVAILABLE FOR SELECT PROJECTS <b>●</b></span></div>
      </section>


      <section id="works" className="works-section">
        <div className="works-heading section-shell">
          <div><span className="section-label">03 / THE COLLECTION</span><h2 className="serif">Make a little <em>room.</em></h2></div>
          <div className="works-heading-actions">
            <p>Pull a frame from the reel.<br />Place it where it belongs.</p>
            <button
              className="return-all"
              type="button"
              onClick={returnAll}
              disabled={placed.length === 0}
              aria-label="Reset canvas and return all frames to the Revolver"
              title="Return every frame to the Revolver"
              data-testid="button-return-all"
            >
              <RotateCcw size={13} aria-hidden="true" /> RESET CANVAS <span>{String(placed.length).padStart(2, '0')}</span>
            </button>
          </div>
        </div>
        <div className="gallery-layout">
          <div className="collage-area" ref={collageRef} aria-label="Free collage canvas">
            <div className="canvas-topline"><span className="mono">YOUR WALL</span><span className="canvas-tip">Arrange frames here · drop one on the reel to return it.</span></div>
            <div className="canvas-crosshair crosshair-one" /><div className="canvas-crosshair crosshair-two" />
            {placed.length === 0 && <div className="canvas-empty"><span className="empty-star" aria-hidden="true" /><span className="serif">A scene takes shape<br />one frame at a time.</span><span className="mono">DRAG FROM THE REEL <ArrowRight size={12} /></span></div>}
            {placed.map((item) => {
              const work = portfolioWorks.find((entry) => entry.id === item.workId);
              if (!work) return null;
              return <motion.button
                key={item.id}
                className="placed-frame"
                data-placed-id={item.id}
                data-testid={`placed-frame-${item.workId}`}
                style={{ left: `${item.x}%`, top: `${item.y}%`, zIndex: item.layer, x: '-50%', y: '-50%', rotate: item.tilt }}
                onPointerDown={(event) => beginCanvasDrag(event, item)}
                onKeyDown={(event) => {
                  const delta = event.shiftKey ? 6 : 2;
                  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
                  if (event.key === 'ArrowLeft') setPlaced((items) => items.map((value) => value.id === item.id ? { ...value, x: Math.max(7, value.x - delta) } : value));
                  if (event.key === 'ArrowRight') setPlaced((items) => items.map((value) => value.id === item.id ? { ...value, x: Math.min(93, value.x + delta) } : value));
                  if (event.key === 'ArrowUp') setPlaced((items) => items.map((value) => value.id === item.id ? { ...value, y: Math.max(12, value.y - delta) } : value));
                  if (event.key === 'ArrowDown') setPlaced((items) => items.map((value) => value.id === item.id ? { ...value, y: Math.min(88, value.y + delta) } : value));
                }}
                aria-label={`${work.title} on collage. Use arrow keys to move, Enter to inspect.`}
                onClick={() => setSelected(work)}
                onDoubleClick={() => setSelected(work)}
              >
                <img src={work.image} alt={work.title} draggable={false} />
                <span className="frame-caption mono"><span>{work.title}</span><span className="inspect-hit">↗</span></span>
              </motion.button>;
            })}
            <div className="canvas-coordinate mono" role="status" aria-live="polite">N° {String(placed.length).padStart(2, '0')} / WALL</div>
          </div>
          <HorizontalRevolver
            allWorks={portfolioWorks}
            availableWorks={availableWorks}
            reelRef={reelRef}
            rotation={rotation}
            onRotate={setRotation}
            onBeginReelDrag={beginReelDrag}
            onBeginWorkDrag={beginWorkDrag}
            onOpenWork={setSelected}
            onClickWork={(work) => {
              if (Date.now() - lastGalleryDragRef.current > 250) setSelected(work);
            }}
            onPlaceByKeyboard={addByKeyboard}
          />
        </div>
      </section>

      <section className="offer-section">
        <div className="offer-inner">
          <div className="offer-label section-label">WHAT I CAN MAKE WITH YOU</div>
          <div className="offer-list">
            {portfolioServices.map((service, index) => {
              const expanded = openService === service.id;
              const triggerId = `service-trigger-${service.id}`;
              const panelId = `service-panel-${service.id}`;
              return <div className="offer-row" key={service.id}>
                <h3 className="offer-row-heading">
                  <button
                    id={triggerId}
                    className="offer-toggle"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setOpenService(expanded ? null : service.id)}
                    data-testid={`service-accordion-${service.id}`}
                  >
                    <span className="mono">{String(index + 1).padStart(2, '0')}</span>
                    <span className="serif offer-title">{service.title}</span>
                    <ChevronDown size={17} aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={panelId}
                  className={`offer-details ${expanded ? 'is-open' : ''}`}
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!expanded}
                >
                  <div className="offer-details-inner"><p>{service.description}</p></div>
                </div>
              </div>;
            })}
          </div>
        </div>
      </section>

      {/* === COLLABORATIONS SECTION === */}
      <section id="collaborations" className="collab-section section-shell">
        <div className="section-head">
          <span className="section-label">PARTNERSHIPS</span>
          <span className="mono section-count">03.5 / 04</span>
        </div>
        <div className="collab-header">
          <h2 className="serif">Collaborations</h2>
          <p>Welcome to the collaboration page. This is where I put all of the groups, companies, and projects I’ve collaborated with in terms of vignettes and commissions.</p>
        </div>
        <div className="collab-grid">
          {collaborationsData.map((collab) => {
            const isOpen = openCollab === collab.id;
            return (
              <div key={collab.id} className={`collab-card ${isOpen ? 'is-open' : ''}`}>
                <button className="collab-trigger" onClick={() => setOpenCollab(isOpen ? null : collab.id)}>
                  <div className="collab-logo">
                    {collab.image ? (
                      <img src={collab.image} alt={collab.name} draggable={false} />
                    ) : (
                      <span className="mono">{collab.fallback}</span>
                    )}
                  </div>
                  <span className="collab-name serif">{collab.name}</span>
                </button>
                <div className="collab-details">
                  <div className="collab-details-inner">
                    <p>{collab.description}</p>
                    <a href={collab.link} target="_blank" rel="noreferrer" className="mono">VISIT PROJECT <ArrowUpRight size={10} /></a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="contact" className="contact-section section-shell">
        <div className="section-head"><span className="section-label">04 / MAKE SOMETHING</span><span className="mono section-count">COMMISSIONS OPEN <b>●</b></span></div>
        <div className="contact-main">
          <h2 className="serif">Have a world<br />in <em>mind?</em></h2>
          <div className="contact-action"><p>Tell me what you’re building.<br />Let’s find its light.</p><a href="https://discord.com/users/433610512962420756" target="_blank" rel="noreferrer" className="contact-link">Message me on Discord <MoveUpRight size={16} /></a><div className="contact-socials mono"><a href="https://www.roblox.com/users/98237807/profile" target="_blank" rel="noreferrer">ROBLOX <ArrowUpRight size={11} /></a><a href="https://ko-fi.com/azureae" target="_blank" rel="noreferrer">KO-FI <ArrowUpRight size={11} /></a></div></div>
        </div>
        <footer className="footer"><a className="footer-mark serif" href="#home">nowazure<span>.</span></a><span className="mono">ROBLOX STUDIO · BLENDER · PHOTOSHOP</span><a className="back-top mono" href="#home">BACK TO THE LIGHT ↑</a><span className="mono footer-year">© NOWAZURE</span></footer>
      </section>

      {selected && (imageViewerOpen ? (
        <div className="image-viewer" role="dialog" aria-modal="true" aria-label={`Image-only view of ${selected.title}`}>
          <button className="image-viewer-close" type="button" onClick={closeImageViewer} aria-label="Close image view" autoFocus>
            <X size={20} />
          </button>
          <div
            className={`image-viewer-stage ${imageZoom > 1 ? 'is-zoomed' : ''}`}
            ref={imageViewerStageRef}
            onPointerDown={beginImagePan}
            onPointerMove={moveImagePan}
            onPointerUp={endImagePan}
            onPointerCancel={endImagePan}
            onWheel={zoomImageWithWheel}
          >
            <img
              src={selected.image}
              alt={selected.title}
              draggable={false}
              style={{ transform: `translate3d(${imagePan.x}px, ${imagePan.y}px, 0) scale(${imageZoom})` }}
            />
          </div>
          <div className="image-viewer-controls" role="group" aria-label="Image zoom controls">
            <button type="button" onClick={() => updateImageZoom(imageZoom - 0.25)} disabled={imageZoom <= 0.5} aria-label="Zoom out">
              <ZoomOut size={17} />
            </button>
            <span className="mono" role="status" aria-live="polite">{Math.round(imageZoom * 100)}%</span>
            <button type="button" onClick={() => updateImageZoom(imageZoom + 0.25)} disabled={imageZoom >= 3} aria-label="Zoom in">
              <ZoomIn size={17} />
            </button>
            <button className="image-viewer-reset mono" type="button" onClick={() => updateImageZoom(1)}>RESET</button>
            <span className="image-viewer-hint mono">SCROLL TO ZOOM · DRAG TO PAN</span>
          </div>
        </div>
      ) : (
        <div className="work-modal" role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setSelected(null)} onKeyDown={(event) => { if (event.key === 'Escape') setSelected(null); }}>
          <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close preview"><X size={18} /></button>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <button ref={imageTriggerRef} className="modal-image-trigger" type="button" onClick={openImageViewer} aria-label={`Open full-screen image viewer for ${selected.title}`}>
              <img src={selected.image} alt={selected.title} draggable={false} />
              <span className="modal-image-hint mono"><ZoomIn size={13} /> VIEW IMAGE</span>
            </button>
            <div className="modal-copy"><div className="modal-overline mono"><span>{selected.category}</span><span>{selected.year}</span></div><h2 className="serif">{selected.title}</h2><p>{selected.description}</p><span className="modal-note mono">{selected.note}</span></div>
          </div>
        </div>
      ))}
      {dragGhost && (() => {
        const work = portfolioWorks.find((item) => item.id === dragGhost.workId);
        return work ? <div className="drag-ghost" style={{ left: dragGhost.x, top: dragGhost.y }} aria-hidden="true"><img src={work.image} alt="" /><span className="mono">{work.title}</span></div> : null;
      })()}
      {returnFlights.map((flight) => {
        const work = portfolioWorks.find((item) => item.id === flight.workId);
        if (!work) return null;
        return <motion.div
          key={flight.id}
          className="return-flight"
          style={{ left: flight.fromX, top: flight.fromY, width: flight.width }}
          initial={{ x: '-50%', y: '-50%', scale: 1, rotate: 0, opacity: 1 }}
          animate={{ left: flight.toX, top: flight.toY, scale: 0.16, rotate: 0, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.62, delay: flight.delay, ease: [0.22, 0.72, 0.28, 1] }}
          onAnimationComplete={() => setReturnFlights((flights) => flights.filter((entry) => entry.id !== flight.id))}
          aria-hidden="true"
        >
          <img src={work.image} alt="" draggable={false} />
          <span className="mono">{work.title}</span>
        </motion.div>;
      })}
    </main>
  );
}

export default App;
