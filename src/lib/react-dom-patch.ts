/**
 * Patch para solucionar el error de removeChild en React 19
 * Este error ocurre cuando hay inconsistencias entre el DOM virtual y el DOM real
 */

// Solo aplicar el patch en el cliente (browser)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Guardar los métodos originales
  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;
  const originalReplaceChild = Node.prototype.replaceChild;

  // Patch para removeChild
  Node.prototype.removeChild = function(child: Node): Node {
    try {
      // Intentar remover normalmente
      return originalRemoveChild.call(this, child);
    } catch (error) {
      // Si hay un error, verificar si el nodo está en el DOM
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        console.warn('React removeChild error parchado:', error.message);
        
        // Verificar si el nodo tiene un padre diferente
        if (child.parentNode && child.parentNode !== this) {
          // El nodo está en otro lugar, removerlo desde allí
          return child.parentNode.removeChild(child);
        }
        
        // Si no está en el DOM o ya fue removido, retornar el nodo
        return child;
      }
      
      // Si es otro tipo de error, lanzarlo normalmente
      throw error;
    }
  };

  // Patch para insertBefore
  Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null): Node {
    try {
      // Intentar insertar normalmente
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (error) {
      // Si hay un error de insertBefore
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        console.warn('React insertBefore error parchado:', error.message);
        
        // Si referenceNode no es hijo de este nodo, intentar insertar al final
        if (referenceNode && !this.contains(referenceNode)) {
          return this.appendChild(newNode);
        }
        
        // Si newNode ya está en el DOM, removerlo primero
        if (newNode.parentNode) {
          newNode.parentNode.removeChild(newNode);
        }
        
        // Insertar al final como fallback
        return this.appendChild(newNode);
      }
      
      // Si es otro tipo de error, lanzarlo normalmente
      throw error;
    }
  };

  // Patch para replaceChild
  Node.prototype.replaceChild = function(newChild: Node, oldChild: Node): Node {
    try {
      // Intentar reemplazar normalmente
      return originalReplaceChild.call(this, newChild, oldChild);
    } catch (error) {
      // Si hay un error de replaceChild
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        console.warn('React replaceChild error parchado:', error.message);
        
        // Si oldChild no es hijo de este nodo, solo insertar el nuevo
        if (!this.contains(oldChild)) {
          return this.appendChild(newChild);
        }
        
        // Si newChild ya está en el DOM, removerlo primero
        if (newChild.parentNode) {
          newChild.parentNode.removeChild(newChild);
        }
        
        // Insertar el nuevo y remover el viejo
        this.appendChild(newChild);
        this.removeChild(oldChild);
        return newChild;
      }
      
      // Si es otro tipo de error, lanzarlo normalmente
      throw error;
    }
  };

  // Patch para removeChild en contenedores
  const originalRemoveChildFromContainer = (Node as any).prototype?.removeChildFromContainer;
  if (originalRemoveChildFromContainer) {
    (Node as any).prototype.removeChildFromContainer = function(child: Node): void {
      try {
        return originalRemoveChildFromContainer.call(this, child);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          console.warn('React removeChildFromContainer error parchado:', error.message);
          return;
        }
        throw error;
      }
    };
  }

  console.log('React DOM patch aplicado para solucionar removeChild, insertBefore y replaceChild errors');
}

// Exportar una función para aplicar el patch (opcional)
export function applyReactDOMPatch() {
  // El patch se aplica automáticamente al cargar el módulo en el cliente
}
