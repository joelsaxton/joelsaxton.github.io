
(function () {
    'use strict';

    let secondsPerYear = 1; // speed modifier; slider scales this down for faster orbits
    const sizeFactor = 750;
    let zoom = 1;
    const minBodies = 2;
    const maxBodies = 10;
    const maxBodySize = 24;
    const minBodySize = 1;
    const minStarSize = 10;
    const orbitIntervalMin = 1;
    const orbitIntervalMax = 5;

    const systems = {
        'Sol': {
            names: ['Sol', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'],
            orbitSizes: [0, 5, 9, 14, 24, 78, 143, 288, 450],
            bodySizes: [12, 1, 2, 2, 1, 7, 5, 4, 4],
            periods: [0, 0.24, 0.62, 1, 1.88, 11.86, 29.46, 84.01, 164.8],
            colors: ['yellow', 'lightgray', 'lightgreen', 'blue', 'red', 'orange', 'yellow', 'blue', 'blue']
        },
        'HD-10180': {
            names: ['HD-10180', 'b', 'c', 'i', 'd', 'e', 'j', 'f', 'g', 'h'],
            orbitSizes: [0, 5, 10, 16, 22, 27, 33, 49, 141, 349],
            bodySizes: [13, 1, 3, 1, 3, 5, 2, 5, 5, 6],
            periods: [0, 0.1, 0.6, 1, 1.6, 4.9, 6.7, 12.2, 59.6, 230],
            colors: ['yellow', 'lightgray', 'lightgreen', 'blue', 'red', 'brown', 'purple', 'yellow', 'orange', 'yellow']
        },
        'Gliese-581': {
            names: ['Gliese-581', 'e', 'b', 'c'],
            orbitSizes: [0, 3, 4, 7],
            bodySizes: [20, 6, 10, 4],
            periods: [0, 3, 5, 13],
            colors: ['red', 'pink', 'orange', 'blue']
        },
        // Ultracool M-dwarf with 7 tightly-packed Earth-sized planets
        'TRAPPIST-1': {
            names: ['TRAPPIST-1', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
            orbitSizes: [0, 4, 6, 8, 11, 15, 18, 25],
            bodySizes: [3, 1, 1, 1, 1, 1, 1, 1],
            periods: [0, 0.004, 0.007, 0.011, 0.017, 0.025, 0.034, 0.051],
            colors: ['darkred', 'tan', 'lightgray', 'blue', 'lightblue', 'lightgreen', 'orange', 'gray']
        },
        // Young A-type star with 4 directly-imaged gas giants at wide orbits
        'HR-8799': {
            names: ['HR 8799', 'e', 'd', 'c', 'b'],
            orbitSizes: [0, 87, 144, 228, 408],
            bodySizes: [11, 6, 7, 6, 5],
            periods: [0, 18, 100, 190, 460],
            colors: ['white', 'orange', 'tan', 'blue', 'lightskyblue']
        },
        // G-type star with 8 confirmed planets, similar count to Sol
        'Kepler-90': {
            names: ['Kepler-90', 'b', 'c', 'i', 'd', 'e', 'f', 'g', 'h'],
            orbitSizes: [0, 31, 37, 42, 52, 88, 200, 298, 424],
            bodySizes: [11, 1, 1, 2, 2, 3, 3, 5, 4],
            periods: [0, 0.022, 0.030, 0.036, 0.046, 0.091, 0.281, 0.463, 1.0],
            colors: ['yellow', 'gray', 'lightgray', 'tan', 'orange', 'lightblue', 'blue', 'purple', 'orange']
        },
        // G-type star with a super-Earth (e) hugging the star and a cold gas giant (d) far out
        '55-Cancri': {
            names: ['55 Cancri A', 'e', 'b', 'c', 'f', 'd'],
            orbitSizes: [0, 2, 16, 34, 109, 804],
            bodySizes: [10, 2, 6, 4, 4, 8],
            periods: [0, 0.002, 0.040, 0.122, 0.712, 14.29],
            colors: ['yellow', 'orangered', 'orange', 'tan', 'blue', 'darkorange']
        },
        // F-type star with 3 massive planets; innermost is a hot Jupiter
        'Upsilon-Andromedae': {
            names: ['υ Andromedae', 'b', 'c', 'd'],
            orbitSizes: [0, 10, 140, 425],
            bodySizes: [10, 7, 6, 8],
            periods: [0, 0.013, 0.661, 3.50],
            colors: ['lightyellow', 'orange', 'tan', 'lightskyblue']
        }
    };

    const starTypes = {
        'red-dwarf':       { color: 'darkred',      size: 4  },
        'orange-dwarf':    { color: 'orangered',     size: 7  },
        'yellow-dwarf':    { color: 'yellow',        size: 11 },
        'yellow-white':    { color: '#ffffcc',       size: 13 },
        'white':           { color: 'white',         size: 15 },
        'blue-giant':      { color: 'lightskyblue',  size: 18 },
        'blue-supergiant': { color: '#99ccff',       size: 22 }
    };

    window.onload = function () {
        const selectedSystem = document.getElementById('choose-system');
        const slider = document.getElementById('slider');
        const zoomSlider = document.getElementById('zoom-slider');

        buildSolarSystem();
        setSliderCommands(slider, zoomSlider);
        makeBackgroundStars();

        selectedSystem.addEventListener('change', buildSolarSystem);
        document.getElementById('planet-count').addEventListener('change', buildSolarSystem);
        document.getElementById('star-type').addEventListener('change', buildSolarSystem);
        window.addEventListener('resize', buildSolarSystem);
    };

    function buildSolarSystem() {
        const container = document.getElementById('solar-system');
        container.innerHTML = '';
        const selected = document.getElementById('choose-system');
        const index = selected.options[selected.selectedIndex].value;
        const customControls = document.getElementById('custom-controls');

        customControls.style.display = index === 'Custom' ? 'block' : 'none';

        if (index === 'Custom') {
            const numPlanets = parseInt(document.getElementById('planet-count').value, 10);
            const starTypeKey = document.getElementById('star-type').value;
            buildExistingSolarSystem(buildCustomSystem(numPlanets, starTypeKey), container);
        } else if (index === 'Random') {
            buildExistingSolarSystem(buildNewSolarSystem(minBodies, maxBodies, maxBodySize, minBodySize, minStarSize, orbitIntervalMin, orbitIntervalMax), container);
        } else {
            buildExistingSolarSystem(systems[index], container);
        }
    }

    function buildCustomSystem(numPlanets, starTypeKey) {
        const star = starTypes[starTypeKey];
        const planetColors = ['olive', 'orangered', 'tan', 'brown', 'blue', 'orange', 'darkorange', 'green', 'lightgreen', 'gray', 'lightgray', 'purple', 'red'];
        const names = [starTypeKey];
        const bodySizes = [star.size];
        const colors = [star.color];
        const orbits = generateOrbits(numPlanets + 1, orbitIntervalMin, orbitIntervalMax);

        for (let i = 0; i < numPlanets; i++) {
            names.push(generateName());
            bodySizes.push(generateRandomInt(minBodySize, Math.max(minBodySize + 1, star.size - 4)));
            colors.push(planetColors[generateRandomInt(0, planetColors.length - 1)]);
        }

        return {
            names,
            bodySizes,
            orbitSizes: orbits.orbitSizes,
            periods: orbits.periods,
            colors
        };
    }

    function buildNewSolarSystem(minBodies, maxBodies, maxBodySize, minBodySize, minStarSize, orbitIntervalMin, orbitIntervalMax) {
        const numBodies = generateRandomInt(minBodies, maxBodies);
        const names = generateBodyNames(numBodies);
        const bodySizes = generateBodySizes(numBodies, maxBodySize, minBodySize, minStarSize);
        const orbits = generateOrbits(numBodies, orbitIntervalMin, orbitIntervalMax);
        const colors = generateColors(numBodies);

        return {
            names,
            bodySizes,
            orbitSizes: orbits.orbitSizes,
            periods: orbits.periods,
            colors
        };
    }

    function generateRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateBodyNames(numBodies) {
        const names = [];
        for (let i = 0; i < numBodies; i++) {
            names.push(generateName());
        }
        return names;
    }

    function generateName() {
        const startVowels = ['a', 'e', 'i', 'o', 'u'];
        const vowels = ['a', 'a', 'e', 'e', 'ie', 'ee', 'i', 'i', 'o', 'o', 'ou', 'u', 'y'];
        const startConsonants = ['b', 'c', 'ch', 'd', 'dr', 'f', 'fl', 'g', 'gr', 'h', 'j', 'k', 'kl', 'kr', 'l', 'm', 'n', 'p', 'ph', 'qu', 'r', 's', 'st', 'sc', 'qu', 't', 'v', 'w', 'x', 'y', 'z'];
        const endConsonants = ['b', 'bb', 'c', 'd', 'dd', 'f', 'ff', 'g', 'gh', 'h', 'j', 'k', 'l', 'm', 'mm', 'n', 'nn', 'p', 'ph', 'pp', 'qu', 'r', 'rt', 'rr', 's', 'st', 't', 'tt', 'v', 'w', 'x', 'y', 'z', 'zz'];

        let name = '';
        const numSyllables = generateRandomInt(2, 3);
        for (let x = 0; x < numSyllables; x++) {
            name += generateSyllable(startVowels, vowels, startConsonants, endConsonants);
        }
        return name;
    }

    function generateSyllable(startVowels, vowels, startConsonants, endConsonants) {
        const structures = [
            [startConsonants, vowels, endConsonants],
            [startVowels, endConsonants],
            [startConsonants, vowels],
            [startVowels, startConsonants, startVowels]
        ];

        const syllableType = structures[generateRandomInt(0, structures.length - 1)];
        let syllable = '';
        for (const phonemeGroup of syllableType) {
            syllable += phonemeGroup[generateRandomInt(0, phonemeGroup.length - 1)];
        }
        return syllable;
    }

    function generateBodySizes(numBodies, maxBodySize, minBodySize, minStarSize) {
        const sunSize = generateRandomInt(minStarSize, maxBodySize);
        const bodies = [sunSize];
        for (let x = 1; x < numBodies; x++) {
            bodies.push(generateRandomInt(minBodySize, sunSize - 4));
        }
        return bodies;
    }

    function generateOrbits(numBodies, orbitIntervalMin, orbitIntervalMax) {
        const periods = [0];
        const orbitSizes = [0];
        let orbit = 0;
        let periodModifier = 1.05;

        for (let x = 1; x < numBodies; x++) {
            const offset = generateRandomInt(orbitIntervalMin, orbitIntervalMax);
            orbit += offset + orbit;
            orbitSizes.push(orbit);
            periods.push((orbit / 5) * periodModifier);
            periodModifier *= periodModifier;
        }

        return { periods, orbitSizes };
    }

    function generateColors(numBodies) {
        const planetColors = ['olive', 'orangered', 'tan', 'brown', 'blue', 'orange', 'darkorange', 'green', 'yellow', 'lightgreen', 'gray', 'lightgray', 'purple', 'red'];
        const starColors = ['blue', 'lightskyblue', 'orange', 'purple', 'yellow', 'white', 'red'];
        const colors = [starColors[generateRandomInt(0, starColors.length - 1)]];
        for (let x = 1; x < numBodies; x++) {
            colors.push(planetColors[generateRandomInt(0, planetColors.length - 1)]);
        }
        return colors;
    }

    function buildExistingSolarSystem(system, container) {
        const { names, orbitSizes, bodySizes, periods, colors } = system;

        const star = document.createElement('div');
        const windowSize = window.innerHeight * zoom;
        const sunSize = (bodySizes[0] * windowSize) / sizeFactor;
        const max = windowSize - (sunSize * 2);
        const orbitModifier = max / orbitSizes[orbitSizes.length - 1];
        star.className = 'bodies';
        star.id = 'sun';
        star.style.height = star.style.width = sunSize + 'px';
        star.style.marginTop = star.style.marginLeft = -sunSize / 2 + 'px';
        star.style.backgroundColor = colors[0];
        container.appendChild(star);

        for (let i = 1; i < names.length; i++) {
            const orbit = orbitSizes[i] * orbitModifier;
            const planetSize = (bodySizes[i] * max) / sizeFactor;
            const outer = document.createElement('div');
            outer.className = 'orbit';
            outer.style.width = outer.style.height = orbit + sunSize + 'px';
            outer.style.marginTop = outer.style.marginLeft = -(orbit + sunSize) / 2 + 'px';
            outer.style['-webkit-animation'] = 'spin-right ' + periods[i] * secondsPerYear + 's linear infinite';
            outer.style.animation = 'spin-right ' + periods[i] * secondsPerYear + 's linear infinite';
            const inner = document.createElement('div');
            inner.className = 'bodies planet';
            inner.id = names[i];
            inner.style.width = inner.style.height = planetSize + 'px';
            inner.style.marginLeft = inner.style.marginTop = -planetSize / 2 + 'px';
            inner.style.backgroundColor = colors[i];
            outer.appendChild(inner);
            container.appendChild(outer);
        }
    }

    function setSliderCommands(slider, zoomSlider) {
        slider.addEventListener('change', function () {
            secondsPerYear = 1 / this.value;
            buildSolarSystem();
        });

        zoomSlider.addEventListener('change', function () {
            zoom = this.value;
            buildSolarSystem();
        });
    }

    function makeBackgroundStars() {
        const height = window.innerHeight;
        const width = window.innerWidth;
        const stars = document.getElementById('stars');
        const numStars = width / 8;
        stars.style.backgroundSize = width + 'px ' + height + 'px';
        let style = '';
        for (let i = 0; i < numStars; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const size = i > width / 10 ? 2 : 1;
            style += 'radial-gradient(' + size + 'px ' + size + 'px at ' + x + 'px ' + y + 'px, #EEEEEE, rgba(255,255,255,0)),';
        }
        style = style.slice(0, -1);
        stars.style.backgroundImage = style;
    }

}());
