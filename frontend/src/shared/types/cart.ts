export interface Producto {
  id: number
  nombre: string
  precio: number
  stockDisponible: number
  imagen?: string
}

export interface Personalizacion {
  ingredientesExcluidos: number[]
  notas?: string
}

export interface CartItem {
  productoId: number
  producto: Producto
  cantidad: number
  personalizacion: Personalizacion
}
