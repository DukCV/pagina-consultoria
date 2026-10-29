import { Component } from 'react'

/**
 * Aísla los fallos de renderizado (p. ej. un chunk de escena que no llega por red) para que
 * el slider, los títulos y los controles sigan funcionando con un marcador de posición.
 */
export default class SceneErrorBoundary extends Component {
  state = { hasFailed: false }

  static getDerivedStateFromError() {
    return { hasFailed: true }
  }

  componentDidCatch(error) {
    console.warn('[hero] La escena no pudo cargarse; se muestra un marcador de posición.', error?.message ?? error)
  }

  render() {
    return this.state.hasFailed ? this.props.fallback : this.props.children
  }
}
