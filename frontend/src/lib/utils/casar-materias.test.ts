import { describe, it, expect } from 'vitest';
import {
	isMateriaObrigatoriaNoCasamento,
	filterMateriasPendentesSomenteObrigatorias
} from './casar-materias';

describe('isMateriaObrigatoriaNoCasamento (caixa-branca)', () => {
	describe('D1: tipo === "optativa"', () => {
		it('optativa não é obrigatória, mesmo com nível preenchido', () => {
			expect(isMateriaObrigatoriaNoCasamento({ tipo: 'optativa', nivel: 3 })).toBe(false);
		});
		it('tipo diferente de optativa segue para a checagem do nível', () => {
			expect(isMateriaObrigatoriaNoCasamento({ tipo: 'obrigatoria', nivel: 3 })).toBe(true);
		});
	});

	// D2: A (nivel != null) && B (nivel !== '') && C (Number(nivel) === 0)
	describe('D2: MC/DC de A && B && C', () => {
		const base = { tipo: 'obrigatoria' };

		it('caso 1 (V,V,V): nivel 0 não é obrigatória', () => {
			expect(isMateriaObrigatoriaNoCasamento({ ...base, nivel: 0 })).toBe(false);
		});
		it('caso 2 (V,V,F): nivel 1 é obrigatória (par de C com o caso 1)', () => {
			expect(isMateriaObrigatoriaNoCasamento({ ...base, nivel: 1 })).toBe(true);
		});
		it('caso 3 (V,F,-): nivel vazio é obrigatória (par de B com o caso 1)', () => {
			expect(isMateriaObrigatoriaNoCasamento({ ...base, nivel: '' })).toBe(true);
		});
		it('caso 4 (F,-,-): nivel null é obrigatória (par de A com o caso 1)', () => {
			expect(isMateriaObrigatoriaNoCasamento({ ...base, nivel: null })).toBe(true);
		});
	});

	it('sem a propriedade nivel (undefined) também cai no caso 4', () => {
		expect(isMateriaObrigatoriaNoCasamento({ tipo: 'obrigatoria' })).toBe(true);
	});
});

describe('isMateriaObrigatoriaNoCasamento (caixa-preta)', () => {
	describe('classes de tipo', () => {
		it.each([
			['T1: "optativa"', 'optativa', false],
			['T2: "OPTATIVA"', 'OPTATIVA', false],
			['T2: "Optativa"', 'Optativa', false],
			['T2: com espaços nas pontas', '  optativa  ', false],
			['T3: "obrigatoria"', 'obrigatoria', true],
			['T3: "Optativas" (plural)', 'Optativas', true],
			['T5: string vazia', '', true]
		])('%s', (_nome, tipo, esperado) => {
			expect(isMateriaObrigatoriaNoCasamento({ tipo, nivel: 2 })).toBe(esperado);
		});

		it.each([
			['T4: tipo null', { tipo: null, nivel: 2 }],
			['T4: tipo undefined', { tipo: undefined, nivel: 2 }],
			['T4: sem a propriedade tipo', { nivel: 2 }]
		])('%s', (_nome, materia) => {
			expect(isMateriaObrigatoriaNoCasamento(materia)).toBe(true);
		});
	});

	describe('classes e valores limite de nivel', () => {
		it.each([
			['N4: -1 (limite inferior)', -1, true],
			['N1: 0 (limite)', 0, false],
			['N3: 1 (limite superior)', 1, true],
			['N3: 8', 8, true],
			['N2: "0"', '0', false],
			['N2: "1"', '1', true],
			['N5: null', null, true],
			['N5: undefined', undefined, true],
			['N6: string vazia', '', true],
			['N7: "abc"', 'abc', true]
		])('%s', (_nome, nivel, esperado) => {
			expect(isMateriaObrigatoriaNoCasamento({ tipo: 'obrigatoria', nivel })).toBe(esperado);
		});
	});

	it('optativa vale mais que qualquer nível', () => {
		expect(isMateriaObrigatoriaNoCasamento({ tipo: 'optativa', nivel: 0 })).toBe(false);
		expect(isMateriaObrigatoriaNoCasamento({ tipo: 'optativa', nivel: 5 })).toBe(false);
		expect(isMateriaObrigatoriaNoCasamento({ tipo: 'optativa', nivel: null })).toBe(false);
	});

	it('objeto vazio conta como obrigatória', () => {
		expect(isMateriaObrigatoriaNoCasamento({})).toBe(true);
	});

	// Number('  '), Number(false) e Number(-0) dão 0, então passam por A e B e caem como nível 0.
	describe('entradas atípicas (comportamento atual)', () => {
		it.each([
			['N8: "  " (só espaços)', '  '],
			['N8: false', false],
			['N8: -0', -0]
		])('%s é lido como nível 0', (_nome, nivel) => {
			expect(isMateriaObrigatoriaNoCasamento({ tipo: 'obrigatoria', nivel })).toBe(false);
		});
	});
});

describe('filterMateriasPendentesSomenteObrigatorias', () => {
	const obrigatoria = { codigo: 'FGA0001', tipo: 'obrigatoria', nivel: 1 };
	const optativa = { codigo: 'FGA0002', tipo: 'optativa', nivel: 4 };
	const nivelZero = { codigo: 'FGA0003', tipo: 'obrigatoria', nivel: 0 };

	it('lista vazia devolve lista vazia', () => {
		expect(filterMateriasPendentesSomenteObrigatorias([])).toEqual([]);
	});
	it('tira optativas e nível 0 e mantém a ordem das obrigatórias', () => {
		const outra = { codigo: 'FGA0004', tipo: 'obrigatoria', nivel: 2 };
		const resultado = filterMateriasPendentesSomenteObrigatorias([
			obrigatoria,
			optativa,
			nivelZero,
			outra
		]);
		expect(resultado).toEqual([obrigatoria, outra]);
	});
	it('só obrigatórias: a lista volta inteira', () => {
		expect(filterMateriasPendentesSomenteObrigatorias([obrigatoria])).toEqual([obrigatoria]);
	});
	it('só optativas: a lista volta vazia', () => {
		expect(filterMateriasPendentesSomenteObrigatorias([optativa, nivelZero])).toEqual([]);
	});
	it('não mexe na lista original', () => {
		const entrada = [obrigatoria, optativa];
		filterMateriasPendentesSomenteObrigatorias(entrada);
		expect(entrada).toEqual([obrigatoria, optativa]);
	});
});
