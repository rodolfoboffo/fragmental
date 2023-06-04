class Complex {
    constructor(re=0.0, im=0.0) {
        this.re = re;
        this.im = im;
    }

    minus(c2) {
        return new Complex(this.re - c2.re, this.im - c2.im);
    }

    plus(c2) {
        return new Complex(this.re + c2.re, this.im + c2.im);
    }

    multiply(c2) {
        return new Complex(this.re*c2.re - this.im*c2.im, this.re*c2.im + this.im*c2.re);
    }

    divide(c2) {
        return new Complex((this.re*c2.re + this.im*c2.im)/(c2.re*c2.re + c2.im*c2.im), (this.im*c2.re - this.re*c2.im)/(c2.re*c2.re + c2.im*c2.im));
    }

    negate() {
        return new Complex(-this.re, -this.im);
    }

    norm() {
        return Math.sqrt(Math.pow(this.re, 2) + Math.pow(this.im, 2))
    }

    static random(length=1) {
        let c = new Complex(Math.random()-0.5, Math.random()-0.5)
        let norm = c.norm();
        let unitC = new Complex(c.re*length/norm, c.im*length/norm);
        return unitC;
    }

};

class NewtonRhapsonMethod {
    constructor(options) {
        this.epsilonToResult = options && options.epsilonToResult || 1E-8;
        this.epsilonToDerivative = options && options.epsilonToDerivative || 1E-12;
        this.maxIter = options && options.maxIter || 20;
        this.function = options && options.func || null;
    }

    setFunction(f) {
        this.function = f;
    }

    iterate(initialGuess, steps=this.maxIter) {
        let fInitGuess = this.function(initialGuess);
        let initGuessPlusEps = initialGuess.plus(Complex.random(length=this.epsilonToDerivative));
        let finitGuessPlusEps = this.function(initGuessPlusEps);
        let l = fInitGuess.negate().divide(finitGuessPlusEps.minus(fInitGuess))
        let newGuess = initialGuess.plus(l.multiply(initGuessPlusEps.minus(initialGuess)))
        let fNewGuess = this.function(newGuess);
        let satisfies = fNewGuess.norm() <= this.epsilonToResult
        if (satisfies) {
            return [newGuess, steps];
        }
        else if (steps > 0) {
            return this.iterate(newGuess, steps-1);
        }
        else {
            return [null, null];
        }
    }
}

class NewtonBasins {
    constructor(options) {
        this.zoom = options && options.zoom || 100;
        this.quality = options && options.quality || 0.2;
        this.center = options && options.center || new Complex();
        this.newtonRhapson = new NewtonRhapsonMethod();
        this.epsilonToRoots = options && options.epsilonToRoots || 1E-5;
        this.colors = [
                        [[255, 164, 164, 255], [217, 0, 0, 255]], // [210, 0, 0, 255], 
                        [[255, 203, 164, 255], [240, 102, 0, 255]], // [232, 99, 0, 255]
                        [[255, 245, 193, 255], [255, 219, 17, 255]], 
                        [[197, 255, 145, 255], [94, 198, 0, 255]]
                    ];
        this.roots = [];
        this.imageArray = null;
    }

    centerInPixel(col, row) {
        let newCenter = this.getComplexCoordFromPixel(col, row);
        this.center = newCenter;
        this.clearImageArray();
        this.redraw();
    }

    setZoom(rate) {
        this.zoom = 1 + 1000 * rate;
        this.clearImageArray();
        this.redraw();
    }

    setQuality(quality) {
        this.quality = quality;
        this.redraw();
    }

    setFunction(f) {
        this.newtonRhapson.function = f;
        this.roots = [];
        this.clearImageArray();
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.initializeContext(this.canvas);
        this.clearImageArray();
    }

    initializeContext(canvas) {
        this.ctx = null;
        if (canvas != null)
            this.ctx = canvas.getContext("2d");
    }

    clearImageArray() {
        if (this.ctx != null) {
            let [width, height] = [this.ctx.canvas.width, this.ctx.canvas.height];
            this.imageArray = new Array(width);
            for (let col = 0; col < width; col++) {
                this.imageArray[col] = new Array(height);
            }
        }
    }

    clear() {
        if (this.ctx != null) {
            this.ctx.reset();
        }
    }

    getComplexCoordFromPixel(col, row) {
        let step = 1.0 / this.zoom;
        let cornerRe = this.center.re - (this.ctx.canvas.width * step) / 2;
        let cornerIm = this.center.im - (this.ctx.canvas.height * step) / 2;
        let re = cornerRe + col * step;
        let im = cornerIm + (this.ctx.canvas.height-row) * step;
        return new Complex(re, im);
    }

    getPixelFromComplexCoord(c) {
        let step = 1.0 / this.zoom;
        let cornerRe = this.center.re - (this.ctx.canvas.width * step) / 2;
        let cornerIm = this.center.im - (this.ctx.canvas.height * step) / 2;
        let col = Math.floor((c.re - cornerRe) / step);
        let row = this.ctx.canvas.height - Math.floor((c.im - cornerIm) / step);
        return [row, col];
    }

    upsertRootIndex(newRoot, roots, epsToCompare) {
        if (newRoot == null)
            return null;
        for (let i = 0; i < roots.length; i++) {
            let distance = newRoot.minus(roots[i].root).norm();
            if (distance <= 2*epsToCompare) {
                return i;
            }
        }
        roots.push({root:newRoot});
        return roots.length - 1;
    }

