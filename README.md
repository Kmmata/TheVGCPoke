# PokéTeamsheet — Generador de Hojas de Equipo Pokémon VG

Genera hojas de equipo oficiales para torneos **Pokémon VG** y **Pokémon Champions**. Incluye Team Builder con validación de Regulación M-B, Calculadora de Daños y exportación a PDF en formato Play! Pokémon.

**En vivo:** [kmmata.github.io/TheVGCPoke](https://kmmata.github.io/TheVGCPoke/)

---

## Funcionalidades

### Generador de Hojas de Equipo
- **Staff Team Sheet** — Para jueces, incluye estadísticas calculadas (HP, Ataque, Defensa, etc.)
- **Open Team Sheet** — Para oponentes, sin estadísticas
- Genera **PDFs** listos para competición siguiendo el formato oficial de Play! Pokémon
- Importa equipos desde **Pokémon Showdown** o **PokePaste**

### Team Builder
- Validación completa de **Regulación M-B** (226 Pokémon, 148 objetos, 502 movimientos)
- Sistema de **Stat Points (SP)** con 66 puntos totales y máximo 32 por stat
- Autocompletado de Pokémon, objetos, movimientos y habilidades
- Sprites de PokéAPI
- Guarda equipos en el navegador

### Calculadora de Daños
- Fórmula exacta del **NCP VGC Calculator**
- Calcula daño con STAB, efectividad de tipos, clima, terreno, habilidades, objetos y más
- Múltiples paneles de cálculo simultáneos
- Exporta cálculos a Showdown

---

## Características Técnicas

- **100% local** — Todos los datos se procesan en tu navegador, sin servidores externos
- **Bilingüe** — Interfaz completa en español e inglés
- **Sin dependencias** — Vanilla HTML/CSS/JS, sin frameworks
- **PDF con `pdf-lib`** — Generación de PDFs en el navegador
- **Responsive** — Funciona en móvil, tablet y escritorio

---

## Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/kmmata/TheVGCPoke.git

# Abrir en el navegador (no necesita servidor)
# Abrir index.html directamente
```

También puedes usar un servidor local:

```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve .
```

---

## Estructura del Proyecto

```
├── index.html          # Página principal
├── builder.html        # Team Builder
├── calc.html           # Calculadora de Daños
├── css/
│   ├── styles.css      # Estilos de la página principal
│   ├── builder.css     # Estilos del Team Builder
│   └── calc.css        # Estilos de la Calculadora
├── js/
│   ├── app.js          # Lógica principal (generador de hojas)
│   ├── builder.js      # Lógica del Team Builder
│   ├── calc.js         # Lógica de la Calculadora
│   ├── pdf.js          # Generación de PDFs
│   ├── pokeapi.js      # Integración con PokéAPI
│   └── validation.js   # Validación de Regulación M-B
├── data/
│   ├── pokemon.json    # Datos de Pokémon (226 legales)
│   ├── items.json      # Objetos (148)
│   ├── moves.json      # Movimientos (502)
│   ├── abilities.json  # Habilidades
│   └── natures.json    # Naturalezas
├── assets/
│   └── template.pdf    # Plantilla Play! Pokémon
├── sitemap.xml
└── robots.txt
```

---

## Cómo Usar

1. **Página principal** — Importa un equipo desde Showdown o PokePaste
2. **Team Builder** — Crea o edita tu equipo con validación de Regulación M-B
3. **Genera PDF** — Selecciona Pokémon y genera la hoja de equipo para el torneo
4. **Calculadora** — Calcula daños entre dos Pokémon

---

## Tecnologías

- HTML5, CSS3, JavaScript (ES6+)
- [PokéAPI](https://pokeapi.co/) — Sprites de Pokémon
- [pdf-lib](https://pdf-lib.js.org/) — Generación de PDFs
- Sin frameworks, sin build tools, sin servidores

---

## Licencia

MIT
