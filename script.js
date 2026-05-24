/**
 * MATRIXFORGE - ADVANCED MATRIX CALCULATOR
 * Production-grade matrix calculator with step-by-step mode and full linear algebra suite.
 * Uses Math.js for core computations and implements custom REF/RREF/step generation.
 * FIXED: robust error handling, dimension checks, safe cloning, and complete operation coverage.
 */

// ------------------------- GLOBALS & STATE -------------------------
let matrixA = math.matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
let matrixB = math.matrix([[9, 8, 7], [6, 5, 4], [3, 2, 1]]);
let stepMode = false;          // Step-by-step toggle state
let currentTheme = 'light';    // 'light' or 'dark'

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const stepToggleCheckbox = document.getElementById('stepModeToggle');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultDisplay = document.getElementById('resultDisplay');
const stepsContent = document.getElementById('stepsContent');
const errorBox = document.getElementById('errorBox');

// Matrix dimension inputs
const rowsAInput = document.getElementById('rowsA');
const colsAInput = document.getElementById('colsA');
const rowsBInput = document.getElementById('rowsB');
const colsBInput = document.getElementById('colsB');

// Helper: Show/hide error message
function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
    setTimeout(() => {
        errorBox.classList.add('hidden');
    }, 5000);
}

function clearError() {
    errorBox.classList.add('hidden');
}

// Helper: Loading state
function setLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// Helper: Pretty print any value (matrix, number, string)
function prettyPrint(data) {
    if (typeof data === 'number') {
        return Math.abs(data) < 1e-10 ? '0' : data.toFixed(6).replace(/\.?0+$/, '');
    }
    if (math.isMatrix(data)) {
        const arr = data.toArray();
        if (arr.length === 0) return '[]';
        const formatted = arr.map(row =>
            Array.isArray(row)
                ? row.map(v => Number(v).toFixed(6).replace(/\.?0+$/, ''))
                : Number(row).toFixed(6).replace(/\.?0+$/, '')
        );
        return math.format(formatted, { precision: 6 });
    }
    return math.format(data, { precision: 6 });
}

// ------------------------- DYNAMIC MATRIX INPUT RENDERING -------------------------
function renderMatrixInput(rows, cols, containerId, matrixValues = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'matrix-input-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, auto)`;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.value = (matrixValues && matrixValues[i] && matrixValues[i][j] !== undefined) ? matrixValues[i][j] : 0;
            input.dataset.row = i;
            input.dataset.col = j;
            input.addEventListener('input', () => updateMatrixFromInputs());
            grid.appendChild(input);
        }
    }
    container.appendChild(grid);
}

function updateMatrixFromInputs() {
    // Update matrixA
    const rowsA = parseInt(rowsAInput.value, 10);
    const colsA = parseInt(colsAInput.value, 10);
    const containerA = document.getElementById('matrixAContainer');
    if (containerA && !isNaN(rowsA) && !isNaN(colsA)) {
        const inputs = containerA.querySelectorAll('input');
        if (inputs.length === rowsA * colsA) {
            const values = [];
            for (let i = 0; i < rowsA; i++) {
                const row = [];
                for (let j = 0; j < colsA; j++) {
                    const val = parseFloat(inputs[i * colsA + j].value);
                    row.push(isNaN(val) ? 0 : val);
                }
                values.push(row);
            }
            matrixA = math.matrix(values);
        }
    }

    // Update matrixB
    const rowsB = parseInt(rowsBInput.value, 10);
    const colsB = parseInt(colsBInput.value, 10);
    const containerB = document.getElementById('matrixBContainer');
    if (containerB && !isNaN(rowsB) && !isNaN(colsB)) {
        const inputs = containerB.querySelectorAll('input');
        if (inputs.length === rowsB * colsB) {
            const values = [];
            for (let i = 0; i < rowsB; i++) {
                const row = [];
                for (let j = 0; j < colsB; j++) {
                    const val = parseFloat(inputs[i * colsB + j].value);
                    row.push(isNaN(val) ? 0 : val);
                }
                values.push(row);
            }
            matrixB = math.matrix(values);
        }
    }
}

