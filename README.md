# Cinemax Piraju

Site do cinema: hero animado, leque 3D de cartazes, sessões por dia, mapa de assentos com
simulação da visão do telão, bomboniere, ingresso animado e sobre nós.

## Estrutura
```
index.html      estrutura da página
css/style.css   visual, layout e animações
js/main.js      dados (filmes, salas, sessões, produtos) e toda a interação
sw.js           service worker (cache para as próximas visitas)
firebase.json   hospedagem e cabeçalhos de cache
```

## Cache
- CSS e JS ficam guardados por 1 ano no navegador; a página (HTML) sempre confere se há versão nova.
- O service worker guarda página, CSS, JS e fontes, e o site abre mesmo sem internet.
- Os cartazes desenhados por código ficam salvos no navegador após a primeira visita.

**Ao publicar uma alteração:** aumente `VERSION` em `sw.js` (ex.: `v3` → `v4`) e troque o `?v=` nos dois links do `index.html` para o mesmo valor. Se mudar o desenho dos cartazes, aumente `ART_VERSION` em `js/main.js`.
Os cartazes e cenas são desenhados por código (Canvas/SVG), então não há pasta de imagens.

## Publicar (Firebase Hosting)
```
npm install -g firebase-tools
firebase login --no-localhost
firebase deploy --only hosting
```
Site: https://cinemax-piraju.web.app
