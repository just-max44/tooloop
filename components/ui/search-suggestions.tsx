import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Suggestion {
  label: string;
  onSelect: () => void;
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  visible: boolean;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ suggestions, visible }) => {
  const background = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  if (!visible || suggestions.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: background }]} 
      accessibilityLabel="Suggestions de recherche"
      accessibilityRole="menu"
    >
      {suggestions.map((s, idx) => (
        <TouchableOpacity
          key={s.label}
          style={styles.suggestion}
          onPress={s.onSelect}
          accessibilityRole="menuitem"
        >
          <Text style={[styles.text, { color: text }]}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderRadius: 12,
    padding: 8,
    zIndex: 10,
    elevation: 4,
  },
  suggestion: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  text: {
    fontSize: 16,
  },
});
