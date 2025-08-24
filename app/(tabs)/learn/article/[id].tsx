import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Clock } from "lucide-react-native";
import { articles } from "@/mocks/articles";

export default function ArticleScreen() {
  const { id } = useLocalSearchParams();
  const article = articles.find(a => a.id === id);

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "nutrition": return "#10B981";
      case "ingredients": return "#F59E0B";
      case "scoring": return "#3B82F6";
      case "tips": return "#8B5CF6";
      default: return "#6B7280";
    }
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <Text key={index} style={styles.h1}>
            {line.substring(2)}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        return (
          <Text key={index} style={styles.h2}>
            {line.substring(3)}
          </Text>
        );
      } else if (line.startsWith('### ')) {
        return (
          <Text key={index} style={styles.h3}>
            {line.substring(4)}
          </Text>
        );
      } else if (line.startsWith('- **') && line.includes('**:')) {
        const parts = line.split('**:');
        const boldPart = parts[0].substring(3);
        const normalPart = parts[1];
        return (
          <View key={index} style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>{boldPart}:</Text>
              {normalPart}
            </Text>
          </View>
        );
      } else if (line.startsWith('- ')) {
        return (
          <View key={index} style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{line.substring(2)}</Text>
          </View>
        );
      } else if (line.trim() === '') {
        return <View key={index} style={styles.spacer} />;
      } else {
        return (
          <Text key={index} style={styles.paragraph}>
            {line}
          </Text>
        );
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: article.image }} style={styles.headerImage} />
        
        <View style={styles.content}>
          <View style={styles.articleHeader}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(article.category) }
            ]}>
              <Text style={styles.categoryBadgeText}>
                {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
              </Text>
            </View>
            <View style={styles.readTime}>
              <Clock size={16} color="#9CA3AF" />
              <Text style={styles.readTimeText}>{article.readTime} min read</Text>
            </View>
          </View>

          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.summary}>{article.summary}</Text>

          <View style={styles.articleContent}>
            {renderContent(article.content)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
  },
  headerImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
  },
  content: {
    padding: 20,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  readTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  readTimeText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    lineHeight: 36,
  },
  summary: {
    fontSize: 18,
    color: "#6B7280",
    lineHeight: 26,
    marginBottom: 24,
  },
  articleContent: {
    marginTop: 8,
  },
  h1: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 20,
    marginBottom: 12,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  paragraph: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 16,
  },
  bullet: {
    fontSize: 16,
    color: "#FF3B30",
    marginRight: 8,
    fontWeight: "600",
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  bold: {
    fontWeight: "600",
    color: "#1F2937",
  },
  spacer: {
    height: 12,
  },
});