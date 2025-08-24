import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
} from "react-native";
import { BookOpen, Clock, Search, ChevronDown, ChevronUp } from "lucide-react-native";
import { router } from "expo-router";
import { articles, faqs } from "@/mocks/articles";

export default function LearnScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const categories = [
    { id: "all", name: "All Topics" },
    { id: "nutrition", name: "Nutrition" },
    { id: "ingredients", name: "Ingredients" },
    { id: "scoring", name: "Scoring" },
    { id: "tips", name: "Tips" },
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "nutrition": return "#10B981";
      case "ingredients": return "#F59E0B";
      case "scoring": return "#3B82F6";
      case "tips": return "#8B5CF6";
      default: return "#6B7280";
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>RawScan</Text>
          <Text style={styles.headerTitle}>Learn & Improve</Text>
          <Text style={styles.headerSubtitle}>
            Master nutrition labels, understand ingredients, and make healthier choices
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categories}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category.id && styles.categoryButtonTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Articles */}
        <View style={styles.articlesSection}>
          <Text style={styles.sectionTitle}>Articles & Guides</Text>
          {filteredArticles.map(article => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => router.push(`/(tabs)/learn/article/${article.id}` as any)}
            >
              <Image source={{ uri: article.image }} style={styles.articleImage} />
              <View style={styles.articleContent}>
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
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={styles.readTimeText}>{article.readTime} min</Text>
                  </View>
                </View>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSummary} numberOfLines={2}>
                  {article.summary}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(index)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                {expandedFAQ === index ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
              {expandedFAQ === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          <View style={styles.tipCard}>
            <BookOpen size={24} color="#FF3B30" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Start with the Basics</Text>
              <Text style={styles.tipText}>
                Focus on understanding nutrition labels first, then move on to ingredients and additives.
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <BookOpen size={24} color="#10B981" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Practice Makes Perfect</Text>
              <Text style={styles.tipText}>
                Scan products regularly to build your intuition for healthier choices.
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <BookOpen size={24} color="#3B82F6" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Don't Aim for Perfection</Text>
              <Text style={styles.tipText}>
                Small, consistent improvements in your diet are more sustainable than dramatic changes.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF3B30",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  searchSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#1F2937",
  },
  categoriesSection: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categories: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryButtonActive: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  articlesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  articleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#F3F4F6",
  },
  articleContent: {
    padding: 16,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  readTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readTimeText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  articleSummary: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  faqSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 16,
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  tipsSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});