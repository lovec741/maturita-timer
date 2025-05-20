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
        updatePieChartSize();
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
        this.savedTimers = new SavedTimers(showTimerCallback, (savedTimer) => this.fillFormFromSavedTimer(savedTimer));
    }

    addSegment(defaultValues) {
        const segmentsContainer = document.getElementById('segmentsContainer');
        const newSegment = document.createElement('div');
        newSegment.className = 'd-flex align-items-center timer-segment mb-2';

        const colorInputs = document.querySelectorAll('#timerMenu .timer-segment [type="color"]');
        const existingHexColors = Array.from(colorInputs).map(inp => inp.value);
        if (defaultValues == undefined) {
            defaultValues = {
                minutes: "",
                seconds: "",
                desc: "",
                color: generateRandomHexColor(existingHexColors)
            }
        }
        newSegment.innerHTML = `
            <div class="input-group me-2">
                <input type="number" name="minutes" min="0" placeholder="0" class="form-control" aria-label="Minutes" value="${defaultValues.minutes}"/>
                <span class="input-group-text">min</span>
                <input type="number" name="seconds" min="0" max="59" placeholder="00" class="form-control" aria-label="Seconds" value="${defaultValues.seconds}"/>
                <span class="input-group-text">s</span>
            </div>
            <input type="text" name="desc" maxlength="12" placeholder="Short Label" class="form-control me-2" value="${defaultValues.desc}"/>
            <div class="color-input-container me-2">
                <input type="color" class="form-control form-control-color" style="min-width: 2.5em" value="${defaultValues.color}"/>
            </div>
            <div class="d-flex flex-column me-2">
                <button class="btn btn-sm btn-secondary move-segment-button mb-1" type="button" title="Move Up" onclick="this.closest('.timer-segment').previousElementSibling && this.closest('.timer-segment').parentNode.insertBefore(this.closest('.timer-segment'), this.closest('.timer-segment').previousElementSibling)">
                    <i class="bi bi-arrow-up"></i>
                </button>
                <button class="btn btn-sm btn-secondary move-segment-button" type="button" title="Move Down" onclick="this.closest('.timer-segment').nextElementSibling && this.closest('.timer-segment').parentNode.insertBefore(this.closest('.timer-segment').nextElementSibling, this.closest('.timer-segment'))">
                    <i class="bi bi-arrow-down"></i>
                </button>
            </div>
            <button class="btn btn-danger delete-segment-btn" type="button" title="Delete Segment" onclick="this.closest('.timer-segment').remove()">
                <i class="bi bi-trash"></i>
            </button>
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

    fillFormFromSavedTimer(savedTimer) {
        const segmentsContainer = document.getElementById('segmentsContainer');
        segmentsContainer.innerHTML = '';
        document.getElementById('timerTitle').value = savedTimer.title;
        savedTimer.data.forEach(segment => {
            var minutes = Math.floor(segment.duration);
            var seconds = Math.round((segment.duration-minutes) * 60);
            var defaultValues = {
                minutes: minutes,
                seconds: seconds,
                desc: segment.desc,
                color: segment.color
            }
            this.addSegment(defaultValues)
        })
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

function updatePieChartSize() {
    const pieChart = document.getElementById('pieChart');
    const pieChartCont = document.getElementById('pie-chart-cont');
    const controls = document.getElementById('controls');
    const timerClock = document.getElementById('timer-clock');

    if (pieChartCont && controls && timerClock) {
        const controlsHeight = window.innerHeight - controls.getBoundingClientRect().top;
        const timerClockBottom = timerClock.getBoundingClientRect().bottom;
        const availableHeight = window.innerHeight - controlsHeight - timerClockBottom - 20;
        pieChartCont.style.width = "100%";
        pieChartCont.style.height = availableHeight+'px';
        const size = Math.min(availableHeight, window.innerWidth - 20) + 'px';
        pieChart.style.width = size;
        pieChart.style.height = size;
    }
}

window.addEventListener('resize', updatePieChartSize);


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