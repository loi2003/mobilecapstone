import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';

const CustomMealPlanner = () => {
  const [mealPlan, setMealPlan] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
  });

  const handleSave = () => {
    // Implement save functionality (e.g., save to AsyncStorage or API)
    console.log('Saving meal plan:', mealPlan);
    alert('Meal plan saved!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Custom Meal Planner</Text>
        <Text style={styles.headerSubtitle}>
          Create your own meal plan for the day
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Breakfast</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter breakfast plan"
            value={mealPlan.breakfast}
            onChangeText={(text) => setMealPlan({ ...mealPlan, breakfast: text })}
            multiline
          />
        </View>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Lunch</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter lunch plan"
            value={mealPlan.lunch}
            onChangeText={(text) => setMealPlan({ ...mealPlan, lunch: text })}
            multiline
          />
        </View>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Dinner</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter dinner plan"
            value={mealPlan.dinner}
            onChangeText={(text) => setMealPlan({ ...mealPlan, dinner: text })}
            multiline
          />
        </View>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Snacks</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter snacks plan"
            value={mealPlan.snacks}
            onChangeText={(text) => setMealPlan({ ...mealPlan, snacks: text })}
            multiline
          />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Meal Plan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#04668D',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FE6B6A',
    textAlign: 'center',
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
  },
  inputSection: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#04668D',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#555555',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#04668D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#feffe9',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomMealPlanner;