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

const FORM_VAZIO: Omit<Animal, 'id'> = {
  brinco: '',
  nome: '',
  categoria: 'Vaca em Lactação',
  producaoDiaria: 0,
};

const MAX_BRINCO = 20;
const MAX_NOME = 40;

export default function AnimalForm({ animalEditando, onSalvar, onCancelar }: Props) {
  const [form, setForm] = useState<Omit<Animal, 'id'>>(FORM_VAZIO);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submetido, setSubmetido] = useState(false);

  const brincoRef = useRef<HTMLInputElement>(null);

  // Sincroniza com o animal em edição e foca no primeiro campo
  useEffect(() => {
    if (animalEditando) {
      const { id, ...resto } = animalEditando;
      setForm(resto);
      setTouched({});
      setSubmetido(false);
      brincoRef.current?.focus();
    } else {
      setForm(FORM_VAZIO);
    }
  }, [animalEditando]);

  // ---------- Validação ----------
  const erros = useMemo(() => {
    const e: Partial<Record<keyof Omit<Animal, 'id'>, string>> = {};
    if (!form.brinco.trim()) e.brinco = 'Brinco é obrigatório';
    else if (form.brinco.length > MAX_BRINCO)
      e.brinco = `Máximo de ${MAX_BRINCO} caracteres`;

    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    else if (form.nome.length > MAX_NOME)
      e.nome = `Máximo de ${MAX_NOME} caracteres`;

    if (form.producaoDiaria < 0) e.producaoDiaria = 'Não pode ser negativo';
    if (form.producaoDiaria > 200) e.producaoDiaria = 'Valor irreal (> 200 L)';

    return e;
  }, [form]);

  const formInvalido = Object.keys(erros).length > 0;

  const mostrarErro = (campo: keyof typeof form) =>
    (touched[campo] || submetido) && erros[campo];

  // ---------- Handlers ----------
  const atualizar = useCallback(
    <K extends keyof Omit<Animal, 'id'>>(campo: K, valor: Omit<Animal, 'id'>[K]) => {
      setForm((prev) => ({ ...prev, [campo]: valor }));
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmetido(true);
    if (formInvalido) return;

    onSalvar({ ...form, id: animalEditando?.id } as Animal);
    setForm(FORM_VAZIO);
    setTouched({});
    setSubmetido(false);
    brincoRef.current?.focus();
  };

  const handleCancelar = () => {
    setForm(FORM_VAZIO);
    setTouched({});
    setSubmetido(false);
    onCancelar();
  };

  // Atalho: Esc cancela a edição
  useEffect(() => {
    if (!animalEditando) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [animalEditando]);

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <header style={styles.header}>
        <h3 style={styles.title}>
          {animalEditando ? '✏️ Editar Animal' : '➕ Novo Animal'}
        </h3>
        {animalEditando && (
          <span style={styles.badge}>
            Editando: <strong>{animalEditando.nome}</strong> ({animalEditando.brinco})
          </span>
        )}
      </header>

      <div style={styles.grid}>
        {/* Brinco */}
        <div style={styles.field}>
          <label htmlFor="brinco" style={styles.label}>
            Brinco *
            <span style={styles.counter}>
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
            style={{
              ...styles.input,
              ...(mostrarErro('brinco') ? styles.inputError : null),
            }}
          />
          {mostrarErro('brinco') && (
            <span role="alert" style={styles.errorMsg}>
              {erros.brinco}
            </span>
          )}
        </div>

        {/* Nome */}
        <div style={styles.field}>
          <label htmlFor="nome" style={styles.label}>
            Nome *
            <span style={styles.counter}>
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
            style={{
              ...styles.input,
              ...(mostrarErro('nome') ? styles.inputError : null),
            }}
          />
          {mostrarErro('nome') && (
            <span role="alert" style={styles.errorMsg}>
              {erros.nome}
            </span>
          )}
        </div>

        {/* Categoria */}
        <div style={styles.field}>
          <label htmlFor="categoria" style={styles.label}>
            Categoria
          </label>
          <select
            id="categoria"
            value={form.categoria}
            onChange={(e) =>
              atualizar('categoria', e.target.value as Animal['categoria'])
            }
            style={styles.select}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Produção */}
        <div style={styles.field}>
          <label htmlFor="producaoDiaria" style={styles.label}>
            Produção Diária (L)
          </label>
          <input
            id="producaoDiaria"
            type="number"
            min={0}
            max={200}
            step={0.1}
            placeholder="Ex.: 18.5"
            value={form.producaoDiaria}
            onChange={(e) =>
              atualizar('producaoDiaria', Number(e.target.value) || 0)
            }
            onBlur={() => setTouched((t) => ({ ...t, producaoDiaria: true }))}
            aria-invalid={!!mostrarErro('producaoDiaria')}
            style={{
              ...styles.input,
              ...(mostrarErro('producaoDiaria') ? styles.inputError : null),
            }}
          />
          {mostrarErro('producaoDiaria') && (
            <span role="alert" style={styles.errorMsg}>
              {erros.producaoDiaria}
            </span>
          )}
        </div>
      </div>

      <footer style={styles.actions}>
        <button
          type="submit"
          disabled={formInvalido && submetido}
          style={{
            ...styles.btnPrimary,
            ...(formInvalido && submetido ? styles.btnDisabled : null),
          }}
        >
          {animalEditando ? 'Salvar alterações' : 'Cadastrar animal'}
        </button>

        {animalEditando && (
          <button type="button" onClick={handleCancelar} style={styles.btnGhost}>
            Cancelar <span style={styles.kbd}>Esc</span>
          </button>
        )}
      </footer>

      {/* Dica de atalho */}
      {!animalEditando && (
        <p style={styles.hint}>
          Dica: pressione <span style={styles.kbd}>Enter</span> para salvar
          rapidamente.
        </p>
      )}
    </form>
  );
}

// ---------- Estilos ----------
const styles: Record<string, React.CSSProperties> = {
  form: {
    background: '#fff',
    border: '1px solid #e3ece3',
    borderRadius: 12,
    padding: '20px 20px 16px',
    marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  title: { margin: 0, fontSize: '1.1rem', color: '#1f5f2b' },
  badge: {
    background: '#fff4d6',
    color: '#8a6300',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: '0.8rem',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#3b5a3b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: { fontSize: '0.7rem', color: '#8aa08a', fontWeight: 400 },

  input: {
    padding: '10px 12px',
    border: '1px solid #cddccd',
    borderRadius: 8,
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    background: '#fff',
  },
  inputError: {
    borderColor: '#d94c4c',
    boxShadow: '0 0 0 3px rgba(217,76,76,0.12)',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #cddccd',
    borderRadius: 8,
    fontSize: '0.95rem',
    background: '#fff',
    outline: 'none',
  },
  errorMsg: { color: '#d94c4c', fontSize: '0.78rem' },

  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '10px 18px',
    background: '#1f5f2b',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  btnGhost: {
    padding: '10px 18px',
    background: 'transparent',
    color: '#1f5f2b',
    border: '1px solid #1f5f2b',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
  },
  kbd: {
    background: '#eef4ee',
    border: '1px solid #cddccd',
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: '0.75rem',
    color: '#3b5a3b',
    marginLeft: 4,
  },
  hint: { margin: '12px 0 0', fontSize: '0.78rem', color: '#8aa08a' },
};