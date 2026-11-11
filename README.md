# Cinemax Piraju

Site do cinema: hero animado, leque 3D de cartazes, sessões por dia, mapa de assentos com
simulação da visão do telão, bomboniere, ingresso animado e sobre nós.

## Estrutura
```
index.html      estrutura da página
css/style.css   visual, layout e animações
js/main.js      dados (filmes, salas, sessões, produtos) e toda a interação
```
Os cartazes e cenas são desenhados por código (Canvas/SVG), então não há pasta de imagens.

## Publicar (Firebase Hosting)
```
npm install -g firebase-tools
firebase login --no-localhost
firebase deploy --only hosting
```
Site: https://cinemax-piraju.web.app
