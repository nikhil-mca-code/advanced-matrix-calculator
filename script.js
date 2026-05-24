/**
 * MATRIXFORGE - ADVANCED MATRIX CALCULATOR
 * Audited for robust validation, stable matrix algorithms, accessible rendering,
 * and compatibility with Math.js 11.x.
 */

(() => {
    'use strict';

    const EPS = 1e-10;
    const MAX_DIMENSION = 6;

    let matrixA;
    let matrixB;
    let stepMode = false;
    let currentTheme = 'light';
    let errorTimer = null;

    const dom = {};

    function isMathReady() {
        return typeof window.math !== 'undefined';
    }

    function cacheDom() {
        dom.themeToggleBtn = document.getElementById('themeToggleBtn');
        dom.stepToggleCheckbox = document.getElementById('stepModeToggle');
        dom.loadingIndicator = document.getElementById('loadingIndicator');
        dom.resultDisplay = document.getElementById('resultDisplay');
        dom.stepsContent = document.getElementById('stepsContent');
        dom.errorBox = document.getElementById('errorBox');
        dom.rowsAInput = document.getElementById('rowsA');
        dom.colsAInput = document.getElementById('colsA');
        dom.rowsBInput = document.getElementById('rowsB');
        dom.colsBInput = document.getElementById('colsB');
        dom.matrixAContainer = document.getElementById('matrixAContainer');
        dom.matrixBContainer = document.getElementById('matrixBContainer');
    }

    function isNearZero(value, tolerance = EPS) {
        return Math.abs(value) <= tolerance;
    }

    function cleanNumber(value) {
        return isNearZero(value) ? 0 : value;
    }

    function cleanMatrixArray(values) {
        return values.map(row => row.map(cleanNumber));
    }

    function isSquareMatrix(matrix) {
        const size = matrix.size();
        return size.length === 2 && size[0] === size[1];
    }

    function validateDimension(value, name) {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DIMENSION) {
            throw new Error(`${name} must be an integer from 1 to ${MAX_DIMENSION}.`);
        }
        return parsed;
    }

    function parseNumericCell(value) {
        if (value.trim() === '') return 0;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            throw new Error('Matrix entries must be finite numbers.');
        }
        return parsed;
    }

    function matrixToArray(matrix) {
        const arr = matrix.toArray();
        return Array.isArray(arr[0]) ? arr.map(row => row.slice()) : [arr.slice()];
    }

    function toVectorArray(data) {
        if (math.isMatrix(data)) return data.toArray();
        if (Array.isArray(data)) return data;
        return [data];
    }

    function formatNumber(value) {
        if (typeof value === 'number') {
            const cleaned = cleanNumber(value);
            return cleaned.toFixed(8).replace(/\.?0+$/, '');
        }
        if (math.typeOf(value) === 'Complex') {
            return math.format(value, { precision: 8 });
        }
        return String(value);
    }

    function prettyPrint(data) {
        if (data === null || data === undefined) return '';
        if (typeof data === 'number') return formatNumber(data);
        if (typeof data === 'string') return data;
        if (math.isMatrix(data)) {
            const arr = data.toArray();
            const formatted = Array.isArray(arr[0])
                ? arr.map(row => row.map(formatNumber))
                : arr.map(formatNumber);
            return math.format(formatted, { precision: 8 });
        }
        if (Array.isArray(data)) {
            return math.format(data.map(item => typeof item === 'number' ? cleanNumber(item) : item), { precision: 8 });
        }
        return math.format(data, { precision: 8 });
    }

    function setText(element, text) {
        element.textContent = text;
    }

    function setPre(element, text, className = '') {
        element.textContent = '';
        const pre = document.createElement('pre');
        pre.textContent = text;
        if (className) pre.className = className;
        element.appendChild(pre);
    }

    function normalizeTableData(value) {
        if (math.isMatrix(value)) return normalizeTableData(value.toArray());
        if (!Array.isArray(value)) return null;
        if (value.length === 0) return [[]];
        return Array.isArray(value[0]) ? value : value.map(item => [item]);
    }

    function createMatrixTable(value, label = 'Matrix result') {
        const rows = normalizeTableData(value);
        if (!rows) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'matrix-result-wrapper';

        const table = document.createElement('table');
        table.className = 'matrix-result-table';
        table.setAttribute('aria-label', label);

        const tbody = document.createElement('tbody');
        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = formatNumber(cell);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrapper.appendChild(table);
        return wrapper;
    }

    function appendResultBlock(parent, title, value) {
        const section = document.createElement('section');
        section.className = 'result-block';

        if (title) {
            const heading = document.createElement('h4');
            heading.textContent = title;
            section.appendChild(heading);
        }

        const table = createMatrixTable(value, title || 'Matrix result');
        if (table) section.appendChild(table);
        else setPre(section, prettyPrint(value));

        parent.appendChild(section);
    }

    function showError(message) {
        clearTimeout(errorTimer);
        dom.errorBox.textContent = message;
        dom.errorBox.classList.remove('hidden');
        errorTimer = setTimeout(() => dom.errorBox.classList.add('hidden'), 6000);
    }

    function clearError() {
        clearTimeout(errorTimer);
        dom.errorBox.textContent = '';
        dom.errorBox.classList.add('hidden');
    }

    function setLoading(isLoading) {
        dom.loadingIndicator.classList.toggle('hidden', !isLoading);
    }

    function readDimensions(prefix) {
        const rowsInput = prefix === 'A' ? dom.rowsAInput : dom.rowsBInput;
        const colsInput = prefix === 'A' ? dom.colsAInput : dom.colsBInput;
        return {
            rows: validateDimension(rowsInput.value, `Matrix ${prefix} rows`),
            cols: validateDimension(colsInput.value, `Matrix ${prefix} columns`)
        };
    }

    function renderMatrixInput(rows, cols, container, matrixName, values = null) {
        container.textContent = '';
        const grid = document.createElement('div');
        grid.className = 'matrix-input-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, minmax(54px, 70px))`;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.inputMode = 'decimal';
                input.value = values && values[row] && values[row][col] !== undefined ? values[row][col] : 0;
                input.dataset.row = String(row);
                input.dataset.col = String(col);
                input.setAttribute('aria-label', `Matrix ${matrixName} row ${row + 1} column ${col + 1}`);
                input.addEventListener('input', updateMatrixFromInputs);
                grid.appendChild(input);
            }
        }

        container.appendChild(grid);
    }

    function readMatrix(container, rows, cols) {
        const inputs = Array.from(container.querySelectorAll('input'));
        if (inputs.length !== rows * cols) {
            throw new Error('Matrix grid is out of sync with its dimensions. Rebuild the matrix.');
        }

        const values = [];
        for (let row = 0; row < rows; row++) {
            const currentRow = [];
            for (let col = 0; col < cols; col++) {
                currentRow.push(parseNumericCell(inputs[row * cols + col].value));
            }
            values.push(currentRow);
        }
        return math.matrix(values);
    }

    function updateMatrixFromInputs() {
        try {
            const dimA = readDimensions('A');
            const dimB = readDimensions('B');
            matrixA = readMatrix(dom.matrixAContainer, dimA.rows, dimA.cols);
            matrixB = readMatrix(dom.matrixBContainer, dimB.rows, dimB.cols);
            clearError();
            return true;
        } catch (err) {
            showError(err.message);
            return false;
        }
    }

    function rebuildMatrixDisplays() {
        const sizeA = matrixA.size();
        const sizeB = matrixB.size();
        dom.rowsAInput.value = sizeA[0];
        dom.colsAInput.value = sizeA[1];
        dom.rowsBInput.value = sizeB[0];
        dom.colsBInput.value = sizeB[1];
        renderMatrixInput(sizeA[0], sizeA[1], dom.matrixAContainer, 'A', matrixA.toArray());
        renderMatrixInput(sizeB[0], sizeB[1], dom.matrixBContainer, 'B', matrixB.toArray());
    }

    function buildMatrix(prefix) {
        try {
            const { rows, cols } = readDimensions(prefix);
            const container = prefix === 'A' ? dom.matrixAContainer : dom.matrixBContainer;
            renderMatrixInput(rows, cols, container, prefix);
            updateMatrixFromInputs();
        } catch (err) {
            showError(err.message);
        }
    }

    function setPreset(prefix, type) {
        try {
            const { rows, cols } = readDimensions(prefix);
            if (type === 'identity' && rows !== cols) {
                throw new Error('Identity requires a square matrix.');
            }
            const next = type === 'identity' ? math.identity(rows) : math.zeros(rows, cols);
            if (prefix === 'A') matrixA = next;
            else matrixB = next;
            rebuildMatrixDisplays();
            clearError();
        } catch (err) {
            showError(err.message);
        }
    }

    function computeREF(matrix, returnSteps = false) {
        const A = matrixToArray(matrix);
        const rows = A.length;
        const cols = A[0].length;
        const steps = [];
        let pivotRow = 0;

        for (let col = 0; col < cols && pivotRow < rows; col++) {
            let bestRow = pivotRow;
            for (let row = pivotRow + 1; row < rows; row++) {
                if (Math.abs(A[row][col]) > Math.abs(A[bestRow][col])) bestRow = row;
            }
            if (isNearZero(A[bestRow][col])) continue;

            if (bestRow !== pivotRow) {
                [A[pivotRow], A[bestRow]] = [A[bestRow], A[pivotRow]];
                steps.push(`Swap R${pivotRow + 1} and R${bestRow + 1}.`);
            }

            const pivot = A[pivotRow][col];
            if (!isNearZero(pivot - 1)) {
                for (let k = col; k < cols; k++) A[pivotRow][k] /= pivot;
                steps.push(`Scale R${pivotRow + 1} by 1/${formatNumber(pivot)}.`);
            }

            for (let row = pivotRow + 1; row < rows; row++) {
                const factor = A[row][col];
                if (isNearZero(factor)) continue;
                for (let k = col; k < cols; k++) A[row][k] -= factor * A[pivotRow][k];
                steps.push(`R${row + 1} <- R${row + 1} - ${formatNumber(factor)}R${pivotRow + 1}.`);
            }
            pivotRow++;
        }

        const result = math.matrix(cleanMatrixArray(A));
        return returnSteps ? { result, steps } : result;
    }

    function computeRREF(matrix, returnSteps = false) {
        const A = matrixToArray(matrix);
        const rows = A.length;
        const cols = A[0].length;
        const steps = [];
        let pivotRow = 0;

        for (let col = 0; col < cols && pivotRow < rows; col++) {
            let bestRow = pivotRow;
            for (let row = pivotRow + 1; row < rows; row++) {
                if (Math.abs(A[row][col]) > Math.abs(A[bestRow][col])) bestRow = row;
            }
            if (isNearZero(A[bestRow][col])) continue;

            if (bestRow !== pivotRow) {
                [A[pivotRow], A[bestRow]] = [A[bestRow], A[pivotRow]];
                steps.push(`Swap R${pivotRow + 1} and R${bestRow + 1}.`);
            }

            const pivot = A[pivotRow][col];
            if (!isNearZero(pivot - 1)) {
                for (let k = 0; k < cols; k++) A[pivotRow][k] /= pivot;
                steps.push(`Scale R${pivotRow + 1} by 1/${formatNumber(pivot)}.`);
            }

            for (let row = 0; row < rows; row++) {
                if (row === pivotRow) continue;
                const factor = A[row][col];
                if (isNearZero(factor)) continue;
                for (let k = 0; k < cols; k++) A[row][k] -= factor * A[pivotRow][k];
                steps.push(`R${row + 1} <- R${row + 1} - ${formatNumber(factor)}R${pivotRow + 1}.`);
            }
            pivotRow++;
        }

        const result = math.matrix(cleanMatrixArray(A));
        return returnSteps ? { result, steps } : result;
    }

    function computeRank(matrix) {
        const ref = computeREF(matrix).toArray();
        return ref.filter(row => row.some(value => !isNearZero(value))).length;
    }

    function getMinorMatrix(matrix, rowToRemove, colToRemove) {
        return matrixToArray(matrix)
            .filter((_, row) => row !== rowToRemove)
            .map(row => row.filter((_, col) => col !== colToRemove));
    }

    function minorValue(matrix, row, col) {
        const n = matrix.size()[0];
        if (n === 1) return 1;
        return math.det(math.matrix(getMinorMatrix(matrix, row, col)));
    }

    function adjointMatrix(matrix) {
        const n = matrix.size()[0];
        if (n === 1) return math.matrix([[1]]);

        const cofactors = [];
        for (let row = 0; row < n; row++) {
            const cofactorRow = [];
            for (let col = 0; col < n; col++) {
                cofactorRow.push(((row + col) % 2 === 0 ? 1 : -1) * minorValue(matrix, row, col));
            }
            cofactors.push(cofactorRow);
        }
        return math.transpose(math.matrix(cofactors));
    }

    function matrixPower(matrix, exponent) {
        if (!Number.isInteger(exponent)) throw new Error('Exponent must be an integer.');
        const n = matrix.size()[0];
        if (exponent === 0) return math.identity(n);

        let base = matrix;
        let power = exponent;
        if (power < 0) {
            if (isNearZero(math.det(matrix))) throw new Error('Negative powers require a non-singular matrix.');
            base = math.inv(matrix);
            power = Math.abs(power);
        }

        let result = math.identity(n);
        while (power > 0) {
            if (power % 2 === 1) result = math.multiply(result, base);
            base = math.multiply(base, base);
            power = Math.floor(power / 2);
        }
        return result;
    }

    function solveLinearGauss(A, bValues, returnSteps = false) {
        const n = A.size()[0];
        const augmented = matrixToArray(A).map((row, index) => [...row, bValues[index]]);
        const steps = [];

        for (let col = 0; col < n; col++) {
            let bestRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(augmented[row][col]) > Math.abs(augmented[bestRow][col])) bestRow = row;
            }
            if (isNearZero(augmented[bestRow][col])) {
                throw new Error('Matrix A is singular, so the system has no unique solution.');
            }
            if (bestRow !== col) {
                [augmented[col], augmented[bestRow]] = [augmented[bestRow], augmented[col]];
                steps.push(`Swap R${col + 1} and R${bestRow + 1}.`);
            }
            for (let row = col + 1; row < n; row++) {
                const factor = augmented[row][col] / augmented[col][col];
                if (isNearZero(factor)) continue;
                for (let k = col; k <= n; k++) augmented[row][k] -= factor * augmented[col][k];
                steps.push(`Eliminate x${col + 1} from R${row + 1}.`);
            }
        }

        const solution = new Array(n).fill(0);
        for (let row = n - 1; row >= 0; row--) {
            let sum = 0;
            for (let col = row + 1; col < n; col++) sum += augmented[row][col] * solution[col];
            solution[row] = cleanNumber((augmented[row][n] - sum) / augmented[row][row]);
        }

        const result = math.matrix(solution);
        return returnSteps ? { result, steps } : result;
    }

    function matricesApproximatelyEqual(left, right, tolerance = 1e-8) {
        const leftSize = left.size();
        const rightSize = right.size();
        if (leftSize[0] !== rightSize[0] || leftSize[1] !== rightSize[1]) return false;

        const A = matrixToArray(left);
        const B = matrixToArray(right);
        for (let row = 0; row < leftSize[0]; row++) {
            for (let col = 0; col < leftSize[1]; col++) {
                if (Math.abs(A[row][col] - B[row][col]) > tolerance) return false;
            }
        }
        return true;
    }

    function characteristicPolynomial(matrix) {
        const n = matrix.size()[0];
        const identity = math.identity(n);
        let B = identity;
        const coefficients = [1];

        for (let k = 1; k <= n; k++) {
            const traceValue = math.trace(math.multiply(matrix, B));
            const coefficient = cleanNumber(-traceValue / k);
            coefficients.push(coefficient);
            B = math.add(math.multiply(matrix, B), math.multiply(identity, coefficient));
        }

        return coefficients;
    }

    function formatPolynomial(coefficients) {
        const degree = coefficients.length - 1;
        const terms = [];

        coefficients.forEach((coefficient, index) => {
            const power = degree - index;
            if (isNearZero(coefficient)) return;
            const sign = coefficient < 0 ? '-' : '+';
            const absCoefficient = Math.abs(coefficient);
            const coeffText = isNearZero(absCoefficient - 1) && power > 0 ? '' : formatNumber(absCoefficient);
            const variable = power === 0 ? '' : power === 1 ? 'lambda' : `lambda^${power}`;
            terms.push({ sign, text: `${coeffText}${variable}` || '0' });
        });

        if (!terms.length) return '0';
        return terms.map((term, index) => {
            if (index === 0) return term.sign === '-' ? `-${term.text}` : term.text;
            return ` ${term.sign} ${term.text}`;
        }).join('');
    }

    function eigenValuesArray(matrix) {
        if (typeof math.eigs !== 'function') {
            throw new Error('Eigenvalue support is unavailable in the loaded Math.js build.');
        }
        return toVectorArray(math.eigs(matrix).values);
    }

    function isPositiveDefinite(matrix) {
        if (!isSquareMatrix(matrix) || !matricesApproximatelyEqual(matrix, math.transpose(matrix))) return false;
        const values = eigenValuesArray(matrix);
        return values.every(value => typeof value === 'number' && value > EPS);
    }

    function isDiagonallyLikely(matrix) {
        const values = eigenValuesArray(matrix);
        const realValues = values.filter(value => typeof value === 'number');
        if (realValues.length !== matrix.size()[0]) {
            return { ok: false, message: 'Complex eigenvalue diagonalization is not displayed by this calculator.' };
        }

        const groups = [];
        realValues.forEach(value => {
            const group = groups.find(item => Math.abs(item.value - value) < 1e-7);
            if (group) group.count++;
            else groups.push({ value, count: 1 });
        });

        const n = matrix.size()[0];
        const identity = math.identity(n);
        const totalNullity = groups.reduce((sum, group) => {
            const shifted = math.subtract(matrix, math.multiply(identity, group.value));
            return sum + (n - computeRank(shifted));
        }, 0);

        return {
            ok: totalNullity === n,
            message: totalNullity === n
                ? 'Yes, diagonalizable over the real numbers.'
                : 'No, not diagonalizable over the real numbers.'
        };
    }

    function parsePromptNumber(label, fallback) {
        const input = prompt(label, fallback);
        if (input === null) throw new Error('Operation cancelled.');
        const value = Number(input.trim());
        if (!Number.isFinite(value)) throw new Error('Please enter a finite number.');
        return value;
    }

    function parsePromptInteger(label, fallback) {
        const value = parsePromptNumber(label, fallback);
        if (!Number.isInteger(value)) throw new Error('Please enter an integer.');
        return value;
    }

    function parsePromptIndex(label, fallback, max) {
        const value = parsePromptInteger(label, fallback);
        if (value < 1 || value > max) throw new Error(`Index must be from 1 to ${max}.`);
        return value - 1;
    }

    function parseBVector(length) {
        const input = prompt(`Enter b vector (${length} numbers, separated by spaces or commas):`, Array.from({ length }, (_, i) => i + 1).join(' '));
        if (input === null || input.trim() === '') throw new Error('A b vector is required.');
        const values = input.split(/[\s,]+/).filter(Boolean).map(Number);
        if (values.length !== length || values.some(value => !Number.isFinite(value))) {
            throw new Error(`The b vector must contain exactly ${length} finite numbers.`);
        }
        return values;
    }

    function ensureSquare(matrix, name) {
        if (!isSquareMatrix(matrix)) throw new Error(`${name} must be square.`);
    }

    function ensureSameDimensions(A, B) {
        const sizeA = A.size();
        const sizeB = B.size();
        if (sizeA[0] !== sizeB[0] || sizeA[1] !== sizeB[1]) {
            throw new Error(`Dimension mismatch: A is ${sizeA[0]}x${sizeA[1]}, B is ${sizeB[0]}x${sizeB[1]}.`);
        }
    }

    function ensureMultiplicationDimensions(A, B) {
        const sizeA = A.size();
        const sizeB = B.size();
        if (sizeA[1] !== sizeB[0]) {
            throw new Error(`Multiplication requires columns of A (${sizeA[1]}) to equal rows of B (${sizeB[0]}).`);
        }
    }

    function displayResult(value) {
        if (value && value.L && value.U && value.P) {
            dom.resultDisplay.textContent = '';
            appendResultBlock(dom.resultDisplay, 'L (lower)', value.L);
            appendResultBlock(dom.resultDisplay, 'U (upper)', value.U);
            appendResultBlock(dom.resultDisplay, 'P (permutation)', value.P);
            return;
        }

        if (math.isMatrix(value) || Array.isArray(value)) {
            dom.resultDisplay.textContent = '';
            appendResultBlock(dom.resultDisplay, '', value);
            return;
        }

        setPre(dom.resultDisplay, prettyPrint(value));
    }

    function displaySteps(steps) {
        if (!stepMode) {
            setText(dom.stepsContent, 'Toggle step-by-step mode to see detailed explanation.');
        } else if (steps.length) {
            setPre(dom.stepsContent, steps.join('\n\n'));
        } else {
            setText(dom.stepsContent, 'No detailed steps are available for this operation.');
        }
    }

    async function executeOperation(op) {
        setLoading(true);
        clearError();
        setText(dom.resultDisplay, 'Computing...');
        setText(dom.stepsContent, 'Preparing result...');

        try {
            if (!updateMatrixFromInputs()) throw new Error('Fix the highlighted input issue and try again.');

            let resultValue;
            let steps = [];

            switch (op) {
                case 'add':
                    ensureSameDimensions(matrixA, matrixB);
                    resultValue = math.add(matrixA, matrixB);
                    steps.push('Add matching entries from A and B.');
                    break;
                case 'sub':
                    ensureSameDimensions(matrixA, matrixB);
                    resultValue = math.subtract(matrixA, matrixB);
                    steps.push('Subtract each entry of B from the matching entry of A.');
                    break;
                case 'mul':
                    ensureMultiplicationDimensions(matrixA, matrixB);
                    resultValue = math.multiply(matrixA, matrixB);
                    steps.push(`Multiply rows of A by columns of B to produce a ${matrixA.size()[0]}x${matrixB.size()[1]} matrix.`);
                    break;
                case 'scalar': {
                    const scalar = parsePromptNumber('Enter scalar value:', '2');
                    resultValue = math.multiply(matrixA, scalar);
                    steps.push(`Multiply every entry of A by ${formatNumber(scalar)}.`);
                    break;
                }
                case 'transpose':
                    resultValue = math.transpose(matrixA);
                    steps.push('Swap rows and columns of A.');
                    break;
                case 'det':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = cleanNumber(math.det(matrixA));
                    steps.push(`det(A) = ${prettyPrint(resultValue)}.`);
                    break;
                case 'inv':
                    ensureSquare(matrixA, 'Matrix A');
                    if (isNearZero(math.det(matrixA))) throw new Error('Matrix A is singular and cannot be inverted.');
                    resultValue = math.inv(matrixA);
                    steps.push('Use Gauss-Jordan elimination to form A inverse.');
                    break;
                case 'trace':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = cleanNumber(math.trace(matrixA));
                    steps.push('Add the entries on the main diagonal.');
                    break;
                case 'rank':
                    resultValue = computeRank(matrixA);
                    steps.push('Reduce A to row echelon form and count non-zero rows.');
                    break;
                case 'minor': {
                    ensureSquare(matrixA, 'Matrix A');
                    const n = matrixA.size()[0];
                    const row = parsePromptIndex('Row index (1-based):', '1', n);
                    const col = parsePromptIndex('Column index (1-based):', '1', n);
                    resultValue = cleanNumber(minorValue(matrixA, row, col));
                    steps.push(`Remove row ${row + 1} and column ${col + 1}, then compute the determinant.`);
                    break;
                }
                case 'cofactor': {
                    ensureSquare(matrixA, 'Matrix A');
                    const n = matrixA.size()[0];
                    const row = parsePromptIndex('Row index (1-based):', '1', n);
                    const col = parsePromptIndex('Column index (1-based):', '1', n);
                    const minor = minorValue(matrixA, row, col);
                    resultValue = cleanNumber(((row + col) % 2 === 0 ? 1 : -1) * minor);
                    steps.push(`Cofactor = (-1)^(${row + 1}+${col + 1}) times the minor.`);
                    break;
                }
                case 'adjoint':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = adjointMatrix(matrixA);
                    steps.push('Build the cofactor matrix and transpose it.');
                    break;
                case 'ref': {
                    const output = computeREF(matrixA, true);
                    resultValue = output.result;
                    steps = output.steps;
                    break;
                }
                case 'rref': {
                    const output = computeRREF(matrixA, true);
                    resultValue = output.result;
                    steps = output.steps;
                    break;
                }
                case 'gauss_solve': {
                    ensureSquare(matrixA, 'Matrix A');
                    const bValues = parseBVector(matrixA.size()[0]);
                    const output = solveLinearGauss(matrixA, bValues, true);
                    resultValue = output.result;
                    steps = output.steps;
                    break;
                }
                case 'power': {
                    ensureSquare(matrixA, 'Matrix A');
                    const exponent = parsePromptInteger('Exponent n (integer):', '2');
                    resultValue = matrixPower(matrixA, exponent);
                    steps.push(`Compute A^${exponent} using repeated squaring.`);
                    break;
                }
                case 'matrixDiv':
                    ensureSquare(matrixB, 'Matrix B');
                    ensureMultiplicationDimensions(matrixA, matrixB);
                    if (isNearZero(math.det(matrixB))) throw new Error('Matrix B is singular, so A / B is undefined.');
                    resultValue = math.multiply(matrixA, math.inv(matrixB));
                    steps.push('A / B is interpreted as A multiplied by inverse(B).');
                    break;
                case 'lu':
                    ensureSquare(matrixA, 'Matrix A');
                    {
                        const lu = math.lup(matrixA);
                        resultValue = { L: lu.L, U: lu.U, P: lu.P || lu.p };
                    }
                    steps.push('Compute LUP decomposition with partial pivoting.');
                    break;
                case 'eigen':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = eigenValuesArray(matrixA);
                    steps.push('Solve det(lambda I - A) = 0.');
                    break;
                case 'eigenvectors':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = math.eigs(matrixA).vectors || math.eigs(matrixA).eigenvectors;
                    if (!resultValue) throw new Error('Eigenvectors are unavailable in this Math.js build.');
                    steps.push('Each vector solves (A - lambda I)x = 0.');
                    break;
                case 'diag': {
                    ensureSquare(matrixA, 'Matrix A');
                    const check = isDiagonallyLikely(matrixA);
                    resultValue = check.message;
                    steps.push('Compare total eigenspace dimension with the matrix size.');
                    break;
                }
                case 'charpoly': {
                    ensureSquare(matrixA, 'Matrix A');
                    const coefficients = characteristicPolynomial(matrixA);
                    resultValue = `p(lambda) = ${formatPolynomial(coefficients)}`;
                    steps.push('Use the Faddeev-LeVerrier method to compute characteristic coefficients.');
                    break;
                }
                case 'isSymmetric':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = matricesApproximatelyEqual(matrixA, math.transpose(matrixA)) ? 'Yes, symmetric.' : 'No, not symmetric.';
                    break;
                case 'isSkew':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = matricesApproximatelyEqual(matrixA, math.multiply(math.transpose(matrixA), -1)) ? 'Yes, skew-symmetric.' : 'No, not skew-symmetric.';
                    break;
                case 'isOrthogonal':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = matricesApproximatelyEqual(math.multiply(math.transpose(matrixA), matrixA), math.identity(matrixA.size()[0])) ? 'Yes, orthogonal.' : 'No, not orthogonal.';
                    break;
                case 'isSingular':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = isNearZero(math.det(matrixA)) ? 'Yes, singular.' : 'No, non-singular.';
                    break;
                case 'isPosDef':
                    ensureSquare(matrixA, 'Matrix A');
                    resultValue = isPositiveDefinite(matrixA) ? 'Yes, positive definite.' : 'No, not positive definite.';
                    break;
                default:
                    throw new Error('Unknown operation.');
            }

            displayResult(resultValue);
            displaySteps(steps);
        } catch (err) {
            console.error(err);
            showError(err.message || 'Computation error.');
            setPre(dom.resultDisplay, `Error: ${err.message || 'Computation error.'}`, 'error-text');
            setText(dom.stepsContent, 'Operation failed. Check matrix dimensions and values.');
        } finally {
            setLoading(false);
        }
    }

    function setTheme(theme) {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark', isDark);
        dom.themeToggleBtn.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"></i>`;
        dom.themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        currentTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('matrixforge-theme', currentTheme);
    }

    function bindEvents() {
        document.getElementById('buildMatrixA').addEventListener('click', () => buildMatrix('A'));
        document.getElementById('buildMatrixB').addEventListener('click', () => buildMatrix('B'));
        document.getElementById('setIdentityA').addEventListener('click', () => setPreset('A', 'identity'));
        document.getElementById('setZeroA').addEventListener('click', () => setPreset('A', 'zero'));
        document.getElementById('setIdentityB').addEventListener('click', () => setPreset('B', 'identity'));
        document.getElementById('setZeroB').addEventListener('click', () => setPreset('B', 'zero'));

        document.querySelectorAll('.op-btn').forEach(button => {
            button.addEventListener('click', () => executeOperation(button.dataset.op));
        });

        dom.themeToggleBtn.addEventListener('click', () => {
            setTheme(currentTheme === 'light' ? 'dark' : 'light');
        });

        dom.stepToggleCheckbox.addEventListener('change', event => {
            stepMode = event.target.checked;
            setText(dom.stepsContent, stepMode
                ? 'Step-by-step mode active. Perform any operation.'
                : 'Step mode disabled. Toggle to see detailed solutions.');
        });
    }

    function init() {
        cacheDom();
        if (!isMathReady()) {
            showError('Math.js failed to load. Check your network connection and refresh.');
            setPre(dom.resultDisplay, 'Math.js failed to load.');
            return;
        }

        matrixA = math.matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
        matrixB = math.matrix([[9, 8, 7], [6, 5, 4], [3, 2, 1]]);
        renderMatrixInput(3, 3, dom.matrixAContainer, 'A', matrixA.toArray());
        renderMatrixInput(3, 3, dom.matrixBContainer, 'B', matrixB.toArray());
        bindEvents();
        setTheme(localStorage.getItem('matrixforge-theme') === 'dark' ? 'dark' : 'light');
        updateMatrixFromInputs();
        dom.stepToggleCheckbox.checked = false;
        setText(dom.stepsContent, 'Toggle step-by-step mode to see detailed solutions.');
    }

    window.addEventListener('DOMContentLoaded', init);
})();
