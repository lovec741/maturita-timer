var perfectTimer = {                                                              // Set of functions designed to create nearly perfect timers that do not drift
    timers: {},                                                                     // An object of timers by ID
  nextID: 0,                                                                      // Next available timer reference ID
  set: (callback, interval) => {                                                  // Set a timer
    var expected = Date.now() + interval;                                         // Expected currect time when timeout fires
    var ID = perfectTimer.nextID++;                                               // Create reference to timer
    function step() {                                                             // Adjusts the timeout to account for any drift since last timeout
      callback();                                                                 // Call the callback
      var dt = Date.now() - expected;                                             // The drift (ms) (positive for overshooting) comparing the expected time to the current time
      expected += interval;                                                       // Set the next expected currect time when timeout fires
      perfectTimer.timers[ID] = setTimeout(step, Math.max(0, interval - dt));     // Take into account drift
    }
    perfectTimer.timers[ID] = setTimeout(step, interval);                         // Return reference to timer
    return ID;
  },
  clear: (ID) => {                                                                // Clear & delete a timer by ID reference
    if (perfectTimer.timers[ID] != undefined) {                                   // Preventing errors when trying to clear a timer that no longer exists
      console.log('clear timer:', ID);
      console.log('timers before:', perfectTimer.timers);
      for (const [key, value] of Object.entries(perfectTimer.timers)) {
        clearTimeout(value);
      }
      perfectTimer.timers = {};
      console.log('timers after:', perfectTimer.timers);
    }
    }       
}

class Timer {
    constructor(segments, updateCallback, drawButtonCallback) {
        this.segments = segments.map(seg => ({
            ...seg,
            duration: Math.round(parseFloat(seg.duration.toString().replace(",", ".")) * 60), // Convert minutes to seconds
            elapsed: 0,
        }));
        this.totalTime = this.segments.reduce((total, seg) => total + seg.duration, 0);
        this.currentSegmentIndex = 0;
        this.isRunning = false;
        this.timerInterval = null;
        this.updateCallback = updateCallback;
        this.drawButtonCallback = drawButtonCallback;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTime = Date.now();
        this.update()
        if (this.timerInterval !== null)
            perfectTimer.clear(this.timerInterval)
        console.log("creating timer")
        this.timerInterval = perfectTimer.set(() => {this.update()}, 1000);
    }

    update() {
        if (!this.isRunning) return;
        console.log(Date.now() - this.startTime)
        if (this.currentSegmentIndex >= this.segments.length) {
            this.redraw()
            this.reset();
            this.drawButtonCallback(true);
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

        document.getElementById('digitalTimer').innerText = formattedTime;
    }

    redraw() {
        this.updateCallback(this.getSegmentRatios());
        this.updateDigitalTimerDisplay();
    }

    pause() {
        drawPauseSymbol();
        perfectTimer.clear(this.timerInterval);
        this.isRunning = false;
    }

    reset() {
        perfectTimer.clear(this.timerInterval);
        this.isRunning = false;
        this.segments.forEach(seg => seg.elapsed = 0);
        this.currentSegmentIndex = 0;
    }

    getSegmentRatios() {
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
    getFullSegmentRatios() {
        let ratios = [];
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            ratios.push(segment.duration / this.totalTime);
        }
        return ratios
    }
}

function drawPieSegment(ctx, centerX, centerY, radius, startAngle, endAngle, color, outlineColor, transparency) {
    // Set styles and draw the segment
    ctx.lineJoin = 'round';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle - Math.PI/2, endAngle - Math.PI/2);
    ctx.closePath();
    if (transparency) {
        ctx.globalAlpha = transparency;
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    if (outlineColor != undefined) {
        ctx.lineWidth = 10;
        ctx.strokeStyle = outlineColor;
        ctx.stroke();
    }
}

function drawPieSegmentDesc(ctx, description, centerX, centerY, radius, startAngle, endAngle) {
    if (description == undefined) return;
    // Calculate the middle angle of the segment
    const midAngle = (startAngle + endAngle) / 2;

    // Calculate the position for the text
    const textX = centerX + (radius / 2) * Math.cos(midAngle - Math.PI/2);
    const textY = centerY + (radius / 2) * Math.sin(midAngle - Math.PI/2);
    
    ctx.font = 'bold 50px Arial'; // You can change the font as needed
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.stroke

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 8; // Width of the outline
    ctx.strokeText(description, textX, textY);
    
    // Draw the text fill
    ctx.fillStyle = 'black'; // You can change the color as needed
    ctx.fillText(description, textX, textY);

    // const textMetrics = ctx.measureText(description);
    // const textWidth = textMetrics.width;
    // const textHeight = 30; // Approximate height based on font size

    // // Draw a white rectangle behind the text
    // ctx.fillStyle = 'white';
    // ctx.fillRect(textX - textWidth / 2 - 5, textY - textHeight / 2 - 10, textWidth + 10, textHeight + 15);

    // // Draw the description text
    // ctx.fillStyle = 'black'; // You can change the color as needed
    // ctx.fillText(description, textX, textY);
}


function drawPieChart(canvasId, segmentRatios, fullSegmentRatios, colors, currentSegmentIndex, descs) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let currentAngles = [null, null];
    // Draw all segments in a lighter color
    let startAngle = 0;
    fullSegmentRatios.forEach((ratio, index) => {
        const endAngle = startAngle + 2 * Math.PI * ratio;
        if (index == currentSegmentIndex) {
            currentAngles = [startAngle, endAngle];
        } else {
            drawPieSegment(ctx, centerX, centerY, radius, startAngle, endAngle, colors[index]);
        }
        startAngle = endAngle;
    });
    drawPieSegment(ctx, centerX, centerY, radius, currentAngles[0], currentAngles[1], colors[currentSegmentIndex], "black");


