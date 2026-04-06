import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function FeedScreen() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from('plans')
        .select(`id, title, description, start_date, image_url, location`)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
      } else {
        setPlans(data || []);
      }
      setLoading(false);
    }

    fetchPlans();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  const openChat = (planId: string) => {
    router.push(`/chat/${planId}`);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{formatDate(item.start_date)}</Text>
        <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => openChat(item.id)}>
          <Text style={styles.buttonText}>Abrir Chat del Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explorar Planazos</Text>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" />
      ) : plans.length === 0 ? (
        <Text style={styles.empty}>No hay planes próximamente</Text>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 60,
    marginBottom: 10,
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    backgroundColor: '#EEE',
  },
  cardContent: {
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#E44E20', /* Planazos branding accent guess */
    fontWeight: '600',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    margin: 20,
    color: '#888',
  },
});
