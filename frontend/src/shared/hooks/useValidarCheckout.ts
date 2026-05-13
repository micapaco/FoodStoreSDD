import { useMutation } from '@tanstack/react-query'
import { validarCarritoApi } from '@/shared/api/pedidos'

export function useValidarCheckout() {
  return useMutation({
    mutationFn: validarCarritoApi,
  })
}
