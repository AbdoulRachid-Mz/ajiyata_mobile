import { ToastConfig } from 'react-native-toast-message';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const toastConfig: ToastConfig = {
  success: ({ text1, text2, props }) => (
    <View style={{
      backgroundColor: '#16a34a',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    }}>
      <Ionicons name="checkmark-circle" size={24} color="#fff" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>
        {text2 && <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{text2}</Text>}
      </View>
    </View>
  ),
  
  error: ({ text1, text2 }) => (
    <View style={{
      backgroundColor: '#dc2626',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    }}>
      <Ionicons name="alert-circle" size={24} color="#fff" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>
        {text2 && <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{text2}</Text>}
      </View>
    </View>
  ),
  
  info: ({ text1, text2 }) => (
    <View style={{
      backgroundColor: '#3b82f6',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    }}>
      <Ionicons name="information-circle" size={24} color="#fff" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>
        {text2 && <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{text2}</Text>}
      </View>
    </View>
  ),
};