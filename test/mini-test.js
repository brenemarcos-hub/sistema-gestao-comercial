/**
 * Mini-Framework de Testes para o Sistema Verum
 * Proporciona sintaxe describe/test/expect no navegador
 */

const miniTest = {
    results: [],
    currentSuite: '',

    describe(name, fn) {
        this.currentSuite = name;
        fn();
    },

    async test(name, fn) {
        const fullPath = `${this.currentSuite} > ${name}`;
        try {
            await fn();
            this.results.push({ name: fullPath, status: 'pass' });
        } catch (error) {
            this.results.push({ name: fullPath, status: 'fail', error: error.message });
        }
        this.updateUI();
    },

    expect(value) {
        return {
            toBe(expected) {
                if (value !== expected) {
                    throw new Error(`Esperado ${expected}, mas recebeu ${value}`);
                }
            },
            toContain(item) {
                if (!Array.isArray(value) || !value.includes(item)) {
                    throw new Error(`Esperado que a lista contivesse ${item}`);
                }
            },
            toBeGreaterThan(min) {
                if (value <= min) {
                    throw new Error(`Esperado que ${value} fosse maior que ${min}`);
                }
            }
        };
    },

    updateUI() {
        const event = new CustomEvent('testUpdate', { detail: this.results });
        window.dispatchEvent(event);
    }
};

window.describe = miniTest.describe.bind(miniTest);
window.test = miniTest.test.bind(miniTest);
window.expect = miniTest.expect.bind(miniTest);
window.miniTestResults = miniTest.results;
