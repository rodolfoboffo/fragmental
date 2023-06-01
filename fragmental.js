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
    constructor(epsilonToResult=1E-8, epsilonToDerivative=1E-12, maxIter=200, func=null) {
        this.epsilonToResult = epsilonToResult;
        this.epsilonToDerivative = epsilonToDerivative;
        this.maxIter = maxIter;
        this.func = func;
    }

    setFunc(f) {
        this.func = f;
    }

    iterate(initialGuess, steps=this.maxIter) {
        let fInitGuess = this.func(initialGuess);
        let initGuessPlusEps = initialGuess.plus(Complex.random(length=this.epsilonToDerivative));
        let finitGuessPlusEps = this.func(initGuessPlusEps);
        let l = fInitGuess.negate().divide(finitGuessPlusEps.minus(fInitGuess))
        let newGuess = initialGuess.plus(l.multiply(initGuessPlusEps.minus(initialGuess)))
        let fNewGuess = this.func(newGuess);
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
    constructor() {
        this.zoom = 1.0;
        this.offset = 0, 0;
        this.newtonRhapson = new NewtonRhapsonMethod();
    }

    setFunc(f) {
        this.newtonRhapson.setFunc();
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.initialize(this.canvas);
    }

    initialize(canvas) {
        this.ctx = null;
        if (canvas != null)
            this.ctx = canvas.getContext("2d");
    }

    clear() {
        if (this.ctx != null) {
            this.ctx.reset();
        }
    }
};

function main(canvasName) {
    let canvas = document.getElementById(canvasName)
    n.setCanvas(canvas);
    n.setFunc(x => (x.minus(new Complex(1))).multiply(x.minus(new Complex(-2))));
}

function redraw() {
    n.clear()
}

var n = new NewtonBasins();
var nrm = new NewtonRhapsonMethod();
let f = x => (x.minus(new Complex(1))).multiply(x.minus(new Complex(-2)));
//console.log(f(new Complex(3, 2)))
nrm.setFunc(f);
const [root, nSteps] = nrm.iterate(new Complex(36, 5));
console.log(root);