    let currentAnglesElapsed = [null, null];

    // Draw elapsed time segments in their original colors
    startAngle = 0;
    segmentRatios.forEach((ratio, index) => {
        const endAngle = startAngle + 2 * Math.PI * ratio;
        if (index == currentSegmentIndex) {
            currentAnglesElapsed = [startAngle, endAngle];
        } else {
            drawPieSegment(ctx, centerX, centerY, radius, startAngle, endAngle, "#fff", undefined, 0.4+ratio/fullSegmentRatios[index]/2);
        }
        startAngle = endAngle;
    });
    drawPieSegment(ctx, centerX, centerY, radius, currentAnglesElapsed[0], currentAnglesElapsed[1], "#fff", "black", 0.4+segmentRatios[currentSegmentIndex]/fullSegmentRatios[currentSegmentIndex]/2);

    currentAngles = [null, null];
    // Draw all segments descriptions
    startAngle = 0;
    fullSegmentRatios.forEach((ratio, index) => {
        const endAngle = startAngle + 2 * Math.PI * ratio;
        if (index == currentSegmentIndex) {
            currentAngles = [startAngle, endAngle];
        } else {
            drawPieSegmentDesc(ctx, descs[index], centerX, centerY, radius, startAngle, endAngle);
        }
        startAngle = endAngle;
    });
    drawPieSegmentDesc(ctx, descs[currentSegmentIndex], centerX, centerY, radius, currentAngles[0], currentAngles[1]);

}

function lightenColor(color, percent) {
    // Parse the color and increase its lightness by the given percent
    let {r, g, b} = hexToRgb(color);
    r = Math.round(r * percent + 255 * (1 - percent));
    g = Math.round(g * percent + 255 * (1 - percent));
    b = Math.round(b * percent + 255 * (1 - percent));
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    // Convert hex color to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function saveTimer(timer) {
    const savedTimers = getSavedTimers();
    savedTimers.push(timer);
    localStorage.setItem("savedTimers", JSON.stringify(savedTimers));
    // document.cookie = `savedTimers=${JSON.stringify(savedTimers)};path=/;expires=Tue, 19 Jan 2038 03:14:07 UTC;`;
}

function loadSavedTimers() {
    const savedTimers = getSavedTimers();
    const savedTimersDiv = document.getElementById('savedTimers');
    if (savedTimers.length) {
        savedTimersDiv.innerHTML = '';
        savedTimers.forEach((timer, index) => {
            // Timer container with flex layout
            const timerContainer = document.createElement('div');
            timerContainer.className = 'timer-container';

            // Create the load button with flex-grow
            const loadButton = document.createElement('button');
            loadButton.className = 'btn btn-secondary timer-load-btn';
            loadButton.innerHTML = timer.title;
            loadButton.onclick = () => loadTimer(timer.data);
            timerContainer.appendChild(loadButton);

            // Create the delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger';
            deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
            deleteButton.onclick = () => deleteTimer(index);
            timerContainer.appendChild(deleteButton);

            savedTimersDiv.appendChild(timerContainer);
        });
    } else {
        savedTimersDiv.innerHTML = '<span>No timers created!</span>'
    }

}

function getSavedTimers() {
    const storageTimers = JSON.parse(localStorage.getItem("savedTimers"));
    return storageTimers !== null ? storageTimers : []
    // const cookies = document.cookie.split('; ');
    // const savedTimerCookie = cookies.find(row => row.startsWith('savedTimers'));
    // return savedTimerCookie ? JSON.parse(savedTimerCookie.split('=')[1]) : [];
}

function deleteTimer(index) {
    let savedTimers = getSavedTimers();
    savedTimers.splice(index, 1); // Remove the timer at the specified index
    localStorage.setItem("savedTimers", JSON.stringify(savedTimers));
    // document.cookie = `savedTimers=${JSON.stringify(savedTimers)};path=/;expires=Tue, 19 Jan 2038 03:14:07 UTC;`; // Update the cookie
    loadSavedTimers(); // Refresh the saved timers display
}

function drawPauseSymbol() {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const barWidth = 100; // Width of each bar in the pause symbol
    const barGap = 80; // Gap between the two bars
    const pauseHeight = 300; // Height of the pause symbol

    // Draw first bar of the pause symbol
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black
    ctx.fillRect(centerX - barWidth - barGap / 2, centerY - pauseHeight / 2, barWidth, pauseHeight);

    // Draw second bar of the pause symbol
    ctx.fillRect(centerX + barGap / 2, centerY - pauseHeight / 2, barWidth, pauseHeight);
}
