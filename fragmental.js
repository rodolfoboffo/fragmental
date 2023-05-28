class Complex {
    constructor(re=0.0, im=0.0) {
        this.re = re;
        this.im = im;
    }
};

class NewtonRhapsonMethod {
    constructor(epsilonToResult=1E-4, epsilonToDerivative=1E-9, maxIter=20) {
        this.epsilonToResult = epsilonToResult;
        this.epsilonToDerivative = epsilonToDerivative;
        this.maxIter = maxIter;
    }

    setFunc(f) {
        this.func = f;
    }

    iterate(v, steps=this.maxIter) {
        
    }
}

class NewtonBasins {
    constructor() {
        this.zoom = 1.0;
        this.offset = 0, 0;
        this.newtonRhapson = new NewtonRhapsonMethod();
    }

    setFunc(f) {
        this.NewtonRhapsonMethod.setFunc();
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
    n.setFunc(x => (x-new Complex(1))*(x-new Complex(-2)));
}

function redraw() {
    n.clear()
}

var n = new NewtonBasins();
var nrm = new NewtonRhapsonMethod();
nrm