import lofiTrack from '../assets/lofi.mp3';
import pixelCityArt from '../assets/pixel-city.gif';

import calmTrack from '../assets/song&wallpaper/Calm.mp3';
import calmArt from '../assets/song&wallpaper/Calm.jpg';

import calmBgTrack from '../assets/song&wallpaper/Calm_backgroung.mp3';
import calmBgArt from '../assets/song&wallpaper/Calm_Background.jpg';

import carpetmanTrack from '../assets/song&wallpaper/Carpetman_Made_It_Lower.mp3';
import carpetmanArt from '../assets/song&wallpaper/Carpetman_made_it_lower.webp';

import lofiProdTrack from '../assets/song&wallpaper/Lofi_Production.mp3';
import lofiProdArt from '../assets/song&wallpaper/Lofi_Production.jpg';

import raysTrack from '../assets/song&wallpaper/rays-of-life.mp3';
import raysArt from '../assets/song&wallpaper/Rays_Of_Life.jpg';

import slipTrack from '../assets/song&wallpaper/Slip-elliot-moss.mp3';
import slipArt from '../assets/song&wallpaper/Slip.jpg';

export const playlist = [
  { id: 0, title: 'Slip', tag: 'Elliot Moss', src: slipTrack, cover: slipArt },
  { id: 1, title: 'Lofi Chill Beats', tag: 'Lofi Ambient', src: lofiTrack, cover: pixelCityArt },
  { id: 2, title: 'Calm Atmosphere', tag: 'Peaceful Beats', src: calmTrack, cover: calmArt },
  { id: 3, title: 'Calm Background', tag: 'Soft Melodies', src: calmBgTrack, cover: calmBgArt },
  { id: 4, title: 'Made It Lower', tag: 'Carpetman', src: carpetmanTrack, cover: carpetmanArt },
  { id: 5, title: 'Lofi Production', tag: 'Studio Chill', src: lofiProdTrack, cover: lofiProdArt },
  { id: 6, title: 'Rays Of Life', tag: 'Uplifting Ambient', src: raysTrack, cover: raysArt },
];
