import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Modal } from './Modal';
import type { SortBy, Category, Location } from '@/types';

interface FilterSortBarProps {
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
  categoryFilter?: number;
  locationFilter?: number;
  statusFilter?: string;
  onFiltersChange: (filters: {
    categoryId?: number;
    locationId?: number;
    status?: string;
  }) => void;
  categories?: Category[];
  locations?: Location[];
  onClearFilters: () => void;
}

const SORT_OPTIONS: { value: SortBy; label: string; icon: string }[] = [
  { value: 'expiry_date', label: '按到期时间', icon: 'time-outline' },
  { value: 'created_at', label: '按添加时间', icon: 'add-circle-outline' },
  { value: 'name', label: '按名称', icon: 'text-outline' },
  { value: 'quantity', label: '按数量', icon: 'layers-outline' },
];

const STATUS_OPTIONS = [
  { value: 'normal', label: '正常', color: '#4CAF50' },
  { value: 'expiring_soon', label: '即将过期', color: '#FF9800' },
  { value: 'expired', label: '已过期', color: '#F44336' },
];

export function FilterSortBar({
  sortBy,
  onSortChange,
  categoryFilter,
  locationFilter,
  statusFilter,
  onFiltersChange,
  categories = [],
  locations = [],
  onClearFilters,
}: FilterSortBarProps) {
  const { theme } = useTheme();
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const currentSortOption = SORT_OPTIONS.find(option => option.value === sortBy);
  const hasActiveFilters = categoryFilter || locationFilter || statusFilter;

  const handleFilterChange = (type: 'category' | 'location' | 'status', value?: number | string) => {
    const newFilters = {
      categoryId: categoryFilter,
      locationId: locationFilter,
      status: statusFilter,
    };

    if (type === 'category') {
      newFilters.categoryId = value as number | undefined;
    } else if (type === 'location') {
      newFilters.locationId = value as number | undefined;
    } else if (type === 'status') {
      newFilters.status = value as string | undefined;
    }

    onFiltersChange(newFilters);
  };

  return (
    <>
      <View style={styles.container}>
        {/* 排序按钮 */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
          ]}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons
            name={currentSortOption?.icon as any}
            size={16}
            color={theme.colors.primary}
          />
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            {currentSortOption?.label}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {/* 筛选按钮 */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: hasActiveFilters ? theme.colors.primary : theme.colors.surface,
              borderColor: hasActiveFilters ? theme.colors.primary : theme.colors.border,
            }
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="filter"
            size={16}
            color={hasActiveFilters ? '#fff' : theme.colors.primary}
          />
          <Text style={[
            styles.buttonText,
            { color: hasActiveFilters ? '#fff' : theme.colors.text }
          ]}>
            筛选
          </Text>
          {hasActiveFilters && (
            <View style={[styles.filterBadge, { backgroundColor: '#fff' }]}>
              <Text style={[styles.filterBadgeText, { color: theme.colors.primary }]}>
                {[categoryFilter, locationFilter, statusFilter].filter(Boolean).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 清除筛选按钮 */}
        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: theme.colors.border }]}
            onPress={onClearFilters}
          >
            <Ionicons
              name="close"
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 排序模态框 */}
      <Modal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        title="选择排序方式"
      >
        <View style={styles.modalContent}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalOption,
                { borderBottomColor: theme.colors.border }
              ]}
              onPress={() => {
                onSortChange(option.value);
                setShowSortModal(false);
              }}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={sortBy === option.value ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[
                styles.modalOptionText,
                {
                  color: sortBy === option.value ? theme.colors.primary : theme.colors.text,
                  fontWeight: sortBy === option.value ? '600' : 'normal',
                }
              ]}>
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* 筛选模态框 */}
      <Modal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="筛选条件"
      >
        <ScrollView style={styles.modalContent}>
          {/* 状态筛选 */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>
              食物状态
            </Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: !statusFilter ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => handleFilterChange('status', undefined)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: !statusFilter ? '#fff' : theme.colors.text }
                ]}>
                  全部
                </Text>
              </TouchableOpacity>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: statusFilter === status.value ? status.color : theme.colors.surface,
                      borderColor: statusFilter === status.value ? status.color : theme.colors.border,
                    }
                  ]}
                  onPress={() => handleFilterChange('status', statusFilter === status.value ? undefined : status.value)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: statusFilter === status.value ? '#fff' : theme.colors.text }
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 分类筛选 */}
          {categories.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>
                食物分类
              </Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: !categoryFilter ? theme.colors.primary : theme.colors.surface,
                      borderColor: theme.colors.border,
                    }
                  ]}
                  onPress={() => handleFilterChange('category', undefined)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: !categoryFilter ? '#fff' : theme.colors.text }
                  ]}>
                    全部
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: categoryFilter === category.id ? theme.colors.primary : theme.colors.surface,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => handleFilterChange('category', categoryFilter === category.id ? undefined : category.id)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: categoryFilter === category.id ? '#fff' : theme.colors.text }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 位置筛选 */}
          {locations.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>
                存放位置
              </Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: !locationFilter ? theme.colors.primary : theme.colors.surface,
                      borderColor: theme.colors.border,
                    }
                  ]}
                  onPress={() => handleFilterChange('location', undefined)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: !locationFilter ? '#fff' : theme.colors.text }
                  ]}>
                    全部
                  </Text>
                </TouchableOpacity>
                {locations.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: locationFilter === location.id ? theme.colors.primary : theme.colors.surface,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => handleFilterChange('location', locationFilter === location.id ? undefined : location.id)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: locationFilter === location.id ? '#fff' : theme.colors.text }
                    ]}>
                      {location.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContent: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});