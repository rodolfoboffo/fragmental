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
        this.maxIter = options && options.maxIter || 200;
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
        this.zoom = options && options.zoom || 1.0E-1;
        this.center = options && options.center || new Complex(-3.0, 2.0);
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

    setFunction(f) {
        this.newtonRhapson.function = f;
        this.roots = [];
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.initialize(this.canvas);
    }

    initialize(canvas) {
        this.ctx = null;
        if (canvas != null)
            this.ctx = canvas.getContext("2d");
            this.imageArray = new Array(canvas.width);
            for (let col = 0; col < canvas.width; col++) {
                this.imageArray[col] = new Array(canvas.height);
            }
    }

    clear() {
        if (this.ctx != null) {
            this.ctx.reset();
        }
    }

    getComplexCoordFromPixel(col, row, width, height, zoom, center) {
        let step = 1.0 / zoom;
        let cornerRe = center.re - (width * step) / 2;
        let cornerIm = center.im - (height * step) / 2;
        let re = cornerRe + col * step;
        let im = cornerIm + (height-row) * step;
        return new Complex(re, im);
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

    calculateBasins() {
        this.roots = [];
        let [width, height] = [this.ctx.canvas.width, this.ctx.canvas.height]
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < height; row++) {
                let initGuess = this.getComplexCoordFromPixel(col, row, width, height, this.zoom, this.center);
                let [root, stepsTaken] = this.newtonRhapson.iterate(initGuess);
                let rootIndex = this.upsertRootIndex(root, this.roots, this.epsilonToRoots);
                this.imageArray[col][row] = {steps: stepsTaken, rootIndex:rootIndex};
            }
        }
    }

    createImageData() {
        let [width, height] = [this.ctx.canvas.width, this.ctx.canvas.height]
        let imgData = this.ctx.createImageData(width, height);
        let bytesPerPixel = 4;
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < height; row++) {
                let rootIndex = this.imageArray[col][row].rootIndex;
                let color = [0, 0, 0, 255];
                if (rootIndex != null) {
                    let [colorStart, colorStop] = this.colors[rootIndex];
                    let gradient = this.imageArray[col][row].steps / this.newtonRhapson.maxIter;
                    for (let k = 0; k < 4; k++) {
                        color[k] = colorStart[k] + (colorStop[k] - colorStart[k]) * gradient;
                    }
                }
                for (let k = 0; k < 4; k++) {
                    imgData.data[row * (width * bytesPerPixel) + col * bytesPerPixel + k] = color[k];
                }
            }
        }
        return imgData;
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
    }
};

function main(canvasName) {
    let canvas = document.getElementById(canvasName)
    n.setCanvas(canvas);
    n.setFunction((x => (x.minus(new Complex(1.0))).multiply(x.minus(new Complex(-2.0))).multiply(x.minus(new Complex(-3.0, 2.0)))));
}

function redraw() {
    n.redraw();
}

var n = new NewtonBasins();
// var nrm = new NewtonRhapsonMethod();
// let f = x => (x.minus(new Complex(1))).multiply(x.minus(new Complex(-2)));
// console.log(f(new Complex(3, 2)))
// nrm.setFunction(f);
// const [root, nSteps] = nrm.iterate(new Complex(36, 5));
// console.log(root);