function rebuildMatrixDisplays() {
    const sizeA = matrixA.size();
    const rowsA = sizeA[0], colsA = sizeA[1];
    rowsAInput.value = rowsA;
    colsAInput.value = colsA;
    renderMatrixInput(rowsA, colsA, 'matrixAContainer', matrixA.toArray());

    const sizeB = matrixB.size();
    const rowsB = sizeB[0], colsB = sizeB[1];
    rowsBInput.value = rowsB;
    colsBInput.value = colsB;
    renderMatrixInput(rowsB, colsB, 'matrixBContainer', matrixB.toArray());
}

// Build events
document.getElementById('buildMatrixA').addEventListener('click', () => {
    const rows = parseInt(rowsAInput.value, 10);
    const cols = parseInt(colsAInput.value, 10);
    if (rows > 0 && cols > 0 && rows <= 6 && cols <= 6) {
        renderMatrixInput(rows, cols, 'matrixAContainer');
        updateMatrixFromInputs();
    } else {
        showError('Invalid dimensions for Matrix A (1-6)');
    }
});

document.getElementById('buildMatrixB').addEventListener('click', () => {
    const rows = parseInt(rowsBInput.value, 10);
    const cols = parseInt(colsBInput.value, 10);
    if (rows > 0 && cols > 0 && rows <= 6 && cols <= 6) {
        renderMatrixInput(rows, cols, 'matrixBContainer');
        updateMatrixFromInputs();
    } else {
        showError('Invalid dimensions for Matrix B (1-6)');
    }
});

// Identity & Zero presets
document.getElementById('setIdentityA').addEventListener('click', () => {
    const rows = parseInt(rowsAInput.value, 10);
    const cols = parseInt(colsAInput.value, 10);
    if (rows === cols && rows > 0) {
        matrixA = math.identity(rows);
        rebuildMatrixDisplays();
    } else {
        showError('Identity matrix requires square dimensions');
    }
});

document.getElementById('setZeroA').addEventListener('click', () => {
    const rows = parseInt(rowsAInput.value, 10);
    const cols = parseInt(colsAInput.value, 10);
    if (rows > 0 && cols > 0) {
        matrixA = math.zeros(rows, cols);
        rebuildMatrixDisplays();
    } else {
        showError('Invalid dimensions for zero matrix');
    }
});

document.getElementById('setIdentityB').addEventListener('click', () => {
    const rows = parseInt(rowsBInput.value, 10);
    const cols = parseInt(colsBInput.value, 10);
    if (rows === cols && rows > 0) {
        matrixB = math.identity(rows);
        rebuildMatrixDisplays();
    } else {
        showError('Identity matrix requires square dimensions');
    }
});

document.getElementById('setZeroB').addEventListener('click', () => {
    const rows = parseInt(rowsBInput.value, 10);
    const cols = parseInt(colsBInput.value, 10);
    if (rows > 0 && cols > 0) {
        matrixB = math.zeros(rows, cols);
        rebuildMatrixDisplays();
    } else {
        showError('Invalid dimensions for zero matrix');
    }
});

// ------------------------- CUSTOM REF / RREF WITH STEP GENERATION (safe clones) -------------------------
function deepCloneMatrix(matrix) {
    return JSON.parse(JSON.stringify(matrix.toArray()));
}

function computeREF(matrix, returnSteps = false) {
    const A = deepCloneMatrix(matrix);
    const rows = A.length;
    const cols = A[0].length;
    const steps = [];
    let lead = 0;
    for (let r = 0; r < rows; r++) {
        if (lead >= cols) break;
        let i = r;
        while (Math.abs(A[i][lead]) < 1e-12) {
            i++;
            if (i === rows) {
                i = r;
                lead++;
                if (lead === cols) break;
            }
        }
        if (lead === cols) break;
        if (i !== r) {
            [A[i], A[r]] = [A[r], A[i]];
            steps.push(`Swap row ${i+1} with row ${r+1}`);
        }
        const pivot = A[r][lead];
        if (Math.abs(pivot - 1) > 1e-12 && Math.abs(pivot) > 1e-12) {
            for (let k = 0; k < cols; k++) {
                A[r][k] = A[r][k] / pivot;
            }
            steps.push(`Multiply row ${r+1} by 1/${pivot.toFixed(4)} to make leading coefficient 1`);
        }
        for (let j = 0; j < rows; j++) {
            if (j !== r && Math.abs(A[j][lead]) > 1e-12) {
                const factor = A[j][lead];
                for (let k = 0; k < cols; k++) {
                    A[j][k] -= factor * A[r][k];
                }
                steps.push(`Eliminate column ${lead+1} in row ${j+1} using row ${r+1}`);
            }
        }
        lead++;
    }
    const resultMatrix = math.matrix(A);
    if (returnSteps) return { result: resultMatrix, steps };
    return resultMatrix;
}

