// Kinetic Canvas - AI Hand Tracking Art Installation
// Human Augmentation Project

let handPose;
let video;
let hands = [];
let points = [];
let trailEffect = true;
let currentColor = 'cyan';
let hueValue = 0;

// Color palette
const colors = {
    cyan: [0, 255, 200],
    magenta: [255, 0, 200],
    yellow: [255, 255, 0],
    green: [0, 255, 100],
    rainbow: null // Special case handled in draw
};

function preload() {
    // Load the AI hand tracking model
    try {
        handPose = ml5.handPose();
        console.log('ml5.handPose model loaded');
    } catch (error) {
        console.error('Error loading handPose model:', error);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    // Update status
    updateStatus('Requesting camera access...');

    // Initialize video capture with error handling
    try {
        video = createCapture(VIDEO, videoReady);
        video.size(640, 480);
        video.hide();
        console.log('Video capture initialized');
    } catch (error) {
        console.error('Error initializing video:', error);
        updateStatus('Error: Could not access camera. Please allow camera permissions.');
    }

    // Setup UI controls
    setupControls();
}

function videoReady() {
    console.log('Video is ready');
    updateStatus('Camera ready! Loading AI model...');

    // Start hand detection once video is ready
    try {
        handPose.detectStart(video, gotHands);
        updateStatus('Ready! Show your hand to the camera');
        console.log('Hand detection started');
    } catch (error) {
        console.error('Error starting hand detection:', error);
        updateStatus('Error: Could not start hand tracking');
    }
}

function draw() {
    // Create trailing effect or clear background
    if (trailEffect) {
        background(0, 20); // Fading trail
    } else {
        background(0); // Solid background
    }
    
    // Draw all detected hands
    if (hands.length > 0) {
        updateStatus(`Tracking ${hands.length} hand(s) - Creating art!`);
        
        for (let hand of hands) {
            // Get the index finger tip (keypoint 8 in MediaPipe hand model)
            let indexFinger = hand.keypoints[8];
            
            if (indexFinger) {
                // Map video coordinates to canvas (flip horizontally for mirror effect)
                let x = map(indexFinger.x, 0, 640, width, 0);
                let y = map(indexFinger.y, 0, 480, 0, height);
                
                // Store point for potential line drawing
                points.push({x: x, y: y, color: getCurrentColor()});
                
                // Limit points array to prevent memory issues
                if (points.length > 1000) {
                    points.shift();
                }
                
                // Draw the brush stroke
                drawBrush(x, y);
                
                // Optional: Draw hand skeleton for debugging
                // drawHandSkeleton(hand);
            }
        }
    } else {
        updateStatus('No hands detected - Point your hand at the camera');
    }
    
    // Draw connected lines between recent points
    drawConnectedLines();
    
    // Update rainbow hue
    hueValue = (hueValue + 1) % 360;
}

function drawBrush(x, y) {
    let col = getCurrentColor();
    
    // Outer glow
    noStroke();
    fill(col[0], col[1], col[2], 50);
    ellipse(x, y, 40, 40);
    
    // Middle glow
    fill(col[0], col[1], col[2], 100);
    ellipse(x, y, 25, 25);
    
    // Core
    fill(col[0], col[1], col[2], 255);
    ellipse(x, y, 15, 15);
}

function drawConnectedLines() {
    if (points.length < 2) return;
    
    // Draw lines connecting recent points
    for (let i = points.length - 1; i > Math.max(0, points.length - 20); i--) {
        if (i > 0) {
            let p1 = points[i];
            let p2 = points[i - 1];
            
            stroke(p1.color[0], p1.color[1], p1.color[2], 100);
            strokeWeight(3);
            line(p1.x, p1.y, p2.x, p2.y);
        }
    }
}

function getCurrentColor() {
    if (currentColor === 'rainbow') {
        colorMode(HSB);
        let col = color(hueValue, 100, 100);
        colorMode(RGB);
        return [red(col), green(col), blue(col)];
    }
    return colors[currentColor];
}

function gotHands(results) {
    hands = results;
}

function setupControls() {
    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
        points = [];
        background(0);
    });

    // Toggle trail effect
    document.getElementById('toggleTrailBtn').addEventListener('click', () => {
        trailEffect = !trailEffect;
    });

    // Toggle video visibility (for debugging)
    document.getElementById('toggleVideoBtn').addEventListener('click', () => {
        if (video) {
            if (video.elt.style.display === 'none') {
                video.show();
                video.position(20, windowHeight - 500);
                video.style('border', '2px solid #00ffc8');
                video.style('border-radius', '10px');
            } else {
                video.hide();
            }
        }
    });

    // Color picker
    document.getElementById('colorPicker').addEventListener('change', (e) => {
        currentColor = e.target.value;
    });
}

function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

