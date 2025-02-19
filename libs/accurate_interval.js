var accurateInterval = { // Set of functions designed to create nearly perfect timers that do not drift
    timers: {}, // An object of timers by ID
    nextID: 0, // Next available timer reference ID
    set: (callback, interval) => { // Set a timer
        var expected = Date.now() + interval; // Expected currect time when timeout fires
        var ID = accurateInterval.nextID++; // Create reference to timer
        function step() { // Adjusts the timeout to account for any drift since last timeout
            callback(); // Call the callback
            var dt = Date.now() - expected; // The drift (ms) (positive for overshooting) comparing the expected time to the current time
            expected += interval; // Set the next expected currect time when timeout fires
            accurateInterval.timers[ID] = setTimeout(step, Math.max(0, interval - dt)); // Take into account drift
        }
        accurateInterval.timers[ID] = setTimeout(step, interval); // Return reference to timer
        return ID;
    },
    clear: (ID) => { // Clear & delete a timer by ID reference
        if (accurateInterval.timers[ID] != undefined) { // Preventing errors when trying to clear a timer that no longer exists
            // console.log('clear timer:', ID);
            // console.log('timers before:', accurateInterval.timers);
            for (const [key, value] of Object.entries(accurateInterval.timers)) {
                clearTimeout(value);
            }
            accurateInterval.timers = {};
            // console.log('timers after:', accurateInterval.timers);
        }
    }
}
