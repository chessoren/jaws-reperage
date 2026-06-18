# JAWS · Repérage

Outil interne pour transformer des fiches **wearescene.com** en présentation PDF
à la charte **Jaws Group** — prête à montrer au client, sans aucune info sensible.

## Ce que ça fait

1. On colle une liste de liens `wearescene.com/fr/lieu/…` (un par ligne, bouton **+** pour en ajouter).
2. Le serveur lit chaque fiche et en extrait, **de façon déterministe (sans IA)** :
   titre, ville/adresse, surface, capacité, étage, hauteur sous plafond, accès,
   description, ambiances, équipements et photos haute définition.
3. Les éléments gênants sont **retirés** : prix/jour, caution, nom de l'hôte,
   services payants, politique d'annulation.
4. Génération d'un **PDF** : une page de couverture + une page par lieu, au format
   16:9, exactement à la charte Jaws (dégradé de marque, logo, typo Inter, pastilles…).
5. Aperçu inline + téléchargement.

## Stack

- **Front** : Vite + React + Tailwind v4, design « Lovable » (hero WebGL, navbar),
  la zone de prompt étant remplacée par un **tableau de liens**.
- **Back** : Express + Cheerio (scraping DOM/microdata) + Puppeteer (rendu HTML→PDF)
  + pdf-lib (fusion slide par slide, mémoire bornée).

## Démarrer

```bash
npm install
npm run dev      # lance le front (5180) ET l'API (3001) ensemble
```

- Front : http://localhost:5180
- API : http://localhost:3001 (proxifiée derrière `/api` côté front)

Scripts séparés : `npm run dev:web`, `npm run dev:api`.

## Structure

```
src/
  App.tsx                  page (hero + tableau de liens + « comment ça marche »)
  components/
    HeroShader.tsx         fond WebGL (runtime qclay, assets dans public/vendor)
    HeroNavbar.tsx         navbar rebrandée Jaws
    UrlListInput.tsx       tableau de liens (+ / ×) + génération + aperçu
    SendButton.tsx         bouton dégradé animé
server/
  index.mjs                API Express (/api/generate, /api/scrape)
  scrape.mjs               extraction déterministe d'une fiche wearescene
  template.mjs             gabarit HTML/CSS du deck à la charte Jaws
  pdf.mjs                  rendu Puppeteer slide-par-slide + fusion pdf-lib
_design_ref/               pages PNG de la charte cible (référence)
```

## Notes

- La couverture utilise le dégradé de marque Jaws (`#5563F6 → #FF2158 → #FF592C → #F79D2F`),
  logo et police récupérés depuis `jaws.group`.
- Les images proviennent de l'optimiseur d'images du site (`/_next/image`), en ~1080 px.
- Le PDF est volumineux (photos HD) : prévoir de l'espace disque libre pour la génération.
