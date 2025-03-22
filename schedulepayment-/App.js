import React, { useState, useEffect, createContext } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';

const PaymentContext = createContext();

const categories = ['Recharge', 'Utility', 'Loan Payment', 'Subscription', 'Insurance', 'Credit Payment', 'Rent', 'Investment'];
const frequencies = ['One-Time', 'Monthly', 'Quarterly', 'Yearly'];

const ScheduledPaymentsApp = () => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Recharge');
  const [frequency, setFrequency] = useState('One-Time');
  const [notes, setNotes] = useState('');
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [paymentsOnSelectedDate, setPaymentsOnSelectedDate] = useState([]);

  useEffect(() => {
    loadScheduledPayments();
  }, []);

  const loadScheduledPayments = async () => {
    const data = await AsyncStorage.getItem('scheduledPayments');
    if (data) setScheduledPayments(JSON.parse(data));
  };

  const schedulePayment = async () => {
    if (!amount || !date || !title) {
      alert('Title, Amount, and Date are required');
      return;
    }
    const newPayment = { title, amount, date, category, frequency, notes, status: 'Scheduled' };
    const updatedPayments = [...scheduledPayments, newPayment];
    setScheduledPayments(updatedPayments);
    await AsyncStorage.setItem('scheduledPayments', JSON.stringify(updatedPayments));
    resetFields();
  };

  const resetFields = () => {
    setTitle('');
    setAmount('');
    setDate('');
    setCategory('Recharge');
    setFrequency('One-Time');
    setNotes('');
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDate(formattedDate);
    }
  };

  const markedDates = scheduledPayments.reduce((acc, payment) => {
    acc[payment.date] = { marked: true, dotColor: 'blue' };
    return acc;
  }, {});

  const handleDayPress = (day) => {
    setSelectedCalendarDate(day.dateString);
    const payments = scheduledPayments.filter(payment => payment.date === day.dateString);
    setPaymentsOnSelectedDate(payments);
  };

  return (
    <PaymentContext.Provider value={{ scheduledPayments, schedulePayment }}>
      <ScrollView style={styles.container}>
        
        {/* 📝 Schedule Form */}
        <Text style={styles.header}>Schedule a Payment</Text>
        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput style={styles.input} placeholder="Select Date" value={date} editable={false} pointerEvents="none" />
        </TouchableOpacity>
        {showDatePicker && <DateTimePicker mode="date" value={new Date()} onChange={onDateChange} />}

        <Text style={styles.label}>Category:</Text>
        <Picker selectedValue={category} onValueChange={setCategory}>
          {categories.map((cat) => <Picker.Item label={cat} value={cat} key={cat} />)}
        </Picker>

        <Text style={styles.label}>Frequency:</Text>
        <Picker selectedValue={frequency} onValueChange={setFrequency}>
          {frequencies.map((freq) => <Picker.Item label={freq} value={freq} key={freq} />)}
        </Picker>

        <TextInput style={styles.input} placeholder="Notes / Description" value={notes} onChangeText={setNotes} />

        <Button title="Schedule Payment" onPress={schedulePayment} />

        {/* 📜 Schedule History */}
        <Text style={styles.header}>Scheduled Payments History:</Text>
        <FlatList
          data={scheduledPayments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.paymentItem}>
              <Text>Title: {item.title}</Text>
              <Text>Amount: {item.amount}</Text>
              <Text>Date: {item.date}</Text>
              <Text>Category: {item.category}</Text>
              <Text>Frequency: {item.frequency}</Text>
              <Text>Notes: {item.notes}</Text>
              <Text>Status: {item.status}</Text>
            </View>
          )}
        />

        {/* 📅 Calendar */}
        <Text style={styles.header}>Payment Calendar:</Text>
        <Calendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{ selectedDayBackgroundColor: 'blue', todayTextColor: 'red' }}
        />

        {/* 🗓 Payments for Selected Date */}
        {selectedCalendarDate !== '' && (
          <View>
            <Text style={styles.header}>Payments on {selectedCalendarDate}:</Text>
            {paymentsOnSelectedDate.length > 0 ? (
              paymentsOnSelectedDate.map((item, index) => (
                <View key={index} style={styles.paymentItem}>
                  <Text>Title: {item.title}</Text>
                  <Text>Amount: {item.amount}</Text>
                  <Text>Category: {item.category}</Text>
                  <Text>Frequency: {item.frequency}</Text>
                  <Text>Notes: {item.notes}</Text>
                  <Text>Status: {item.status}</Text>
                </View>
              ))
            ) : (
              <Text>No payments scheduled.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </PaymentContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  header: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 5 },
  label: { marginTop: 10, fontWeight: 'bold' },
  paymentItem: { padding: 10, borderWidth: 1, marginVertical: 5, borderRadius: 5 },
});

export default ScheduledPaymentsApp;
