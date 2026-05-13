export interface Producto {
  id: number
  nombre: string
  precio: number
  stockDisponible: number
  imagen?: string
}

export interface Personalizacion {
  ingredientesExcluidos: number[]
}

export interface CartItem {
  productoId: number
  producto: Producto
  cantidad: number
  personalizacion: Personalizacion
}
