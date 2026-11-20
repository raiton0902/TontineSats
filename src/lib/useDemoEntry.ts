import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppStore'

/**
 * Opens the sandbox session: seeds/loads the Dakar <-> Paris demo circle from the API
 * when available, or opens an offline throwaway keypair session.
 */
export function useDemoEntry() {
  const { loadSandboxDemo } = useApp()
  const navigate = useNavigate()

  return async () => {
    await loadSandboxDemo(false)
    navigate('/app')
  }
}