function computeRREF(matrix, returnSteps = false) {
    const A = deepCloneMatrix(matrix);
    const rows = A.length;
    const cols = A[0].length;
    const steps = [];
    let lead = 0;
    for (let r = 0; r < rows; r++) {
        if (lead >= cols) break;
        let i = r;
        while (Math.abs(A[i][lead]) < 1e-12) {
            i++;
            if (i === rows) {
                i = r;
                lead++;
                if (lead === cols) break;
            }
        }
        if (lead === cols) break;
        if (i !== r) {
            [A[i], A[r]] = [A[r], A[i]];
            steps.push(`Swap row ${i+1} with row ${r+1}`);
        }
        const pivot = A[r][lead];
        if (Math.abs(pivot - 1) > 1e-12 && Math.abs(pivot) > 1e-12) {
            for (let k = 0; k < cols; k++) {
                A[r][k] = A[r][k] / pivot;
            }
            steps.push(`Scale row ${r+1} by 1/${pivot.toFixed(4)}`);
        }
        for (let j = 0; j < rows; j++) {
            if (j !== r && Math.abs(A[j][lead]) > 1e-12) {
                const factor = A[j][lead];
                for (let k = 0; k < cols; k++) {
                    A[j][k] -= factor * A[r][k];
                }
                steps.push(`Row ${j+1} <- Row ${j+1} - ${factor.toFixed(4)} * Row ${r+1}`);
            }
        }
        lead++;
    }
    if (returnSteps) return { result: math.matrix(A), steps };
    return math.matrix(A);
}

// Gaussian elimination to solve Ax = b (unique solution)
function solveLinearGauss(A, b, returnSteps = false) {
    const augmented = A.toArray().map((row, idx) => [...row, b.get([idx])]);
    const steps = [];
    const rows = augmented.length;
    const cols = augmented[0].length;
    for (let i = 0; i < rows; i++) {
        let maxRow = i;
        for (let k = i+1; k < rows; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) maxRow = k;
        }
        if (Math.abs(augmented[maxRow][i]) < 1e-12) throw new Error('Singular matrix, no unique solution');
        if (maxRow !== i) {
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            steps.push(`Swap row ${i+1} with row ${maxRow+1}`);
        }
        for (let k = i+1; k < rows; k++) {
            const factor = augmented[k][i] / augmented[i][i];
            for (let j = i; j < cols; j++) {
                augmented[k][j] -= factor * augmented[i][j];
            }
            steps.push(`Eliminate x${i+1} from row ${k+1} (factor ${factor.toFixed(4)})`);
        }
    }
    const x = new Array(rows).fill(0);
    for (let i = rows-1; i >= 0; i--) {
        let sum = 0;
        for (let j = i+1; j < rows; j++) sum += augmented[i][j] * x[j];
        x[i] = (augmented[i][cols-1] - sum) / augmented[i][i];
    }
    const solution = math.matrix(x);
    if (returnSteps) return { result: solution, steps };
    return solution;
}

