import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getAllCustomChecklistsByGrowthData } from '../../api/custom-checklist-api';
import { getAllChecklistProgressForGrowthData } from '../../api/template-checklist-api';

const TrimesterChecklists = ({ growthDataId }) => {
  const { width } = useWindowDimensions(); // Use hook instead of module-level Dimensions
  const [activeTab, setActiveTab] = useState('first');
  const [templateChecklists, setTemplateChecklists] = useState([]);
  const [customChecklists, setCustomChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const fetchData = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!growthDataId || !token) return;

    setLoading(true);
    try {
      const [templateRes, customRes] = await Promise.all([
        getAllChecklistProgressForGrowthData(growthDataId, token),
        getAllCustomChecklistsByGrowthData(growthDataId, token),
      ]);

      setTemplateChecklists(templateRes.data?.data || []);
      setCustomChecklists(customRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [growthDataId]);

  const handleItemToggle = (itemId) => {
    const updated = templateChecklists.map((item) =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setTemplateChecklists(updated);
  };

  const getTabLabel = (tab) => {
    const labels = {
      first: 'First Trimester',
      second: 'Second Trimester',
      third: 'Third Trimester',
    };
    return labels[tab];
  };

  const filterChecklistsByTrimester = (checklists, trimester) =>
    checklists.filter((item) => item.trimester === trimester);

  const tabToNumber = (tab) => {
    switch (tab) {
      case 'first':
        return 1;
      case 'second':
        return 2;
      case 'third':
        return 3;
      default:
        return 0;
    }
  };

  if (!growthDataId) {
    return (
      <Text style={styles(width).errorText}>
        Missing tracking information. Please try again later.
      </Text>
    );
  }

  return (
    <View style={styles(width).trimesterChecklists}>
      <Text style={styles(width).header}>Trimester Checklists</Text>

      <View style={styles(width).checklistTabs}>
        {['first', 'second', 'third'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles(width).tabBtn, activeTab === tab ? styles(width).tabBtnActive : {}]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles(width).tabBtnText, activeTab === tab ? styles(width).tabBtnTextActive : {}]}>
              {getTabLabel(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles(width).checklistContent}>
        {loading ? (
          <Text style={styles(width).loadingText}>Loading...</Text>
        ) : (
          <>
            <View style={styles(width).checklistSection}>
              <Text style={styles(width).sectionHeader}>Things you will experience in the future!</Text>
              <View style={styles(width).checklistItems}>
                {filterChecklistsByTrimester(templateChecklists, tabToNumber(activeTab)).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles(width).checklistItem}
                    onPress={() => handleItemToggle(item.id)}
                  >
                    <View style={[styles(width).checkmark, item.isCompleted ? styles(width).checkmarkChecked : {}]}>
                      {item.isCompleted && <Text style={styles(width).checkmarkIcon}>✓</Text>}
                    </View>
                    <Text style={[styles(width).itemLabel, item.isCompleted ? styles(width).itemLabelChecked : {}]}>
                      {item.taskName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles(width).checklistSection}>
              <Text style={styles(width).sectionHeader}>Your Custom Checklists</Text>
              <View style={styles(width).checklistItems}>
                {filterChecklistsByTrimester(customChecklists, tabToNumber(activeTab)).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles(width).checklistItem}
                    onPress={() => handleItemToggle(item.id)}
                  >
                    <View style={[styles(width).checkmark, item.isCompleted ? styles(width).checkmarkChecked : {}]}>
                      {item.isCompleted && <Text style={styles(width).checkmarkIcon}>✓</Text>}
                    </View>
                    <Text style={[styles(width).itemLabel, item.isCompleted ? styles(width).itemLabelChecked : {}]}>
                      {item.taskName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles(width).addCustomTaskBtn}
          onPress={() => navigation.navigate('AddCustomTask')}
        >
          <Text style={styles(width).addCustomTaskBtnIcon}>➕</Text>
          <Text style={styles(width).addCustomTaskBtnText}>Add Custom Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles as a function to accept width
const styles = (width) => StyleSheet.create({
  trimesterChecklists: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: width < 768 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    color: '#04668D',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  checklistTabs: {
    flexDirection: width < 768 ? 'column' : 'row',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: width < 768 ? 0 : 2,
    borderBottomColor: '#F4F4F4',
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: width < 768 ? 0 : 2,
    borderBottomColor: 'transparent',
    borderLeftWidth: width < 768 ? 2 : 0,
    borderLeftColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: width < 768 ? '#F4F4F4' : '#FFFFFF',
    borderBottomColor: width < 768 ? 'transparent' : '#067DAD',
    borderLeftColor: width < 768 ? '#067DAD' : 'transparent',
  },
  tabBtnText: {
    color: '#038474',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#067DAD',
    fontWeight: '700',
  },
  checklistContent: {
    minHeight: 300,
  },
  checklistSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#038474',
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',
    paddingBottom: 4,
  },
  checklistItems: {
    flexDirection: 'column',
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 6,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#038474',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkChecked: {
    backgroundColor: '#04668D',
    borderColor: '#04668D',
  },
  checkmarkIcon: {
    color: '#FAFAFA',
    fontSize: 14,
  },
  itemLabel: {
    color: '#038474',
    fontSize: 14,
    lineHeight: 20,
  },
  itemLabelChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  addCustomTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#038474',
    borderRadius: 6,
    justifyContent: 'center',
  },
  addCustomTaskBtnIcon: {
    fontSize: 16,
    color: '#038474',
  },
  addCustomTaskBtnText: {
    color: '#038474',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: '#848785',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FE6B6A',
    textAlign: 'center',
  },
});

export default TrimesterChecklists;