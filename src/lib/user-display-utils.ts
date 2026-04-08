// Utilidad compartida para obtener el nombre display de un usuario
export const getUserDisplayName = (userIdentifier: string | null | undefined): string => {
  if (!userIdentifier) return 'Usuario desconocido';
  
  // Si es "system" o generado automáticamente, mostrar como generado automáticamente
  if (userIdentifier.toLowerCase() === 'system' || 
      userIdentifier === '(Generado automáticamente)' || 
      userIdentifier.toLowerCase() === 'sistema automático') {
    return 'Sistema Automático';
  }
  
  // Si ya es un nombre (contiene espacios y no tiene @), devolverlo tal cual
  if (!userIdentifier.includes('@') && userIdentifier.includes(' ')) {
    return userIdentifier;
  }
  
  // Mapear emails conocidos a nombres reales
  const emailToNameMap: Record<string, string> = {
    'jefe@calidad.com': 'Jefe de Calidad',
    'operario@calidad.com': 'Supervisor',
    'diegoy2312@gmail.com': 'Diego',
    'diesilva1709@gmail.com': 'Diego Silva',
    // Agregar más mapeos según sea necesario
  };
  
  // Si es un email conocido, devolver el nombre
  if (emailToNameMap[userIdentifier]) {
    return emailToNameMap[userIdentifier];
  }
  
  // Si parece ser un email pero no está mapeado, intentar extraer el nombre del email
  if (userIdentifier.includes('@')) {
    const emailPrefix = userIdentifier.split('@')[0];
    // Convertir formato como "jefe.calidad" a "Jefe Calidad"
    const nameFromEmail = emailPrefix
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
    return nameFromEmail;
  }
  
  // Si ya es un nombre (no contiene @ y no es "system"), devolverlo tal cual
  return userIdentifier;
};

export const getRoleDisplayName = (role: string | null | undefined): string => {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'jefe') return 'Jefe de Calidad';
  if (r === 'operario' || r === 'supervisor') return 'Supervisor';
  if (r === 'tecnico') return 'Técnico de Calidad';
  return r || '—';
};