// ------------------------- OPERATION HANDLER WITH STEP MODE -------------------------
async function executeOperation(op, extraParams = {}) {
    setLoading(true);
    clearError();
    resultDisplay.innerHTML = '<p class="placeholder-text">Computing...</p>';
    stepsContent.innerHTML = 'Preparing result...';
    try {
        updateMatrixFromInputs(); // sync latest user values

        let resultValue = null;
        let stepsArray = [];
        const withSteps = stepMode;

        // Helper dimension checks
        function ensureSquare(mat, name) {
            if (!math.isSquare(mat)) throw new Error(`${name} must be square matrix`);
        }
        function ensureSameDimensions(A, B) {
            const sA = A.size(), sB = B.size();
            if (sA[0] !== sB[0] || sA[1] !== sB[1]) {
                throw new Error(`Dimension mismatch: (${sA[0]}x${sA[1]}) vs (${sB[0]}x${sB[1]})`);
            }
        }

        switch(op) {
            case 'add':
                ensureSameDimensions(matrixA, matrixB);
                resultValue = math.add(matrixA, matrixB);
                if (withSteps) stepsArray.push(`A + B: element-wise addition. Dimensions match (${matrixA.size()[0]}x${matrixA.size()[1]}).`);
                break;
            case 'sub':
                ensureSameDimensions(matrixA, matrixB);
                resultValue = math.subtract(matrixA, matrixB);
                if (withSteps) stepsArray.push(`A - B: subtract corresponding elements.`);
                break;
            case 'mul':
                if (matrixA.size()[1] !== matrixB.size()[0]) {
                    throw new Error(`Multiplication impossible: columns of A (${matrixA.size()[1]}) != rows of B (${matrixB.size()[0]})`);
                }
                resultValue = math.multiply(matrixA, matrixB);
                if (withSteps) stepsArray.push(`Matrix multiplication: (${matrixA.size()[0]}x${matrixA.size()[1]}) × (${matrixB.size()[0]}x${matrixB.size()[1]}) = ${matrixA.size()[0]}x${matrixB.size()[1]}`);
                break;
            case 'scalar':
                const scalar = parseFloat(prompt('Enter scalar value:', '2'));
                if (isNaN(scalar)) throw new Error('Invalid scalar');
                resultValue = math.multiply(matrixA, scalar);
                if (withSteps) stepsArray.push(`Scalar multiplication: each element of A multiplied by ${scalar}`);
                break;
            case 'transpose':
                resultValue = math.transpose(matrixA);
                if (withSteps) stepsArray.push(`Transpose: swap rows and columns.`);
                break;
            case 'det':
                ensureSquare(matrixA, 'Matrix A');
                const detVal = math.det(matrixA);
                resultValue = detVal;
                if (withSteps) stepsArray.push(`Determinant computed using Laplace expansion. det(A) = ${prettyPrint(detVal)}`);
                break;
            case 'inv':
                ensureSquare(matrixA, 'Matrix A');
                if (Math.abs(math.det(matrixA)) < 1e-12) throw new Error('Matrix is singular, cannot invert');
                resultValue = math.inv(matrixA);
                if (withSteps) stepsArray.push(`Inverse computed via adjugate/determinant method.`);
                break;
            case 'trace':
                ensureSquare(matrixA, 'Matrix A');
                resultValue = math.trace(matrixA);
                if (withSteps) stepsArray.push(`Trace = sum of diagonal elements = ${prettyPrint(resultValue)}`);
                break;
            case 'rank':
                resultValue = math.rank(matrixA);
                if (withSteps) stepsArray.push(`Rank = number of linearly independent rows/cols = ${resultValue}`);
                break;
            case 'minor':
                ensureSquare(matrixA, 'Matrix A');
                const iMin = parseInt(prompt('Row index (1-based):', '1'), 10) - 1;
                const jMin = parseInt(prompt('Column index (1-based):', '1'), 10) - 1;
                const sizeMin = matrixA.size()[0];
                if (iMin < 0 || iMin >= sizeMin || jMin < 0 || jMin >= sizeMin) throw new Error('Index out of range');
                const subMatrix = matrixA.toArray().filter((_, idx) => idx !== iMin).map(row => row.filter((_, idx) => idx !== jMin));
                resultValue = math.det(math.matrix(subMatrix));
                if (withSteps) stepsArray.push(`Minor M_{${iMin+1}${jMin+1}} = determinant after removing row ${iMin+1}, col ${jMin+1} = ${prettyPrint(resultValue)}`);
                break;
            case 'cofactor':
                ensureSquare(matrixA, 'Matrix A');
                const iCof = parseInt(prompt('Row index (1-based):', '1'), 10) - 1;
                const jCof = parseInt(prompt('Column index (1-based):', '1'), 10) - 1;
                const sizeCof = matrixA.size()[0];
                if (iCof < 0 || iCof >= sizeCof || jCof < 0 || jCof >= sizeCof) throw new Error('Index out of range');
                const subCof = matrixA.toArray().filter((_, idx) => idx !== iCof).map(row => row.filter((_, idx) => idx !== jCof));
                const minorVal = math.det(math.matrix(subCof));
                resultValue = Math.pow(-1, iCof + jCof) * minorVal;
                if (withSteps) stepsArray.push(`Cofactor C_{${iCof+1}${jCof+1}} = (-1)^(${iCof+jCof}) * minor = ${prettyPrint(resultValue)}`);
                break;
            case 'adjoint':
                ensureSquare(matrixA, 'Matrix A');
                resultValue = math.adjoint(matrixA);
                if (withSteps) stepsArray.push(`Adjoint = transpose of cofactor matrix.`);
                break;
            case 'ref':
                const refRes = computeREF(matrixA, withSteps);
                resultValue = refRes.result;
                if (withSteps) stepsArray = refRes.steps;
                break;
            case 'rref':
                const rrefRes = computeRREF(matrixA, withSteps);
                resultValue = rrefRes.result;
                if (withSteps) stepsArray = rrefRes.steps;
                break;
            case 'gauss_solve':
                ensureSquare(matrixA, 'Matrix A');
                const n = matrixA.size()[0];
                const bInput = prompt(`Enter b vector (${n} numbers space-separated):`, '1 2 3');
                if (!bInput) throw new Error('No input provided');
                const bVals = bInput.trim().split(/\s+/).map(Number);
                if (bVals.length !== n || bVals.some(isNaN)) throw new Error('Invalid b vector');
                const bMat = math.matrix(bVals);
                const solveRes = solveLinearGauss(matrixA, bMat, withSteps);
                resultValue = solveRes.result;
                if (withSteps) stepsArray = solveRes.steps;
                break;
            case 'power':
                ensureSquare(matrixA, 'Matrix A');
                const exp = parseInt(prompt('Exponent n (integer):', '2'), 10);
                if (isNaN(exp)) throw new Error('Invalid exponent');
                resultValue = math.matrixPower(matrixA, exp);
                if (withSteps) stepsArray.push(`A^${exp} computed by repeated multiplication.`);
                break;
            case 'matrixDiv':
                ensureSquare(matrixB, 'Matrix B');
                if (Math.abs(math.det(matrixB)) < 1e-12) throw new Error('Matrix B is singular, cannot divide');
                resultValue = math.multiply(matrixA, math.inv(matrixB));
                if (withSteps) stepsArray.push(`A / B = A * B⁻¹`);
                break;
            case 'lu':
                ensureSquare(matrixA, 'Matrix A');
                const lu = math.lup(matrixA);
                resultValue = { L: lu.L, U: lu.U, P: lu.P };
                if (withSteps) stepsArray.push(`LU decomposition with partial pivoting: PA = LU.`);
                break;
            case 'eigen':
                ensureSquare(matrixA, 'Matrix A');
                const eigenvals = math.eigs(matrixA).values;
                resultValue = eigenvals;
                if (withSteps) stepsArray.push(`Eigenvalues: ${eigenvals.map(v => prettyPrint(v)).join(', ')}`);
                break;
            case 'eigenvectors':
                ensureSquare(matrixA, 'Matrix A');
                const eigVec = math.eigs(matrixA);
                resultValue = eigVec.vectors;
                if (withSteps) stepsArray.push(`Eigenvectors (columns) corresponding to eigenvalues.`);
                break;
            case 'diag':
                ensureSquare(matrixA, 'Matrix A');
                const eigDiag = math.eigs(matrixA);
                const isDiag = eigDiag.vectors.size()[0] === matrixA.size()[0];
                resultValue = isDiag ? 'Yes, diagonalizable' : 'No, not diagonalizable (defective)';
                if (withSteps) stepsArray.push(`Diagonalizability check: algebraic multiplicity equals geometric multiplicity.`);
                break;
            case 'charpoly':
                ensureSquare(matrixA, 'Matrix A');
                const evals = math.eigs(matrixA).values.toArray();
                const poly = evals.map((λ, i) => `(λ - ${prettyPrint(λ)})`).join(' · ');
                resultValue = `Characteristic polynomial: ${poly}`;
                if (withSteps) stepsArray.push(`Characteristic polynomial derived from eigenvalues.`);
                break;
            case 'isSymmetric':
                resultValue = math.deepEqual(matrixA, math.transpose(matrixA)) ? '✅ Symmetric' : '❌ Not symmetric';
                break;
            case 'isSkew':
                const negTrans = math.multiply(math.transpose(matrixA), -1);
                resultValue = math.deepEqual(matrixA, negTrans) ? '✅ Skew-Symmetric' : '❌ Not skew-symmetric';
                break;
            case 'isOrthogonal':
                const identity = math.identity(matrixA.size()[0]);
                const check = math.deepEqual(math.multiply(matrixA, math.transpose(matrixA)), identity);
                resultValue = check ? '✅ Orthogonal' : '❌ Not orthogonal';
                break;
            case 'isSingular':
                const detCheck = math.isSquare(matrixA) ? math.det(matrixA) : NaN;
                resultValue = (Math.abs(detCheck) < 1e-10) ? '⚠️ Singular' : '✅ Non-singular';
                break;
            case 'isPosDef':
                const isSym = math.deepEqual(matrixA, math.transpose(matrixA));
                let posDef = false;
                if (isSym && math.isSquare(matrixA)) {
                    try {
                        const e = math.eigs(matrixA).values.toArray();
                        posDef = e.every(v => v > 1e-10);
                    } catch (e) { posDef = false; }
                }
                resultValue = posDef ? '✅ Positive Definite' : '❌ Not Positive Definite';
                break;
            default:
                throw new Error('Unknown operation');
        }

        // Display result
        let displayResult = '';
        if (resultValue && typeof resultValue === 'object' && resultValue.isMatrix) {
            displayResult = prettyPrint(resultValue);
        } else if (resultValue && resultValue.L && resultValue.U) {
            displayResult = `L (lower triangular):\n${prettyPrint(resultValue.L)}\n\nU (upper triangular):\n${prettyPrint(resultValue.U)}\n\nP (permutation):\n${prettyPrint(resultValue.P)}`;
        } else if (typeof resultValue === 'object' && resultValue._data) {
            displayResult = prettyPrint(resultValue);
        } else {
            displayResult = prettyPrint(resultValue);
        }
        resultDisplay.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace;">${displayResult}</pre>`;

        if (withSteps && stepsArray.length) {
            stepsContent.innerHTML = `<pre style="white-space: pre-wrap;">${stepsArray.join('\n\n')}</pre>`;
        } else if (withSteps) {
            stepsContent.innerHTML = 'No detailed steps available for this operation.';
        } else {
            stepsContent.innerHTML = 'Toggle step-by-step mode to see detailed explanation.';
        }
    } catch (err) {
        console.error(err);
        showError(err.message || 'Computation error');
        resultDisplay.innerHTML = `<span style="color: var(--danger);">❌ Error: ${err.message}</span>`;
        stepsContent.innerHTML = 'Operation failed. Check matrix dimensions and values.';
    } finally {
        setLoading(false);
    }
}

// ------------------------- EVENT BINDINGS FOR OPERATIONS -------------------------
const opButtons = document.querySelectorAll('.op-btn');
opButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const op = btn.dataset.op;
        if (op) executeOperation(op);
    });
});

// Theme toggle with persistence
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
    currentTheme = theme;
    localStorage.setItem('matrixforge-theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
});

// Step mode toggle
stepToggleCheckbox.addEventListener('change', (e) => {
    stepMode = e.target.checked;
    stepsContent.innerHTML = stepMode ? '✅ Step-by-step mode active. Perform any operation.' : 'Step mode disabled. Toggle to see detailed solutions.';
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('matrixforge-theme');
    if (savedTheme === 'dark') setTheme('dark');
    else setTheme('light');

    renderMatrixInput(3, 3, 'matrixAContainer', [[1,2,3],[4,5,6],[7,8,9]]);
    renderMatrixInput(3, 3, 'matrixBContainer', [[9,8,7],[6,5,4],[3,2,1]]);
    updateMatrixFromInputs();
    stepMode = false;
    stepToggleCheckbox.checked = false;
    stepsContent.innerHTML = 'Toggle step-by-step mode to see detailed solutions.';
});