# Onlyflooze Vue + Supabase

Ce projet est une application de gestion de finances personnelles développée avec Vue 3, Vite, TailwindCSS et Supabase. Elle permet de suivre ses transactions, catégories, tags, et d'analyser ses dépenses récurrentes.

## Fonctionnalités principales

- Authentification (connexion, inscription)
- Gestion des transactions (création, édition, import CSV)
- Gestion des catégories et tags
- Attribution de catégories aux transactions
- Visualisation des transactions récurrentes
- Interface moderne et responsive avec TailwindCSS

## Prérequis

- Node.js (version recommandée : >=18)
- npm (ou yarn/pnpm)

## Installation

1. Clone le dépôt :
   ```sh
   git clone <url-du-repo>
   cd onlyflooze_vue_supabase
   ```
2. Installe les dépendances :
   ```sh
   npm install
   ```

## Lancement en développement

```sh
npm run dev
```

L'application sera accessible sur `http://localhost:5173` (ou le port affiché dans le terminal).

## Build pour la production

```sh
npm run build
```

## Lancer les tests unitaires

```sh
npm run test:unit
```

## Lint et formatage

- Lint : `npm run lint`
- Formatage : `npm run format`

## Génération des types Supabase

Si tu modifies la base de données Supabase, tu peux régénérer les types TypeScript :

```sh
npm run gen:types
```

## Stack technique

- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/) (tests unitaires)
- [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) (qualité et formatage du code)

## Configuration recommandée de l'IDE

- [VSCode](https://code.visualstudio.com/)
- Extension [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (désactiver Vetur)

## Remarques

- Les variables d'environnement sont à placer dans un fichier `.env` à la racine (voir documentation Supabase pour les clés nécessaires).
- Pour toute question ou contribution, n'hésite pas à ouvrir une issue ou une pull request.
