import { Product, Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Meyvə və tərəvəz', icon: 'nutrition' },
  { id: '2', name: 'Sosis və kolbasalar', icon: 'restaurant' },
  { id: '3', name: 'Süd məhsulları', icon: 'ice-cream' },
  { id: '4', name: 'Toyuq və dəniz məhsulları', icon: 'fish' },
  { id: '5', name: 'Çörək və şirniyyat', icon: 'pizza' },
  { id: '6', name: 'Makaront və paxlalı', icon: 'fast-food' },
  { id: '7', name: 'Gigiyena və təmizlik', icon: 'sparkles' },
  { id: '8', name: 'İçkilər', icon: 'cafe' },
];

// ===========================
// FEATURED PRODUCTS (UPGRADED)
// ===========================

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Kolbasa "Çerkizovo" servalat 580 q',
    price: 27.2,
    category: 'Sosis və kolbasalar',
    store: 'CityMart',
    weight: '580 q',
    image:
      'https://iqtisadiyyat.az/storage/posts/3995906f4836995.webp',
    isDiscount: false,
  },
  {
    id: '2',
    name: 'Sosislər Qurban toyuq və hinduşka 400 q',
    price: 11.5,
    category: 'Sosis və kolbasalar',
    store: 'CityMart',
    weight: '400 q',
    image:
      'https://iqtisadiyyat.az/storage/posts/3995906f4836995.webp',
    isDiscount: false,
  },
  {
    id: '3',
    name: 'Sosislər Best Beef Ocaq 370 q',
    price: 5.51,
    category: 'Sosis və kolbasalar',
    store: 'CityMart',
    weight: '370 q',
    image:
      'https://iqtisadiyyat.az/storage/posts/3995906f4836995.webp',
    isDiscount: false,
  },
  {
    id: '4',
    name: 'Makaron Favelli premium 500 q',
    price: 0.99,
    category: 'Makaront və paxlalı',
    store: 'Bravo',
    weight: '500 q',
    image:
      'https://strgimgr.umico.az/img/product/840/d3cde7ca-f6ce-41f8-b4a5-983a0fdadba9.jpeg',
    isDiscount: true,
  },

  // NEW FEATURED
  {
    id: '11',
    name: 'Süd “Atena” tam yağlı 1 L',
    price: 2.10,
    category: 'Süd məhsulları',
    store: 'Araz Market',
    weight: '1 L',
    image:
      'https://img5.lalafo.com/i/posters/api/13/ba/46/atena-sud-1l-id-108087419-850977283.jpeg',
    isDiscount: false,
  },
  {
    id: '12',
    name: 'Toyuq filesi 1 kq',
    price: 8.9,
    category: 'Toyuq və dəniz məhsulları',
    store: 'Rahat Market',
    weight: '1 kq',
    image:
      'https://instagram.fgyd9-1.fna.fbcdn.net/v/t51.29350-15/241795443_412145046994976_5096015770380951081_n.jpg?stp=dst-jpg_e35_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQuaW1hZ2VfdXJsZ2VuLjEwMDB4MTAwMC5zZHIuZjI5MzUwLmRlZmF1bHRfaW1hZ2UuYzIifQ&_nc_ht=instagram.fgyd9-1.fna.fbcdn.net&_nc_cat=108&_nc_oc=Q6cZ2QHpJuTIfxWyCGWnYeqvoc0CmnZOgxHd5z_hUxLhVjR6Ppa9C3ABYErV_JfyCXhdqZ0&_nc_ohc=KV8_EBeGU5cQ7kNvwFwIeFm&_nc_gid=IMnBJo3FSiqYfS9EZZUStw&edm=APs17CUBAAAA&ccb=7-5&ig_cache_key=MjY2MjAwNDc3OTQ3NzM0MjI0OQ%3D%3D.3-ccb7-5&oh=00_AfjJDz28C1TNj4qpb-kWU57canFSEbaSwfhjeMNGquNXAA&oe=692FDDF4&_nc_sid=10d13b',
    isDiscount: false,
  },
  {
    id: '13',
    name: 'Ağ çörək “Dəstə” 600 q',
    price: 1.10,
    category: 'Çörək və şirniyyat',
    store: 'Bazarstore',
    weight: '600 q',
    image:
      'https://baku.ws/storage/photos/uploads/thumbs/large/lAFfkcxAo6Cusrc6ZILwszXWk11binSG6MMbYERA.webp',
    isDiscount: true,
  },
];

// ===========================
// RECOMMENDED PRODUCTS (UPGRADED)
// ===========================

