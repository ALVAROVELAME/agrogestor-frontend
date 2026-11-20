import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Animal } from '../types';

interface Props {
  animalEditando: Animal | null;
  onSalvar: (animal: Animal) => void;
  onCancelar: () => void;
}

const CATEGORIAS: Animal['categoria'][] = [
  'Bezerra',
  'Novilha',
  'Vaca em Lactação',
  'Vaca Seca',
];

const MAX_BRINCO = 20;
const MAX_NOME = 40;
const MAX_PRODUCAO = 200;

// ✅ producaoDiaria como `number | ''` para permitir campo vazio
type FormAnimal = {
  brinco: string;
  nome: string;
  categoria: Animal['categoria'];
  producaoDiaria: number | '';
};

const FORM_VAZIO: FormAnimal = {
  brinco: '',
  nome: '',
  categoria: 'Vaca em Lactação',
  producaoDiaria: '',
};

export default function AnimalForm({ animalEditando, onSalvar, onCancelar }: Props) {
  const [form, setForm] = useState<FormAnimal>(() => animalEditando ? {
    brinco: animalEditando.brinco, nome: animalEditando.nome,
    categoria: animalEditando.categoria, producaoDiaria: animalEditando.producaoDiaria,
  } : FORM_VAZIO);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submetido, setSubmetido] = useState(false);

  const brincoRef = useRef<HTMLInputElement>(null);

  // Sincroniza com o animal em edição e foca no primeiro campo
  useEffect(() => {
    if (animalEditando) brincoRef.current?.focus();
  }, [animalEditando]);

  // ---------- Validação ----------
  const erros = useMemo(() => {
    const e: Partial<Record<keyof FormAnimal, string>> = {};

    if (!form.brinco.trim()) e.brinco = 'Brinco é obrigatório';
    else if (form.brinco.length > MAX_BRINCO)
      e.brinco = `Máximo de ${MAX_BRINCO} caracteres`;

    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    else if (form.nome.length > MAX_NOME)
      e.nome = `Máximo de ${MAX_NOME} caracteres`;

    if (form.producaoDiaria !== '') {
      if (form.producaoDiaria < 0) e.producaoDiaria = 'Não pode ser negativo';
      else if (form.producaoDiaria > MAX_PRODUCAO)
        e.producaoDiaria = `Valor irreal (> ${MAX_PRODUCAO} L)`;
    }

    return e;
  }, [form]);

  const formInvalido = Object.keys(erros).length > 0;

  const mostrarErro = (campo: keyof FormAnimal) =>
    (touched[campo] || submetido) && erros[campo];

  // ---------- Handlers ----------
  const atualizar = useCallback(
    <K extends keyof FormAnimal>(campo: K, valor: FormAnimal[K]) => {
      setForm((prev) => ({ ...prev, [campo]: valor }));
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmetido(true);
    if (formInvalido) return;

    // ✅ Converte '' para 0 apenas na hora de salvar
    const animal: Animal = {
      brinco: form.brinco.trim(),
      nome: form.nome.trim(),
      categoria: form.categoria,
      producaoDiaria: form.producaoDiaria === '' ? 0 : form.producaoDiaria,
      ...(animalEditando?.id !== undefined && { id: animalEditando.id }),
    };

    onSalvar(animal);
    setForm(FORM_VAZIO);
    setTouched({});
    setSubmetido(false);
    brincoRef.current?.focus();
  };

  const handleCancelar = useCallback(() => {
    setForm(FORM_VAZIO);
    setTouched({});
    setSubmetido(false);
    onCancelar();
  }, [onCancelar]);

  // Atalho: Esc cancela a edição
  useEffect(() => {
    if (!animalEditando) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [animalEditando, handleCancelar]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {animalEditando && (
        <div className="af-badge">
          Editando: <strong>{animalEditando.nome}</strong> ({animalEditando.brinco})
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[14px]">
        {/* Brinco */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="brinco" className="af-label">
            Brinco *
            <span className="af-counter">
              {form.brinco.length}/{MAX_BRINCO}
            </span>
          </label>
          <input
            id="brinco"
            ref={brincoRef}
            placeholder="Ex.: A-1024"
            value={form.brinco}
            maxLength={MAX_BRINCO}
            onChange={(e) => atualizar('brinco', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, brinco: true }))}
            aria-invalid={!!mostrarErro('brinco')}
            className={`af-input${mostrarErro('brinco') ? ' is-error' : ''}`}
          />
          {mostrarErro('brinco') && (
            <span role="alert" className="af-error">
              {erros.brinco}
            </span>
          )}
        </div>

        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nome" className="af-label">
            Nome *
            <span className="af-counter">
              {form.nome.length}/{MAX_NOME}
            </span>
          </label>
          <input
            id="nome"
            placeholder="Ex.: Mimosa"
            value={form.nome}
            maxLength={MAX_NOME}
            onChange={(e) => atualizar('nome', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
            aria-invalid={!!mostrarErro('nome')}
            className={`af-input${mostrarErro('nome') ? ' is-error' : ''}`}
          />
          {mostrarErro('nome') && (
            <span role="alert" className="af-error">
              {erros.nome}
            </span>
          )}
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className="af-label">
            Categoria
          </label>
          <select
            id="categoria"
            value={form.categoria}
            onChange={(e) =>
              atualizar('categoria', e.target.value as Animal['categoria'])
            }
            className="af-select"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Produção */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="producaoDiaria" className="af-label">
            Produção Diária (L)
          </label>
          <input
            id="producaoDiaria"
            type="number"
            inputMode="decimal"
            min={0}
            max={MAX_PRODUCAO}
            step={0.1}
            placeholder="Ex.: 18.5"
            /* ✅ value pode ser '' — não força zero */
            value={form.producaoDiaria}
            onChange={(e) => {
              const v = e.target.value;
              atualizar('producaoDiaria', v === '' ? '' : Number(v));
            }}
            onBlur={() => setTouched((t) => ({ ...t, producaoDiaria: true }))}
            aria-invalid={!!mostrarErro('producaoDiaria')}
            className={`af-input${mostrarErro('producaoDiaria') ? ' is-error' : ''}`}
          />
          {mostrarErro('producaoDiaria') && (
            <span role="alert" className="af-error">
              {erros.producaoDiaria}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 pt-1.5">
        <button
          type="submit"
          disabled={formInvalido && submetido}
          className="af-btn af-btn--primary"
        >
          {animalEditando ? 'Salvar alterações' : 'Cadastrar animal'}
        </button>

        {animalEditando && (
          <button
            type="button"
            onClick={handleCancelar}
            className="af-btn af-btn--ghost"
          >
            Cancelar <kbd className="af-kbd">Esc</kbd>
          </button>
        )}
      </div>

      {!animalEditando && (
        <p className="af-hint">
          Dica: pressione <kbd className="af-kbd">Enter</kbd> para salvar rapidamente.
        </p>
      )}

    </form>
  );
}
