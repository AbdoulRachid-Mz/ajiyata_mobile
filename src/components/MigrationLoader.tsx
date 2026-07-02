import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useDatabaseMigrations } from '@/db';

interface MigrationLoaderProps {
  children: React.ReactNode;
}

export function MigrationLoader({ children }: MigrationLoaderProps) {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>
          Erreur de migration : {error.message}
        </Text>
        <Text style={{ marginTop: 10, textAlign: 'center' }}>
          Veuillez redémarrer l'application ou réinstaller.
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 20 }}>Initialisation de la base de données...</Text>
      </View>
    );
  }

  return <>{children}</>;
}