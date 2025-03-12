class Timer {
    constructor(segments) {
        this.segments = segments.map(seg => ({
            ...seg,
            duration: Math.round(parseFloat(seg.duration.toString().replace(",", ".")) * 60),
            elapsed: 0,
        }));
        this.totalTime = this.segments.reduce((total, seg) => total + seg.duration, 0);
        this.currentSegmentIndex = 0;
        this.isRunning = false;
        this.timerInterval = null;
        this.timerDraw = new TimerDraw('pieChart');
        this.pauseButton = document.getElementById('pauseButton');
        this.timerClock = document.getElementById('timerClock');
        this.finishedModal = new bootstrap.Modal(document.getElementById('timerFinishedModal'));

        this.redraw();
        this.updatePauseButton(false);
        this.timerDraw.drawPauseSymbol();
    }

    toggle() {
        if (!this.isRunning) {
            this.updatePauseButton(true);
            this.isRunning = true;
            this.startTime = Date.now();
            this.update()
            if (this.timerInterval !== null)
                accurateInterval.clear(this.timerInterval)
            // console.log("creating timer")
            this.timerInterval = accurateInterval.set(() => {this.update()}, 1000);
        } else {
            this.updatePauseButton(false);
            this.timerDraw.drawPauseSymbol();
            accurateInterval.clear(this.timerInterval);
            this.isRunning = false;
            const currentSegment = this.segments[this.currentSegmentIndex];
            if (currentSegment != undefined && currentSegment.elapsed !== 0) { // prevents second skip on pause
                currentSegment.elapsed--;
            }
        }
    }

    update() {
        if (!this.isRunning) return;
        // console.log("TIMER DEBUG", Date.now() - this.startTime)
        if (this.currentSegmentIndex >= this.segments.length) {
            this.reset();
            this.finishedModal.show();
            return;
        }

        const currentSegment = this.segments[this.currentSegmentIndex];
        this.redraw();
        currentSegment.elapsed++;
        if (currentSegment.elapsed >= currentSegment.duration) {
            this.currentSegmentIndex++;
        }
    }

    updateDigitalTimerDisplay() {
        const currentSegment = this.segments[this.currentSegmentIndex];
        let remainingTime = 0;

        if (currentSegment) {
            remainingTime = currentSegment.duration - currentSegment.elapsed;
        };

        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.timerClock.innerText = formattedTime;
    }

    updatePauseButton(running) {
        if (!running) {
            this.pauseButton.innerHTML = '<i class="bi bi-caret-right-fill"></i>  Start'
            this.pauseButton.classList.remove("btn-warning")
            this.pauseButton.classList.add("btn-success")
        } else {
            this.pauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>  Pause'
            this.pauseButton.classList.remove("btn-success")
            this.pauseButton.classList.add("btn-warning")
        }
    }

    redraw() {
        this.timerDraw.drawPieChart(
            this.getElapsedSegmentRatios(),
            this.getSegmentRatios(),
            this.segments.map(seg => seg.color),
            this.currentSegmentIndex,
            this.segments.map(seg => seg.desc)
        );
        this.updateDigitalTimerDisplay();
    }

    reset() {
        accurateInterval.clear(this.timerInterval);
        this.isRunning = false;
        this.segments.forEach(seg => seg.elapsed = 0);
        this.currentSegmentIndex = 0;
        this.redraw();
        this.updatePauseButton(false);
        this.timerDraw.drawPauseSymbol();
    }

    getElapsedSegmentRatios() {
        let ratios = [];
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            let elapsed = 0;
            if (this.currentSegmentIndex === i) {
                elapsed = segment.elapsed
            } else if (i < this.currentSegmentIndex) {
                elapsed = segment.duration
            }
            ratios.push(elapsed / this.totalTime);
        }
        return ratios
    }

    getSegmentRatios() {
        let ratios = [];
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            ratios.push(segment.duration / this.totalTime);
        }
        return ratios
    }
}

