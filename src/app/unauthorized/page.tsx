
import UnauthorizedAccess from '@/components/common/Unauthorized'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acesso Não Autorizado',
  description: 'Você não possui permissão para acessar esta página.',
}

export default function UnauthorizedPage() {
  return (
    <UnauthorizedAccess
      variant="detailed"
      title="Oops! Acesso Negado"
      message="Parece que você não tem permissão para ver esta página. Verifique suas credenciais e tente novamente."
    />
  )
}
