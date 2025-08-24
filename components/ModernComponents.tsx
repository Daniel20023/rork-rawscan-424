import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows, FontWeights, Spacing } from '@/constants/colors';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: [string, string];
  onPress?: () => void;
  shadow?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  style,
  gradient = false,
  gradientColors = Colors.gradients.redToPeach as [string, string],
  onPress,
  shadow = true,
}) => {
  const cardStyle = [
    styles.card,
    shadow && Shadows.card,
    style,
  ];

  if (gradient) {
    return (
      <TouchableOpacity onPress={onPress} disabled={!onPress} style={cardStyle}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradientCard}
        >
          {children}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={cardStyle}>
      {children}
    </TouchableOpacity>
  );
};

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  gradient?: boolean;
  gradientColors?: [string, string];
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  gradient = true,
  gradientColors = Colors.gradients.redToPeach as [string, string],
  backgroundColor = Colors.neutral.gray100,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <View style={[styles.progressContainer, { height, backgroundColor }]}>
      {gradient ? (
        <LinearGradient
          colors={gradientColors}
          style={[styles.progressBar, { width: `${clampedProgress}%`, height }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      ) : (
        <View
          style={[
            styles.progressBar,
            { 
              width: `${clampedProgress}%`, 
              height,
              backgroundColor: gradientColors[0],
            }
          ]}
        />
      )}
    </View>
  );
};

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  gradient?: boolean;
  gradientColors?: [string, string];
  backgroundColor?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  gradient = true,
  gradientColors = Colors.gradients.redToPeach as [string, string],
  backgroundColor = Colors.neutral.gray100,
  children,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <View style={[styles.circularProgress, { width: size, height: size }]}>
      <View style={styles.circularProgressContent}>
        {children}
      </View>
      {/* This is a simplified version - for full SVG circular progress, you'd need react-native-svg */}
      <View
        style={[
          styles.circularProgressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]}
      />
    </View>
  );
};

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  gradient?: boolean;
  gradientColors?: [string, string];
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  gradient = true,
  gradientColors = Colors.gradients.redToPeach as [string, string],
  disabled = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    variant === 'outline' && styles.buttonOutline,
    disabled && styles.buttonDisabled,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    styles[`buttonText${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    variant === 'outline' && styles.buttonTextOutline,
    disabled && styles.buttonTextDisabled,
    textStyle,
  ];

  if (variant === 'primary' && gradient && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} style={buttonStyle}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradientButton}
        >
          <Text style={buttonTextStyle}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={buttonStyle}>
      <Text style={buttonTextStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  gradientCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  progressContainer: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: BorderRadius.sm,
  },
  circularProgress: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularProgressContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  circularProgressRing: {
    position: 'absolute',
  },
  button: {
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary.red,
  },
  buttonSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  buttonMedium: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  buttonLarge: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.red,
  },
  buttonDisabled: {
    backgroundColor: Colors.neutral.gray300,
    borderColor: Colors.neutral.gray300,
  },
  gradientButton: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: Colors.neutral.white,
    fontWeight: FontWeights.semibold,
  },
  buttonTextSmall: {
    fontSize: 14,
  },
  buttonTextMedium: {
    fontSize: 16,
  },
  buttonTextLarge: {
    fontSize: 18,
  },
  buttonTextOutline: {
    color: Colors.primary.red,
  },
  buttonTextDisabled: {
    color: Colors.neutral.gray500,
  },
});