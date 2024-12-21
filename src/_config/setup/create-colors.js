import fs from 'node:fs';
import Color from 'colorjs.io';
import rgbHex from 'rgb-hex';

const colorsBase = JSON.parse(fs.readFileSync('./src/_data/designTokens/colorsBase.json', 'utf-8'));

const generateColorPalette = baseColorHex => {
  const baseColor = new Color(baseColorHex).to('oklch');

  const steps = [
    {label: '50', lightness: 0.96, chroma: baseColor.c * 0.19, hue: baseColor.h},
    {label: '100', lightness: 0.94, chroma: baseColor.c * 0.45, hue: baseColor.h},
    {label: '200', lightness: 0.86, chroma: baseColor.c * 0.76, hue: baseColor.h},
    {label: '300', lightness: 0.8, chroma: baseColor.c * 0.86, hue: baseColor.h},
    {label: '400', lightness: 0.7, chroma: baseColor.c * 0.96, hue: baseColor.h},
    {label: '500', lightness: 0.62, chroma: baseColor.c * 1, hue: baseColor.h},
    {label: '600', lightness: 0.5, chroma: baseColor.c * 1, hue: baseColor.h},
    {label: '700', lightness: 0.42, chroma: baseColor.c * 1, hue: baseColor.h},
    {label: '800', lightness: 0.36, chroma: baseColor.c * 0.85, hue: baseColor.h},
    {label: '900', lightness: 0.25, chroma: baseColor.c * 0.72, hue: baseColor.h},
    {label: '950', lightness: 0.2, chroma: baseColor.c * 0.55, hue: baseColor.h}
  ];

  return steps.map(step => ({
    name: `${step.label}`,
    value: '#' + rgbHex(new Color('oklch', [step.lightness, step.chroma, step.hue]).to('srgb').toString())
  }));
};

const generateNeutralPalette = baseColorHex => {
  const baseColor = new Color(baseColorHex).to('oklch');

  const steps = [
    {label: '50', lightness: 0.973, chroma: baseColor.c * 0.12, hue: baseColor.h},
    {label: '100', lightness: 0.9, chroma: baseColor.c * 0.14, hue: baseColor.h},
    {label: '200', lightness: 0.8, chroma: baseColor.c * 0.2, hue: baseColor.h},
    {label: '300', lightness: 0.7, chroma: baseColor.c * 0.25, hue: baseColor.h},
    {label: '400', lightness: 0.6, chroma: baseColor.c * 0.3, hue: baseColor.h},
    {label: '500', lightness: 0.5, chroma: baseColor.c * 0.35, hue: baseColor.h},
    {label: '600', lightness: 0.45, chroma: baseColor.c * 0.3, hue: baseColor.h},
    {label: '700', lightness: 0.37, chroma: baseColor.c * 0.28, hue: baseColor.h},
    {label: '800', lightness: 0.33, chroma: baseColor.c * 0.25, hue: baseColor.h},
    {label: '900', lightness: 0.27, chroma: baseColor.c * 0.22, hue: baseColor.h},
    {label: '950', lightness: 0.24, chroma: baseColor.c * 0.2, hue: baseColor.h}
  ];

  return steps.map(step => ({
    name: `${step.label}`,
    value: '#' + rgbHex(new Color('oklch', [step.lightness, step.chroma, step.hue]).to('srgb').toString())
  }));
};

const colorTokens = {
  title: colorsBase.title,
  description: colorsBase.description,
  items: []
};

colorsBase.neutral.forEach(color => {
  const palette = generateNeutralPalette(color.value);
  palette.forEach(shade => {
    colorTokens.items.push({
      name: `${color.name} ${shade.name}`,
      value: shade.value
    });
  });
});

colorsBase.colors.forEach(color => {
  const palette = generateColorPalette(color.value);
  palette.forEach(shade => {
    colorTokens.items.push({
      name: `${color.name} ${shade.name}`,
      value: shade.value
    });
  });
});

colorsBase.fixedColors.forEach(color => {
  colorTokens.items.push({
    name: color.name,
    value: color.value
  });
});

fs.writeFileSync('./src/_data/designTokens/colors.json', JSON.stringify(colorTokens, null, 2));