    getPixelCoordByQuality(i, j, width, height, quality) {
        let widthDivs = Math.max(Math.ceil(width * quality), 1);
        let wDivLength = Math.floor(width / widthDivs);
        let qi = Math.floor(i / wDivLength) * wDivLength;
        let heightDivs = Math.max(Math.ceil(height * quality), 1);
        let hDivLength = Math.floor(height / heightDivs);
        let qj = Math.floor(j / hDivLength) * hDivLength;
        return [qi, qj];
    }

    calculateBasins() {
        let [width, height] = [this.ctx.canvas.width, this.ctx.canvas.height];
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < height; row++) {
                let [qCol, qRow] = this.getPixelCoordByQuality(col, row, width, height, this.quality);
                if (this.imageArray[qCol][qRow] == null) {
                    let initGuess = this.getComplexCoordFromPixel(qCol, qRow);
                    let [root, stepsTaken] = this.newtonRhapson.iterate(initGuess);
                    let rootIndex = this.upsertRootIndex(root, this.roots, this.epsilonToRoots);
                    this.imageArray[qCol][qRow] = {steps: stepsTaken, rootIndex:rootIndex};
                }
            }
        }
    }

    createImageData() {
        let [width, height] = [this.ctx.canvas.width, this.ctx.canvas.height]
        let imgData = this.ctx.createImageData(width, height);
        let bytesPerPixel = 4;
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < height; row++) {
                let [qCol, qRow] = this.getPixelCoordByQuality(col, row, width, height, this.quality);
                let rootIndex = this.imageArray[qCol][qRow].rootIndex;
                let color = [0, 0, 0, 255];
                if (rootIndex != null) {
                    let [colorStart, colorStop] = this.colors[rootIndex];
                    let gradient = this.imageArray[qCol][qRow].steps / this.newtonRhapson.maxIter;
                    for (let k = 0; k < 4; k++) {
                        color[k] = colorStop[k] + (colorStart[k] - colorStop[k]) * gradient;
                    }
                }
                for (let k = 0; k < 4; k++) {
                    imgData.data[row * (width * bytesPerPixel) + col * bytesPerPixel + k] = color[k];
                }
            }
        }
        return imgData;
    }

    circleRoots() {
        if (this.ctx == null)
            return;
        let [width, height] = [this.ctx.canvas.width, this.ctx.canvas.height]
        for (let i =0; i < this.roots.length; i++) {
            let rootObj = this.roots[i];
            let [row, col] = this.getPixelFromComplexCoord(rootObj.root);
            this.ctx.fillStyle = 'white'
            this.ctx.beginPath();
            this.ctx.arc(col, row, 5, 0, 2 * Math.PI);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    flush(imgData) {
        this.ctx.putImageData(imgData, 0, 0);
    }

    redraw() {
        if (this.ctx == null || this.newtonRhapson.function == null)
            return;
        this.calculateBasins();
        let imgData = this.createImageData();
        this.flush(imgData);
        this.circleRoots();
    }
};

function initialize() {
    let canvas = document.getElementById('canvas-app')
    setupListeners()
    initializeParameters()
    resizeCanvas(canvas)
    n.setCanvas(canvas);
    n.setFunction((x => (x.minus(new Complex(1.0))).multiply(x.minus(new Complex(-2.0))).multiply(x.minus(new Complex(-3.0, 2.0)))));
}

function setupListeners() {
    let redrawButton = document.getElementById('button-redraw')
    if (redrawButton != null) {
        redrawButton.addEventListener("click", redraw);
    }

    let qualityRange = document.getElementById('range-quality')
    if (qualityRange != null) {
        qualityRange.addEventListener("change", updateQualityFromEvent);
    }

    let zoomRange = document.getElementById('range-zoom')
    if (zoomRange != null) {
        zoomRange.addEventListener("change", updateZoomFromEvent);
    }

    let canvas = document.getElementById('canvas-app')
    if (canvas != null) {
        canvas.addEventListener("wheel", onWheelCanvas);
        canvas.addEventListener("dblclick", onMouseDownCanvas);
    }
}

function onMouseDownCanvas(e) {
    e.preventDefault();
    n.centerInPixel(e.x, e.y);
}

function onWheelCanvas(e) {
    let el = document.getElementById('range-zoom');
    if (el != null) {
        let zoomIncr = e.deltaY >= 0 ? 1 : -1;
        let currentValue = parseInt(el.value)
        let minValue = parseInt(el.min)
        let maxValue = parseInt(el.max)
        let newValue = Math.min(Math.max(currentValue - zoomIncr * 10, minValue), maxValue);
        el.value = newValue.toString();
        el.dispatchEvent(new Event("change"));
    }
}

function redraw(e) {
    n.redraw();
}

function initializeParameters() {
    updateQuality();
    updateZoom();
}

function updateQuality() {
    let qualityRange = document.getElementById('range-quality');
    if (qualityRange != null) {
        updateQualityFromElement(qualityRange);
    }
}

function updateQualityFromEvent(e) {
    updateQualityFromElement(e.srcElement);
}

function updateQualityFromElement(el) {
    let max = parseInt(el.max);
    let value = parseInt(el.value);
    let rate = value / max;
    n.setQuality(rate);
}

function updateZoom() {
    let el = document.getElementById('range-zoom');
    if (el != null) {
        updateZoomFromElement(el);
    }
}

function updateZoomFromEvent(e) {
    updateZoomFromElement(e.srcElement);
}

function updateZoomFromElement(el) {
    let max = parseInt(el.max);
    let value = parseInt(el.value);
    let rate = value / max;
    n.setZoom(rate);
}

function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

var n = new NewtonBasins();