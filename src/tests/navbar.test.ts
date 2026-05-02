import { describe, it, expect } from 'vitest'

vi.mock('react', async () => vi.importActual('react'))
vi.mock('react-router-dom', () => ({
  Link: () => null,
  useLocation: () => ({ pathname: '/home' }),
  useNavigate: () => () => {},
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))
vi.mock('@/assets/predictlab-icon-new.png', () => ({ default: '' }))

import { NAV_ITEMS } from '../components/layout/Navbar'

const EXPECTED_ORDER = [
  'Home',
  'Cadastrar Pet',
  'Meus Pacientes',
  'Consulta Guiada',
  'Exames',
  'Laudo US',
  'Comparativo',
]

describe('NAV_ITEMS order', () => {
  it('has exactly 7 items', () => {
    expect(NAV_ITEMS).toHaveLength(7)
  })

  it('renders in the correct sequence', () => {
    expect(NAV_ITEMS.map(i => i.label)).toEqual(EXPECTED_ORDER)
  })
})
