/*
 * reveal_midi.js
 * MIDI control plugin for reveal.js (http://lab.hakim.se/reveal-js)
 * MIT licensed
 *
 * Copyright (C) 2015 aike, http://github.com/aike
 */

(function() {
	var mode = 0;	// 0: note_on:left, note_off:right
					// 1: note_on and even note_no:left, note_on and odd note_no:right
					// mode 0 for iOS App "Web MIDI Browser" default page
					// mode 1 for MIDI Keyboards

	var sendActiveSensing = true;
					// send Active Sensing message(0xFE) to every 1000msec
					// for connection check

	var midi = null;
	var inputs = [];
	var outputs = [];

	navigator.requestMIDIAccess().then(onMidiSuccess, onMidiFailure);

	function onMidiSuccess(m){
		midi = m;
		var it = midi.inputs.values();
		for(var o = it.next(); !o.done; o = it.next()){
			inputs.push(o.value);
		}

		it = midi.outputs.values();
		for(o = it.next(); !o.done; o = it.next()){
			if (o.value.name.match(/bluetooth/i)) {
				outputs.push(o.value);
			}
		}

		for(var i = 0; i < inputs.length; i++){
			if (mode === 0) {
				inputs[i].onmidimessage = onMidiEvent0;
			} else {
				inputs[i].onmidimessage = onMidiEvent1;
			}
		}
	}

	function onMidiFailure(msg){
		console.log("Midi Failure: " + msg);
	}

	function onMidiEvent0(event){
		if (event.data.length >= 3) {
			var note_no = event.data[1];
			if ((event.data[0] & 0xF0) === 0x90) {
				var velocity = event.data[2];
				if (velocity > 0) {
					// note on
					Reveal.left();
				} else {
					// note off
					Reveal.right();
				}
			} else if ((event.data[0] & 0xF0) === 0x80) {
				// note off
				Reveal.right();
			}
		}
	}

	function onMidiEvent1(event){
		if (event.data.length >= 3) {
			var note_no = event.data[1];
			if ((event.data[0] & 0xF0) === 0x90) {
				var velocity = event.data[2];
				if (velocity > 0) {
					// note on
					if (note_no % 2 === 0) {
						Reveal.left();
					} else {
						Reveal.right();
					}
				}
			}
		}
	}

	function activeSensing() {
		for (var i = 0; i < outputs.length; i++) {
			outputs[i].send([0xFE] , window.performance.now());
		}
	}

	if (sendActiveSensing) {
		setInterval(activeSensing, 1000);
	} 

})();