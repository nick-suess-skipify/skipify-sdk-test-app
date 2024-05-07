# Skipify Checkout SDK

![skipify-logo](https://user-images.githubusercontent.com/5350362/204699214-f9b54d89-0328-4475-a83f-06dd469813fd.svg)

Checkout script generation, used for enabling Skipify checkout in a merchant store

## Tooling

- NX
- Vite
- Rollup
- ESBuild

## Features

- Static file generation
- Shared features across platforms
- Platform-specific features

## Usage

The project contains the following scripts:

- `nx run [platform]:build:[environment]` - generates the bundles, platform can be bigcommerce | custom, environment can be dev | stage | prod

Bundles get generated inside the dist folder

## Developing

```
// Start development server
`nx run bigcommerce:build:dev --watch`
```

Inside another terminal:
```
// Start development server
npm run host
```
Your scripts should be now live on http://localhost:4200/

BigCommerce
Add hosted script to the store by pasting the following code snippet
Remember to replace merchantId in the query
```
var script = document.createElement("script");
script.src = `http://localhost:4200/bigcommerce/bigcommerce.js?merchantId=ca4d3697-4579-4dda-9c89-ee63ae5a7b41&date=${new Date().getTime()}`;
document.head.appendChild(script);
```

## Deployments, Releases, & Rollbacks

- Please see confluence page on [Deployments, Releases, & Rollbacks](https://skipify.atlassian.net/wiki/spaces/PE/pages/1727496537/Deployments+Releases+Rollbacks)
