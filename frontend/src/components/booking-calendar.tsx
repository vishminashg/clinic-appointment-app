import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';

export function clinicToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

type CalendarProps = {
  values: string[];
  onSelect: (date: string) => void;
  allowedDates?: string[];
  multiple?: boolean;
};

export function BookingCalendar({ values, onSelect, allowedDates, multiple }: CalendarProps) {
  const today = clinicToday();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(`${values.find(date => date >= today) || today}T00:00:00Z`));
  const year = month.getUTCFullYear();
  const index = month.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, index, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <View>
      <Button title={multiple ? 'Choose available dates' : values[0] || 'Choose date'} onPress={() => setOpen(current => !current)} />
      {open && <>
        <View style={styles.navigation}>
          <Button title="Previous" disabled={month.toISOString().slice(0, 7) <= today.slice(0, 7)}
            onPress={() => setMonth(new Date(Date.UTC(year, index - 1, 1)))} />
          <Text>{monthLabel}</Text>
          <Button title="Next" onPress={() => setMonth(new Date(Date.UTC(year, index + 1, 1)))} />
        </View>
        <View style={styles.grid}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
            <Text key={day} style={styles.cell}>{day}</Text>)}
          {Array.from({ length: firstDay }, (_, i) => <View key={`blank-${i}`} style={styles.cell} />)}
          {Array.from({ length: days }, (_, i) => {
            const date = new Date(Date.UTC(year, index, i + 1)).toISOString().slice(0, 10);
            const selected = values.includes(date);
            const disabled = date < today || (allowedDates !== undefined && !allowedDates.includes(date));
            return (
              <TouchableOpacity key={date} disabled={disabled} accessibilityRole="button"
                accessibilityLabel={date} accessibilityState={{ disabled, selected }}
                style={[styles.cell, styles.day, selected && styles.selected]}
                onPress={() => { onSelect(date); if (!multiple) setOpen(false); }}>
                <Text style={selected ? styles.selectedText : disabled ? styles.disabled : undefined}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {multiple && <Button title="Done" onPress={() => setOpen(false)} />}
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', textAlign: 'center' },
  day: { height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  selected: { backgroundColor: COLORS.primary },
  selectedText: { color: COLORS.white },
  disabled: { opacity: 0.35 },
});
