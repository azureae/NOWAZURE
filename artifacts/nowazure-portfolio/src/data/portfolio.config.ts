export type PortfolioWork = {
  id: string;
  title: string;
  category: string;
  year: string;
  image: string;
  description: string;
  note: string;
};

// Add a file under /public/images, then add one entry here to publish a new frame.
export const portfolioWorks: PortfolioWork[] = [
  {
    id: 'viper-clan',
    title: 'The Viper Clan',
    category: 'Cinematic scene',
    year: 'STUDY I',
    image: '/images/viper-clan.jpg',
    description: 'Strength through unity. Built to life entirely in Roblox Studio, then immortalized like history through a considered image finish. Made for Saito Clan.',
    note: 'Environment · Lighting · Color grade',
  },
  {
    id: 'the-armory',
    title: 'The Armory',
    category: 'World building',
    year: 'STUDY II',
    image: '/images/armory.jpg',
    description: "An interior built for texture and clutter. Patches, plate carriers, and low warm light, all made for Astray's tailory.",
    note: 'Interior · Prop design · Set dressing',
  },
  {
    id: 'chance-encounter',
    title: 'Chance Encounter',
    category: 'Cinematic scene',
    year: 'STUDY III',
    image: '/images/chance-encounter.jpg',
    description: "Survive to see another day. Practical effects and particle emitters bring the encounter to life. Made for Astray's Discord banner.",
    note: 'Action staging · VFX · Composition',
  },
  {
    id: 'justice',
    title: 'Justice',
    category: 'Key art',
    year: 'STUDY IV',
    image: '/images/justice.jpg',
    description: "Power breeds crime. Practical effects and lighting meet a strong typographic frame. Made for kohrenhund's Indonesia.",
    note: 'Graphic design · Key art · Typography',
  },
  {
    id: 'night-raid',
    title: 'Night Raid',
    category: 'Cinematic scene',
    year: 'STUDY V',
    image: '/images/night-raid.jpg',
    description: "They fought in the dark for you to stay in the light. An ambience study in spotlights and night-vision beams. Made for kohrenhund's Indonesia.",
    note: 'Night lighting · Character staging · Color grade',
  },
    {
    id: 'extraction',
    title: 'Extraction',
    category: 'Cinematic scene',
    year: 'STUDY VI',
    image: '/images/extraction.png',
    description: 'Stay alert. They could be anywhere at any moment. Backdrop and custom uniforms supplied by Astray, for Astray.',
    note: 'Depth-of-field · Character staging · Detail-oriented · Color grade',
  },
      {
    id: 'crisis-aversion',
    title: 'Crisis Aversion',
    category: 'Cinematic scene & World building',
    year: 'STUDY VII',
    image: '/images/crisis-aversion.png',
    description: "Just another day at the office. This project was meant to be for Astray's Workshop, but was scrapped.",
    note: 'Depth-of-field · Character staging · Color grade · Environment',
  },
     {
    id: 'under-pressure',
    title: 'Under Pressure',
    category: 'Cinematic scene & World building',
    year: 'STUDY VIII',
    image: '/images/under-pressure.png',
    description: "Don't look back. Made for Astray's main group backdrop banner. In collaboration with samip for his effects.",
    note: 'Depth-of-field · VFX · Environment',
  },
];

export const portfolioServices = [
  {
    id: 'cinematic-scenes',
    title: 'Cinematic scenes',
    description: 'Atmospheric Roblox environments built around a clear moment. Set dressing, composition, custom lighting, and a final color grade work together to make each scene feel like a frame from a larger story.',
  },
  {
    id: 'thumbnails-key-art',
    title: 'Thumbnails & key art',
    description: 'A focused, readable image that gives a game or update a strong first impression. Each piece is composed to work at thumbnail size while keeping its important details and mood.',
  },
  {
    id: 'logos-identity',
    title: 'Logos & identity',
    description: 'Distinctive marks and visual direction for Roblox groups and games, shaped to feel recognizable across icons, banners, and in-game materials.',
  },
  {
    id: 'group-game-branding',
    title: 'Group / game branding',
    description: 'A cohesive visual set for a Roblox project, bringing its logo, colors, promotional art, and supporting graphics into one consistent identity.',
  },
];
