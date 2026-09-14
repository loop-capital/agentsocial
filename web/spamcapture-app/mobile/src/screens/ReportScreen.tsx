/**
 * Report Screen
 * Submit spam reports (SMS or Call)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import { CATEGORIES } from '../constants/categories';
import { useReportsStore } from '../store/reportsStore';

export default function ReportScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { submitReport, isLoading, error, clearError } = useReportsStore();
  
  const { type = 'sms' } = route.params as { type: 'sms' | 'call' };
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callerId, setCallerId] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('spam');
  
  const isSMS = type === 'sms';
  
  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    
    // Basic phone validation
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    clearError();
    
    const success = await submitReport({
      phoneNumber: cleanedNumber,
      callerId: callerId.trim() || undefined,
      type,
      content: content.trim() || undefined,
      category: selectedCategory,
      timestamp: new Date().toISOString(),
    });
    
    if (success) {
      Alert.alert(
        'Thank You!',
        'Your report has been submitted successfully. Together we\'re building a safer community.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else if (error) {
      Alert.alert('Error', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Report {isSMS ? 'Text Message' : 'Phone Call'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Type Indicator */}
        <View style={styles.typeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: isSMS ? COLORS.warning + '20' : COLORS.danger + '20' }]} >
            <Ionicons 
              name={isSMS ? 'chatbubble-ellipses' : 'call'} 
              size={20} 
              color={isSMS ? COLORS.warning : COLORS.danger} 
            />
            <Text style={[styles.typeText, { color: isSMS ? COLORS.warning : COLORS.danger }]} >
              {isSMS ? 'SMS/MMS' : 'Phone Call'}
            </Text>
          </View>
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoFocus
            />
          </View>
        </View>

        {/* Caller ID (optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caller ID (optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Name shown on caller ID"
              value={callerId}
              onChangeText={setCallerId}
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon} 
                  size={18} 
                  color={selectedCategory === category.id ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content/Message */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{isSMS ? 'Message Content' : 'Call Details'} (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder={
              isSMS 
                ? "Paste the spam message content here..."
                : "Describe what the caller said..."
            }
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{content.length}/1000</Text>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
          <Text style={styles.privacyText}>
            Your report is anonymous. We never share your personal information.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  typeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: COLORS.text,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  privacyText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '10',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.danger,
  },
});