class TimerDraw {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 20;
    }

    drawPauseSymbol() {
        const barWidth = 100;
        const barGap = 80;
        const pauseHeight = 300;

        // first bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.centerX - barWidth - barGap / 2, this.centerY - pauseHeight / 2, barWidth, pauseHeight);

        // second bar
        this.ctx.fillRect(this.centerX + barGap / 2, this.centerY - pauseHeight / 2, barWidth, pauseHeight);
    }


    drawPieSegment(startAngle, endAngle, color, outlineColor, transparency) {
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle - Math.PI/2, endAngle - Math.PI/2);
        this.ctx.closePath();
        if (transparency) {
            this.ctx.globalAlpha = transparency;
        }
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        if (outlineColor != null) {
            this.ctx.lineWidth = 10;
            this.ctx.strokeStyle = outlineColor;
            this.ctx.stroke();
        }
    }

    drawPieSegmentDesc(description, startAngle, endAngle) {
        if (description == null) return;
        const midAngle = (startAngle + endAngle) / 2;

        const textX = this.centerX + (this.radius / 1.7) * Math.cos(midAngle - Math.PI/2);
        const textY = this.centerY + (this.radius / 1.7) * Math.sin(midAngle - Math.PI/2);
        
        this.ctx.font = 'bold 50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.stroke

        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 8;
        this.ctx.strokeText(description, textX, textY);
        
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(description, textX, textY);
    }

    drawPieChart(elapsedSegmentRatios, segmentRatios, colors, currentSegmentIndex, descs) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let currentAngles = [null, null];

        // segments
        let startAngle = 0;
        segmentRatios.forEach((ratio, index) => {
            const endAngle = startAngle + 2 * Math.PI * ratio;
            this.drawPieSegment(startAngle, endAngle, colors[index]);
            if (index == currentSegmentIndex) {
                currentAngles = [startAngle, endAngle];
            }
            startAngle = endAngle;
        });

        let currentAnglesElapsed = [null, null];

        // elapsed white overlays
        startAngle = 0;
        elapsedSegmentRatios.forEach((ratio, index) => {
            const endAngle = startAngle + 2 * Math.PI * ratio;
            this.drawPieSegment(startAngle, endAngle, "#fff", null, 0.8);
            if (index == currentSegmentIndex) {
                currentAnglesElapsed = [startAngle, endAngle];
            }
            startAngle = endAngle;
        });

        // outlines
        this.drawPieSegment(currentAngles[0], currentAngles[1], "rgba(0,0,0,0)", "black");
        // this.drawPieSegment(currentAnglesElapsed[0], currentAnglesElapsed[1],  "rgba(0,0,0,0)", "black");

        // descriptions
        startAngle = 0;
        segmentRatios.forEach((ratio, index) => {
            const endAngle = startAngle + 2 * Math.PI * ratio;
            this.drawPieSegmentDesc(descs[index], startAngle, endAngle);
            startAngle = endAngle;
        });
    }
}

class SavedTimers {
    constructor (showTimerCallback) {
        this.showTimerCallback = showTimerCallback
        this.loadSavedTimers();
    }

    loadSavedTimers() {
        const storageTimers = JSON.parse(localStorage.getItem("savedTimers"));
        this.savedTimers = storageTimers !== null ? storageTimers : []
    }

    saveTimers(...newTimers) {
        this.savedTimers = [...this.savedTimers, ...newTimers]
        localStorage.setItem("savedTimers", JSON.stringify(this.savedTimers));
        this.drawSavedTimers();
    }
    
    deleteTimer(index) {
        this.savedTimers.splice(index, 1);
        localStorage.setItem("savedTimers", JSON.stringify(this.savedTimers));
        this.drawSavedTimers();
    }
    
    exportTimers() {
        const savedTimersJson = JSON.stringify(this.savedTimers);
        const blob = new Blob([savedTimersJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timers.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importTimers(event) {
        const fileReader = new FileReader();
        fileReader.onload = (function(event) {
            try {
                const newTimers = JSON.parse(event.target.result);
                this.saveTimers(...newTimers);
            } catch (e) {
                alert('Failed to import timers: ' + e.message);
            }
        }).bind(this);
        fileReader.readAsText(event.target.files[0]);
    }

    drawSavedTimers() {
        const savedTimersDiv = document.getElementById('savedTimers');
        if (this.savedTimers.length) {
            savedTimersDiv.innerHTML = '';
            this.savedTimers.forEach((timer, index) => {
                const timerContainer = document.createElement('div');
                timerContainer.className = 'timer-container';
    
                const loadButton = document.createElement('button');
                loadButton.className = 'btn btn-secondary timer-load-btn';
                loadButton.innerHTML = timer.title;
                loadButton.onclick = (() => {
                    this.showTimerCallback(timer.data);
                }).bind(this);
                timerContainer.appendChild(loadButton);
    
                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-danger';
                deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
                deleteButton.onclick = (() => {
                    this.deleteTimer(index);
                }).bind(this);
                timerContainer.appendChild(deleteButton);
    
                savedTimersDiv.appendChild(timerContainer);
            });
        } else {
            savedTimersDiv.innerHTML = '<span class="text-white">No timers created!</span>'
        }
    }
}

