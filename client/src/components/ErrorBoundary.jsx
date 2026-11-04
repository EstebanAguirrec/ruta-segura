import { Component } from 'react';

// Aísla los fallos de una parte de la interfaz (R12): lo que quede fuera sigue funcionando.
export default class ErrorBoundary extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children;
  }
}
