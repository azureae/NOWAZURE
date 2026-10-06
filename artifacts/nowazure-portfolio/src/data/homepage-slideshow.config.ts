import { portfolioWorks } from './portfolio.config';

// Timings are milliseconds. The red panel sweeps left before the next scene appears.
export const homepageSlideshow = {
  intervalMs: 7000,
  wipeMs: 950,
  scenes: portfolioWorks.map(({ id, image, title }) => ({ id, image, title })),
};
