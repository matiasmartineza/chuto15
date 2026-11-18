// Arma las tarjetas del mazo Sabelotodo a partir de los datos de trivia.
import {
  CAPITALS, ELEMENTS, BOOKS, ARTWORKS, FILMS, PEOPLE, DATES, CURRENCIES, OLD_CURRENCIES, LANGUAGES,
} from './structured.js';
import {
  GEOGRAPHY, SCIENCE, ANIMALS, SPORTS, MUSIC, CHILE, LATAM, MATH, MYTHOLOGY, TECH, GENERAL,
} from './freeform.js';

const INTENSITY = { 1: 'soft', 2: 'medium', 3: 'hard' };
const RANGE = { 1: [10, 30], 2: [40, 70], 3: [70, 100] };

// Puntaje estable (siempre el mismo para la misma pregunta), dentro del rango de su dificultad
const pointsFor = (text, d) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  const [min, max] = RANGE[d];
  const steps = (max - min) / 5;
  return min + (h % (steps + 1)) * 5;
};

const card = (text, answer, d) => ({ text, answer, intensity: INTENSITY[d], points: pointsFor(text, d) });

export function buildTriviaCards(base = []) {
  const out = [...base];
  const seen = new Set(base.map((c) => c.text));
  const add = (text, answer, d) => {
    if (seen.has(text)) return;
    seen.add(text);
    out.push(card(text, answer, d));
  };

  CAPITALS.forEach(([country, capital, d]) => add(`¿Cuál es la capital de ${country}?`, capital, d));
  ELEMENTS.forEach(([sym, name, d]) => add(`¿Qué elemento químico tiene el símbolo ${sym}?`, name, d));
  BOOKS.forEach(([work, author, d]) => add(`¿Quién escribió "${work}"?`, author, d));
  ARTWORKS.forEach(([work, artist, d, verb]) => add(`¿Quién ${verb} "${work}"?`, artist, d));
  FILMS.forEach(([film, director, d]) => add(`¿Quién dirigió la película "${film}"?`, director, d));
  PEOPLE.forEach(([what, who, d]) => add(`¿Quién ${what}?`, who, d));
  DATES.forEach(([event, year, d]) => add(`¿En qué año ${event}?`, year, d));
  CURRENCIES.forEach(([country, coin, d]) => add(`¿Cuál es la moneda oficial de ${country}?`, coin, d));
  OLD_CURRENCIES.forEach(([country, coin, d]) => add(`¿Cuál era la moneda de ${country} antes del euro?`, coin, d));
  LANGUAGES.forEach(([country, lang, d]) => add(`¿Cuál es el idioma oficial de ${country}?`, lang, d));
  [GEOGRAPHY, SCIENCE, ANIMALS, SPORTS, MUSIC, CHILE, LATAM, MATH, MYTHOLOGY, TECH, GENERAL]
    .forEach((list) => list.forEach(([q, a, d]) => add(q, a, d)));

  return out;
}
