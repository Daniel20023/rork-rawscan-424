import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  Clock, 
  BarChart3,
  Target,
  Award,
  Zap
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useProductHistory } from '@/contexts/ProductHistoryContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { getHealthScore } from '@/utils/scoring';
import { ModernCard, ProgressBar } from './ModernComponents';
import { Colors, BorderRadius, Shadows, FontWeights, Spacing } from '@/constants/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // Account for padding and gap

export const Dashboard: React.FC = () => {
  const { history, favorites } = useProductHistory();
  const preferences = useUserPreferences();

  const recentScans = useMemo(() => {
    return history.slice(0, 3);
  }, [history]);

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyScans = history.filter(item => 
      new Date(item.scannedAt) >= weekAgo
    );
    
    const totalScans = weeklyScans.length;
    const averageScore = weeklyScans.length > 0 
      ? weeklyScans.reduce((sum, item) => 
          sum + getHealthScore(item.product, preferences), 0
        ) / weeklyScans.length
      : 0;
    
    const healthyChoices = weeklyScans.filter(item => 
      getHealthScore(item.product, preferences) >= 70
    ).length;
    
    return {
      totalScans,
      averageScore: Math.round(averageScore),
      healthyChoices,
      healthyPercentage: totalScans > 0 ? (healthyChoices / totalScans) * 100 : 0,
    };
  }, [history, preferences]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return Colors.health.excellent;
    if (score >= 60) return Colors.health.fair;
    return Colors.health.poor;
  };

  const getScoreGradient = (score: number): [string, string] => {
    if (score >= 80) return [Colors.health.excellent, Colors.health.good];
    if (score >= 60) return [Colors.health.fair, '#F97316'];
    return [Colors.health.poor, Colors.health.critical];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Welcome Header */}
      <LinearGradient
        colors={Colors.gradients.redToPeach as [string, string]}
        style={styles.welcomeHeader}
      >
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Good {getTimeOfDay()}!</Text>
          <Text style={styles.welcomeSubtitle}>
            Ready to make healthier choices?
          </Text>
        </View>
        <View style={styles.welcomeIcon}>
          <Zap size={32} color={Colors.neutral.white} />
        </View>
      </LinearGradient>

      {/* Weekly Stats Cards */}
      <View style={styles.statsGrid}>
        <ModernCard style={[styles.statCard, { width: cardWidth }]}>
          <View style={styles.statHeader}>
            <BarChart3 size={24} color={Colors.primary.red} />
            <Text style={styles.statValue}>{weeklyStats.totalScans}</Text>
          </View>
          <Text style={styles.statLabel}>Scans This Week</Text>
          <ProgressBar 
            progress={Math.min(100, (weeklyStats.totalScans / 10) * 100)} 
            height={4}
          />
        </ModernCard>

        <ModernCard style={[styles.statCard, { width: cardWidth }]}>
          <View style={styles.statHeader}>
            <Target size={24} color={getScoreColor(weeklyStats.averageScore)} />
            <Text style={[styles.statValue, { color: getScoreColor(weeklyStats.averageScore) }]}>
              {weeklyStats.averageScore}
            </Text>
          </View>
          <Text style={styles.statLabel}>Average Score</Text>
          <ProgressBar 
            progress={weeklyStats.averageScore} 
            height={4}
            gradientColors={getScoreGradient(weeklyStats.averageScore)}
          />
        </ModernCard>
      </View>

      <View style={styles.statsGrid}>
        <ModernCard style={[styles.statCard, { width: cardWidth }]}>
          <View style={styles.statHeader}>
            <Award size={24} color={Colors.health.excellent} />
            <Text style={[styles.statValue, { color: Colors.health.excellent }]}>
              {weeklyStats.healthyChoices}
            </Text>
          </View>
          <Text style={styles.statLabel}>Healthy Choices</Text>
          <ProgressBar 
            progress={weeklyStats.healthyPercentage} 
            height={4}
            gradientColors={[Colors.health.excellent, Colors.health.good]}
          />
        </ModernCard>

        <ModernCard style={[styles.statCard, { width: cardWidth }]}>
          <View style={styles.statHeader}>
            <Heart size={24} color={Colors.primary.red} />
            <Text style={styles.statValue}>{favorites.length}</Text>
          </View>
          <Text style={styles.statLabel}>Favorites</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/favorites')}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </ModernCard>
      </View>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <ModernCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={Colors.neutral.gray600} />
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentScans.map((item, index) => {
            const score = getHealthScore(item.product, preferences);
            return (
              <TouchableOpacity
                key={`${item.barcode}-${item.scannedAt}`}
                style={[styles.recentItem, index > 0 && styles.recentItemBorder]}
                onPress={() => router.push(`/product/${item.barcode}`)}
              >
                <Image source={{ uri: item.product.image }} style={styles.recentImage} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.recentBrand} numberOfLines={1}>
                    {item.product.brand}
                  </Text>
                  <Text style={styles.recentDate}>
                    {formatDate(item.scannedAt)}
                  </Text>
                </View>
                <View style={[styles.recentScore, { backgroundColor: getScoreColor(score) }]}>
                  <Text style={styles.recentScoreText}>{Math.round(score)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ModernCard>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ModernButton
          title="Scan Product"
          onPress={() => router.push('/(tabs)/(scanner)' as any)}
          gradient={true}
          style={styles.quickActionButton}
        />
        <ModernButton
          title="Search Products"
          onPress={() => router.push('/search')}
          variant="outline"
          gradient={false}
          style={styles.quickActionButton}
        />
      </View>
    </ScrollView>
  );
};

// Modern Button Component
interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  gradient?: boolean;
  style?: any;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  gradient = true,
  style,
}) => {
  if (variant === 'primary' && gradient) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
        <LinearGradient
          colors={Colors.gradients.redToPeach as [string, string]}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        styles.button, 
        variant === 'outline' && styles.outlineButton,
        style
      ]}
    >
      <Text style={[
        styles.buttonText,
        variant === 'outline' && styles.outlineButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 100, // Account for tab bar
  },
  welcomeHeader: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.neutral.white,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: FontWeights.medium,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    padding: Spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.neutral.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.neutral.gray500,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
  },
  viewAllButton: {
    marginTop: Spacing.xs,
  },
  viewAllText: {
    fontSize: 12,
    color: Colors.primary.red,
    fontWeight: FontWeights.semibold,
  },
  sectionCard: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: Colors.neutral.gray900,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  viewAllLink: {
    fontSize: 14,
    color: Colors.primary.red,
    fontWeight: FontWeights.semibold,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  recentItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray100,
  },
  recentImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral.gray100,
  },
  recentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recentName: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral.gray900,
    marginBottom: 2,
  },
  recentBrand: {
    fontSize: 14,
    color: Colors.neutral.gray600,
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    color: Colors.neutral.gray400,
  },
  recentScore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentScoreText: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: Colors.neutral.white,
  },
  quickActions: {
    gap: Spacing.md,
  },
  quickActionButton: {
    marginBottom: Spacing.sm,
  },
  button: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: Colors.primary.red,
    paddingVertical: Spacing.lg - 2, // Account for border
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral.white,
  },
  outlineButtonText: {
    color: Colors.primary.red,
  },
});