export const RECOMMENDED_PRODUCTS: Product[] = [
  {
    id: '5',
    name: 'Bərk buğda Rollton makaron qabıqları 650 q',
    price: 1.49,
    category: 'Makaront və paxlalı',
    store: 'CityMart',
    weight: '650 q',
    image:
      'https://strgimgr.umico.az/img/product/840/d3cde7ca-f6ce-41f8-b4a5-983a0fdadba9.jpeg',
    isDiscount: true,
  },
  {
    id: '6',
    name: 'Kolbasa Servelat Sevimli dad 440 q',
    price: 7.7,
    category: 'Sosis və kolbasalar',
    store: 'Araz Market',
    weight: '440 q',
    image:
      'https://iqtisadiyyat.az/storage/posts/3995906f4836995.webp',
    isDiscount: false,
  },
  {
    id: '7',
    name: 'Kolbasa "Çerkizovo" servelleti 85 q',
    price: 5.99,
    category: 'Sosis və kolbasalar',
    store: 'Bazarstore',
    weight: '85 q',
    image:
      'https://iqtisadiyyat.az/storage/posts/3995906f4836995.webp',
    isDiscount: true,
  },
  {
    id: '8',
    name: 'Kolbasa Sevimli Dad Bişmiş 650 q',
    price: 11.69,
    category: 'Sosis və kolbasalar',
    store: 'Neptun',
    weight: '650 q',
    image:
      'https://iqtisadiyyat.az/storage/posts/3995906f4836995.webp',
    isDiscount: false,
  },
  {
    id: '9',
    name: 'Süd məhsulları paketi 1 L',
    price: 2.35,
    category: 'Süd məhsulları',
    store: 'Rahat Market',
    weight: '1 L',
    image:
      'https://img5.lalafo.com/i/posters/api/13/ba/46/atena-sud-1l-id-108087419-850977283.jpeg',
    isDiscount: false,
  },
  {
    id: '10',
    name: 'Gigiyena seti (şampun + sabun)',
    price: 8.4,
    category: 'Gigiyena və təmizlik',
    store: 'CityMart',
    weight: '2 məhsul',
    image:
      'https://strgimgr.umico.az/img/product/840/0f4ade21-58e7-4b10-96ee-b4ddfd4d1aa2.jpeg',
    isDiscount: false,
  },

  // NEW RECOMMENDED
  {
    id: '14',
    name: 'Alma “Golden” 1 kq',
    price: 2.9,
    category: 'Meyvə və tərəvəz',
    store: 'Bravo',
    weight: '1 kq',
    image:
      'https://rofruit.az/uploads/thumbs/2023/11/alma-stornalit-500x500.jpg',
    isDiscount: false,
  },
  {
    id: '15',
    name: 'Pomidor təzə 1 kq',
    price: 3.5,
    category: 'Meyvə və tərəvəz',
    store: 'Araz Market',
    weight: '1 kq',
    image:
      'https://images.gastronom.ru/YonkB2TPd7KV22t_Y_eQb6PnZS4Pvl5V12IfChsd7GA/pr:product-cover-image/g:ce/rs:auto:0:0:0/L2Ntcy9hbGwtaW1hZ2VzLzNkYWU2NmM4LTgxZTYtNDAwZi1iMTE4LTY1YmU2MTk0NTY5Ni5qcGc.webp',
    isDiscount: true,
  },
  {
    id: '16',
    name: 'Qara çörək 700 q',
    price: 1.60,
    category: 'Çörək və şirniyyat',
    store: 'Neptun',
    weight: '700 q',
    image:
      'https://baku.ws/storage/photos/uploads/thumbs/large/lAFfkcxAo6Cusrc6ZILwszXWk11binSG6MMbYERA.webp',
    isDiscount: false,
  },
  {
    id: '17',
    name: 'Meyvə suyu “Jale” portağal 1 L',
    price: 2.90,
    category: 'İçkilər',
    store: 'Rahat Market',
    weight: '1 L',
    image:
      'https://bazarstore.az/cdn/shop/products/30010405_56cd1e90-e155-480b-b8ed-30b775b26553_533x.png?v=1693806225',
    isDiscount: true,
  },
  {
    id: '18',
    name: 'Mineral su “Bonaqua” 500 ml',
    price: 0.70,
    category: 'İçkilər',
    store: 'Bravo',
    weight: '0.5 L',
    image:
      'https://optim.tildacdn.com/tild6662-6438-4635-a632-646438643733/-/contain/36x40/center/center/-/format/webp/Bonaqua--1-min.png.webp',
    isDiscount: false,
  },
  {
    id: '19',
    name: 'Qranola ballı 350 q',
    price: 4.99,
    category: 'Çörək və şirniyyat',
    store: 'BirMarket',
    weight: '350 q',
    image:
      'https://strgimgr.umico.az/sized/840/547460-2b50817ca5caadfe0efab90c2cb37a63.jpg',
    isDiscount: false,
  },
];
