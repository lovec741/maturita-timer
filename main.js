class TimerManager {
    constructor() {
        this.createMenu = new CreateMenu(((segments) => this.showTimer(segments)).bind(this));
        this.timer;
        this.timerOpen = false;
    }
    
    showTimer(segments) {
        this.timerOpen = true;
        this.timer = new Timer(segments);
        document.getElementById('timerMenu').style.display = 'none';
        document.getElementById('timerDisplay').style.display = 'block';
    }
    
    showMenu() {
        this.timerOpen = false;
        this.timer.reset();
        document.getElementById('timerMenu').style.display = 'block';
        document.getElementById('timerDisplay').style.display = 'none';
    }
}

class CreateMenu {
    constructor(showTimerCallback) {
        this.savedTimers = new SavedTimers(showTimerCallback);
    }

    addSegment() {
        const segmentsContainer = document.getElementById('segmentsContainer');
        const newSegment = document.createElement('div');
        newSegment.className = 'd-flex align-items-center timer-segment mb-2';

        const colorInputs = document.querySelectorAll('#timerMenu .timer-segment [type="color"]');
        const existingHexColors = Array.from(colorInputs).map(inp => inp.value);
    
        newSegment.innerHTML = `
            <div class="input-group me-2">
                <input type="number" name="minutes" min="0" placeholder="0" class="form-control" aria-label="Minutes"/>
                <span class="input-group-text">min</span>
                <input type="number" name="seconds" min="0" max="59" placeholder="00" class="form-control" aria-label="Seconds"/>
                <span class="input-group-text">s</span>
            </div>
            <input type="text" name="desc" maxlength="12" placeholder="Short Label" class="form-control me-2"/>
            <div class="color-input-container">
                <input type="color" class="form-control form-control-color" style="min-width: 2.5em" value="`+generateRandomHexColor(existingHexColors)+`"/>
            </div>
        `;
        segmentsContainer.appendChild(newSegment);
    }

    createTimer() {
        const segments = document.querySelectorAll('.timer-segment');
        const timerData = [];
        segments.forEach(segment => {
            const durationMinutesValue = segment.querySelector('[name="minutes"]').value;
            var durationSecondsValue = segment.querySelector('[name="seconds"]').value;
            const descValue = segment.querySelector('[name="desc"]').value;
            if (!durationMinutesValue) {
                return;
            }
            if (!durationSecondsValue) {
                durationSecondsValue = 0;
            }
            timerData.push({
                duration: parseInt(durationMinutesValue) + parseInt(durationSecondsValue) / 60,
                desc: descValue,
                color: segment.querySelector('[type="color"]').value
            });
        });
        if (!timerData.length) {
            alert('Please set the minutes duration of at least one segment.');
            throw "failed";
        }
        const title = document.getElementById('timerTitle').value.trim();
        if (!title) {
            alert('Please enter a title for the timer.');
            return;
        }

        this.savedTimers.saveTimers({title, data: timerData})
        this.reset();
    }
        
    reset() {
        document.getElementById('timerTitle').value = '';
    
        const segmentsContainer = document.getElementById('segmentsContainer');
        segmentsContainer.innerHTML = '';
    
        this.addSegment();
        this.savedTimers.drawSavedTimers();
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomHexColor(existingHexColors) {
    const MIN_GAP = 70;

    const existingHues = existingHexColors.slice(-3).map(hex => {
        const rgb = colorconv.HEX2RGB(hex.substring(1));
        return colorconv.RGB2HSL(rgb)[0];
    }).sort((a,b) => a-b);

    const ranges = [];
    if (existingHues.length === 0) {
        ranges.push([0, 360]); 
    } else {
        // gap between last and first hue (wrapping around 360)
        const firstGap = existingHues[0] + (360 - existingHues[existingHues.length-1]);
        if (firstGap > MIN_GAP*2) {
            if (existingHues[existingHues.length-1] + MIN_GAP <= 360) {
                ranges.push([existingHues[existingHues.length-1] + MIN_GAP, 360]);
            }
            if (existingHues[0] >= MIN_GAP) {
                ranges.push([0, existingHues[0] - MIN_GAP]);
            }
        }
        
        // gaps between hues
        for (let i = 0; i < existingHues.length - 1; i++) {
            if (existingHues[i+1] - existingHues[i] > MIN_GAP*2) {
                ranges.push([existingHues[i] + MIN_GAP, existingHues[i+1] - MIN_GAP]);
            }
        }
    }

    // weight by size
    const totalSize = ranges.reduce((sum, range) => sum + (range[1] - range[0]), 0);

    let selectedHue;
    if (totalSize == 0) {
        selectedHue = random(0, 360);
    } else {
        let randomPoint = random(0, totalSize);
        
        for (const range of ranges) {
            const rangeSize = range[1] - range[0];
            if (randomPoint <= rangeSize) {
                selectedHue = range[0] + randomPoint;
                break;
            }
            randomPoint -= rangeSize;
        }
    }

    return '#'+colorconv.HSL2HEX([selectedHue, random(60, 100), random(50, 60)]);
}

var noSleep = new NoSleep();
let timerManager = new TimerManager();

document.addEventListener('click', function enableNoSleep() {
    document.removeEventListener('click', enableNoSleep, false);
    noSleep.enable();
}, false);

document.addEventListener("DOMContentLoaded", () => {
    timerManager.createMenu.reset()
}, false);

window.addEventListener('keydown', e => {
    if (e.key === " " || e.key === "Spacebar") {
        if (timerManager.timerOpen) {
            e.preventDefault();
            timerManager.timer.toggle();
        }
    }
});