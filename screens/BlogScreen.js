import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { getAllBlogs, getAllLikedBlogs, getAllBookmarkedBlogs, deleteLike, deleteBookmark } from '../api/blog-api';
import apiClient from '../api/url-api';
import { Header } from './HomeScreen';

const { width, height } = Dimensions.get('window');

const BlogScreen = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarks, setBookmarks] = useState([]);
  const [likes, setLikes] = useState([]);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showBookmarkPopup, setShowBookmarkPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Added for menu state
  const postsPerPage = 10;
  const bottomSheetAnim = useRef(new Animated.Value(height)).current;

  const placeholderImages = [
    require('../assets/adaptive-icon.png'),
    require('../assets/due-date-calculator.svg'),
    require('../assets/find-a-health-service.svg'),
  ];

  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * placeholderImages.length);
    return placeholderImages[randomIndex];
  };

  const getValidImageSource = (uri) => {
    if (!uri || typeof uri !== 'string' || !uri.startsWith('http')) {
      return getRandomPlaceholder();
    }
    return { uri };
  };

  const getAuthorImage = (authorName) => {
    return { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=100&background=2563EB&color=fff` };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const blogResponse = await getAllBlogs(token);
      console.log('Raw API Response:', JSON.stringify(blogResponse.data, null, 2));
      const approvedBlogs = Array.isArray(blogResponse.data?.data)
        ? blogResponse.data.data
            .filter(blog => blog.status?.toLowerCase() === 'approved')
            .map(blog => ({
              ...blog,
              id: String(blog.blogId || blog.id),
              createdAt: blog.creationDate || blog.createdAt,
              images: Array.isArray(blog.images) ? blog.images : [],
            }))
        : [];
      console.log('Blog Images:', approvedBlogs.map(blog => ({
        id: blog.id,
        image: blog.images?.[0]?.fileUrl,
        title: blog.title,
      })));
      setBlogs(approvedBlogs);
      setFilteredBlogs(approvedBlogs);

      if (token) {
        const likedResponse = await getAllLikedBlogs(token);
        const likedBlogIds = Array.isArray(likedResponse.data?.data)
          ? likedResponse.data.data.map(blog => String(blog.blogId || blog.id))
          : [];
        setLikes(likedBlogIds);

        const bookmarkedResponse = await getAllBookmarkedBlogs(token);
        const bookmarkedBlogIds = Array.isArray(bookmarkedResponse.data?.data)
          ? bookmarkedResponse.data.data.map(blog => String(blog.blogId || blog.id))
          : [];
        setBookmarks(bookmarkedBlogIds);
      } else {
        setLikes([]);
        setBookmarks([]);
      }

      if (approvedBlogs.length === 0) {
        setError('No approved blogs available.');
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    Animated.spring(bottomSheetAnim, {
      toValue: showBookmarkPopup ? 0 : height,
      stiffness: 100,
      damping: 20,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [showBookmarkPopup]);

  const handleSearch = (text) => {
    setSearchTerm(text);
    filterBlogs(text, selectedCategory, sortOption);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    filterBlogs(searchTerm, category, sortOption);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortOption(sort);
    filterBlogs(searchTerm, selectedCategory, sort);
    setCurrentPage(1);
  };

  const filterBlogs = (term, category, sort) => {
    let filtered = [...blogs];
    if (term) {
      filtered = filtered.filter(
        blog =>
          (blog.title || '').toLowerCase().includes(term.toLowerCase()) ||
          (blog.body || '').toLowerCase().includes(term.toLowerCase())
      );
    }
    if (category !== 'All') {
      filtered = filtered.filter(blog => blog.tags?.includes(category));
    }
    if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'title') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sort === 'most-liked') {
      filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }
    setFilteredBlogs(filtered);
  };

  const clearSearch = () => {
    setSearchTerm('');
    filterBlogs('', selectedCategory, sortOption);
    setCurrentPage(1);
  };

  const toggleBookmark = async (blogId) => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      setShowAuthPopup(true);
      return;
    }
    try {
      const blogIdString = String(blogId);
      if (bookmarks.includes(blogIdString)) {
        await deleteBookmark(blogId, token);
        setBookmarks(prev => prev.filter(id => id !== blogIdString));
      } else {
        await apiClient.post(`/api/bookmark/toggle/${blogId}`, null, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' },
        });
        setBookmarks(prev => [...prev, blogIdString]);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      setError('Failed to toggle bookmark.');
    }
  };

  const toggleLike = async (blogId) => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      setShowAuthPopup(true);
      return;
    }
    try {
      const blogIdString = String(blogId);
      if (likes.includes(blogIdString)) {
        await deleteLike(blogId, token);
        setLikes(prev => prev.filter(id => id !== blogIdString));
        setBlogs(prev =>
          prev.map(blog =>
            String(blog.id) === blogIdString
              ? { ...blog, likeCount: (blog.likeCount || 0) - 1 }
              : blog
          )
        );
        setFilteredBlogs(prev =>
          prev.map(blog =>
            String(blog.id) === blogIdString
              ? { ...blog, likeCount: (blog.likeCount || 0) - 1 }
              : blog
          )
        );
      } else {
        await apiClient.post(`/api/like/toggle/${blogId}`, null, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' },
        });
        setLikes(prev => [...prev, blogIdString]);
        setBlogs(prev =>
          prev.map(blog =>
            String(blog.id) === blogIdString
              ? { ...blog, likeCount: (blog.likeCount || 0) + 1 }
              : blog
          )
        );
        setFilteredBlogs(prev =>
          prev.map(blog =>
            String(blog.id) === blogIdString
              ? { ...blog, likeCount: (blog.likeCount || 0) + 1 }
              : blog
          )
        );
      }
    } catch (error) {
      console.error('Like error:', error);
      setError('Failed to toggle like.');
    }
  };

  const calculateReadingTime = (text) => {
    const wordCount = (text || '').split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const handleNewsletterSubmit = async () => {
    try {
      await apiClient.post('/api/newsletter/subscribe', { email });
      setSubscriptionStatus('Subscribed successfully!');
      setEmail('');
      setTimeout(() => setSubscriptionStatus(null), 3000);
    } catch (error) {
      console.error('Newsletter error:', error);
      setSubscriptionStatus('Failed to subscribe.');
      setTimeout(() => setSubscriptionStatus(null), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        await AsyncStorage.removeItem('authToken');
        navigation.replace('Login');
        return;
      }
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Blogs...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchData}
          accessibilityLabel="Retry loading blogs"
          accessibilityHint="Attempts to reload the blog list"
        >
          <Animatable.View animation="pulse" duration={100} useNativeDriver={true}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Animatable.View>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const categories = ['All', ...new Set(blogs.flatMap(blog => blog.tags || []))];
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredBlogs.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredBlogs.length / postsPerPage);

  const uniqueBlogIds = new Set();
  const featuredPosts = [
    ...blogs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2)
      .map(blog => ({ ...blog, type: 'recent' })),
    ...blogs
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 2)
      .filter(blog => !uniqueBlogIds.has(String(blog.id)))
      .map(blog => ({ ...blog, type: 'popular' })),
  ].filter(blog => {
    const blogId = String(blog.id);
    if (uniqueBlogIds.has(blogId)) return false;
    uniqueBlogIds.add(blogId);
    return true;
  }).map(blog => ({
    id: String(blog.id),
    title: blog.title || 'Untitled',
    image: blog.images?.[0]?.fileUrl,
    date: new Date(blog.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    category: blog.tags?.[0] || '',
    likeCount: blog.likeCount || 0,
    type: blog.type,
  }));

  const topAuthors = Object.entries(
    blogs.reduce((acc, blog) => {
      const author = blog.createdByUser?.userName || 'Unknown Author';
      acc[author] = acc[author] || { postCount: 0, totalLikes: 0 };
      acc[author].postCount += 1;
      acc[author].totalLikes += blog.likeCount || 0;
      return acc;
    }, {})
  )
    .map(([author, { postCount, totalLikes }]) => ({
      author,
      postCount,
      totalLikes,
      image: getAuthorImage(author),
    }))
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 3);

  const bookmarkedBlogs = blogs.filter(blog => bookmarks.includes(String(blog.id)));

  return (
    <SafeAreaView style={styles.container}>
      <Header
        navigation={navigation}
        user={user}
        setUser={setUser}
        handleLogout={handleLogout}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <View style={styles.mainContentContainer}>
        {isMenuOpen && (
          <TouchableOpacity
            style={styles.contentOverlay}
            onPress={toggleMenu}
            accessibilityLabel="Close menu"
            accessibilityHint="Closes the navigation menu"
          />
        )}
        <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.blogContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
            bounces={true}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isMenuOpen}
          >
            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search blogs..."
                value={searchTerm}
                onChangeText={handleSearch}
                placeholderTextColor="#6B7280"
                accessibilityLabel="Search blogs"
                accessibilityHint="Enter text to search for blog posts"
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchTerm ? (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearSearch}
                  accessibilityLabel="Clear search"
                  accessibilityHint="Clares the search input field"
                >
                  <Animatable.View animation="pulse" duration={100} useNativeDriver={true}>
                    <Feather name="x" size={20} color="#6B7280" />
                  </Animatable.View>
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
              contentInset={{ left: 8, right: 8 }}
              bounces={true}
            >
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={`category-${cat}-${index}`}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => handleCategoryFilter(cat)}
                  accessibilityLabel={`Filter by ${cat}`}
                  accessibilityHint={`Filters blog posts by ${cat} category`}
                  activeOpacity={0.7}
                >
                  <Animatable.View
                    animation={selectedCategory === cat ? 'pulse' : undefined}
                    duration={100}
                    useNativeDriver={true}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Animatable.View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sortContainer}>
              {['newest', 'oldest', 'title', 'most-liked'].map(sort => (
                <TouchableOpacity
                  key={`sort-${sort}`}
                  style={[
                    styles.sortButton,
                    sortOption === sort && styles.sortButtonActive,
                  ]}
                  onPress={() => handleSortChange(sort)}
                  accessibilityLabel={`Sort by ${sort}`}
                  accessibilityHint={`Sorts blog posts by ${sort.replace('-', ' ')}`}
                  activeOpacity={0.7}
                >
                  <Animatable.View
                    animation={sortOption === sort ? 'pulse' : undefined}
                    duration={100}
                    useNativeDriver={true}
                  >
                    <Text
                      style={[styles.sortButtonText, sortOption === sort && styles.sortButtonTextActive]}
                    >
                      {sort.charAt(0).toUpperCase() + sort.slice(1).replace('-', ' ')}
                    </Text>
                  </Animatable.View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured Posts</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentInset={{ left: 8, right: 8 }}
                bounces={true}
              >
                {featuredPosts.map((post, index) => (
                  <TouchableOpacity
                    key={`${post.id}-${post.type}`}
                    style={styles.featuredCard}
                    onPress={() => navigation.navigate('BlogPost', { blogId: post.id })}
                    accessibilityLabel={`View ${post.title}`}
                    accessibilityHint="Navigates to the selected blog post"
                    activeOpacity={0.7}
                  >
                    <Animatable.View
                      animation="fadeInUp"
                      duration={500}
                      delay={index * 100}
                      useNativeDriver={true}
                    >
                      <Image
                        source={getValidImageSource(post.image)}
                        style={styles.featuredImage}
                      />
                      <View style={styles.featuredContent}>
                        <Text style={styles.featuredTag}>{post.type === 'recent' ? 'New' : 'Popular'}</Text>
                        <Text style={styles.featuredTitle} numberOfLines={2}>
                          {post.title}
                        </Text>
                        <Text style={styles.featuredMeta}>
                          {post.date} • {post.category}
                        </Text>
                      </View>
                    </Animatable.View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Blogs</Text>
              {currentPosts.map(blog => (
                <TouchableOpacity
                  key={String(blog.id)}
                  style={styles.blogCard}
                  onPress={() => navigation.navigate('BlogPost', { blogId: blog.id })}
                  accessibilityLabel={`View ${blog.title || 'Untitled'} blog post`}
                  accessibilityHint="Navigates to the selected blog post"
                  activeOpacity={0.7}
                >
                  <Animatable.View
                    animation="fadeInUp"
                    duration={300}
                    useNativeDriver={true}
                  >
                    <Image
                      source={getValidImageSource(blog.images?.[0]?.fileUrl)}
                      style={styles.blogImage}
                    />
                    <View style={styles.blogContent}>
                      <Text style={styles.blogTitle} numberOfLines={2}>
                        {blog.title || 'Untitled'}
                      </Text>
                      <Text style={styles.blogExcerpt} numberOfLines={3}>
                        {(blog.body || 'No content available').slice(0, 100)}...
                      </Text>
                      <View style={styles.blogMeta}>
                        <Text style={styles.metaText}>
                          {new Date(blog.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.metaText}>{blog.tags?.[0] || ''}</Text>
                        <Text style={styles.metaText}>{calculateReadingTime(blog.body)} min</Text>
                      </View>
                      <View style={styles.blogActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => toggleLike(blog.id)}
                          accessibilityLabel={likes.includes(String(blog.id)) ? 'Unlike post' : 'Like post'}
                          accessibilityHint={likes.includes(String(blog.id)) ? 'Removes like from the post' : 'Likes the post'}
                          activeOpacity={0.7}
                        >
                          <Animatable.View
                            animation={likes.includes(String(blog.id)) ? 'pulse' : undefined}
                            duration={100}
                            useNativeDriver={true}
                          >
                            <Feather
                              name="heart"
                              size={20}
                              color={likes.includes(String(blog.id)) ? '#EF4444' : '#6B7280'}
                            />
                            <Text style={styles.actionText}>{blog.likeCount || 0}</Text>
                          </Animatable.View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => toggleBookmark(blog.id)}
                          accessibilityLabel={bookmarks.includes(String(blog.id)) ? 'Remove bookmark' : 'Bookmark post'}
                          accessibilityHint={bookmarks.includes(String(blog.id)) ? 'Removes the post from bookmarks' : 'Adds the post to bookmarks'}
                          activeOpacity={0.7}
                        >
                          <Animatable.View
                            animation={bookmarks.includes(String(blog.id)) ? 'pulse' : undefined}
                            duration={100}
                            useNativeDriver={true}
                          >
                            <Feather
                              name="bookmark"
                              size={20}
                              color={bookmarks.includes(String(blog.id)) ? '#2563EB' : '#6B7280'}
                            />
                          </Animatable.View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animatable.View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                accessibilityLabel="Previous page"
                accessibilityHint="Navigates to the previous page of blog posts"
                activeOpacity={0.7}
              >
                <Animatable.View animation={currentPage > 1 ? 'pulse' : undefined} duration={100} useNativeDriver={true}>
                  <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>
                    Prev
                  </Text>
                </Animatable.View>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                accessibilityLabel="Next page"
                accessibilityHint="Navigates to the next page of blog posts"
                activeOpacity={0.7}
              >
                <Animatable.View
                  animation={currentPage < totalPages ? 'pulse' : undefined}
                  duration={100}
                  useNativeDriver={true}
                >
                  <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>
                    Next
                  </Text>
                </Animatable.View>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Authors</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentInset={{ left: 8, right: 8 }}
                bounces={true}
              >
                {topAuthors.map((author, index) => (
                  <View key={`author-${author}-${index}`} style={styles.authorCard}>
                    <Animatable.View
                      animation="fadeInUp"
                      duration={500}
                      delay={index * 100}
                      useNativeDriver={true}
                    >
                      <Image source={author.image} style={styles.authorImage} />
                      <Text style={styles.authorName} numberOfLines={1}>
                        {author.author}
                      </Text>
                      <Text style={styles.authorMeta}>
                        {author.postCount} posts • {author.totalLikes} likes
                      </Text>
                    </Animatable.View>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Newsletter</Text>
              <Text style={styles.sectionSubtitle}>
                Get the latest blog updates in your inbox.
              </Text>
              <View style={styles.newsletterForm}>
                <TextInput
                  style={styles.newsletterInput}
                  placeholder="Your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#6B7280"
                  accessibilityLabel="Newsletter email input"
                  accessibilityHint="Enter your email to subscribe to the newsletter"
                  returnKeyType="done"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.newsletterButton}
                  onPress={handleNewsletterSubmit}
                  accessibilityLabel="Subscribe to newsletter"
                  accessibilityHint="Submits your email for newsletter updates"
                  activeOpacity={0.7}
                >
                  <Animatable.View animation="pulse" duration={100} useNativeDriver={true}>
                    <Text style={styles.newsletterButtonText}>Subscribe</Text>
                  </Animatable.View>
                </TouchableOpacity>
              </View>
              {subscriptionStatus && (
                <Text
                  style={[
                    styles.subscriptionStatus,
                    subscriptionStatus.includes('Failed') ? styles.subscriptionStatusError : styles.subscriptionStatusSuccess,
                  ]}
                >
                  {subscriptionStatus}
                </Text>
              )}
            </View>
          </ScrollView>

          {showBookmarkPopup && (
            <TouchableOpacity
              style={[styles.bottomSheetOverlay, { zIndex: 1000 }]}
              onPress={() => setShowBookmarkPopup(false)}
              accessibilityLabel="Close bookmarks"
              accessibilityHint="Closes the bookmarks popup"
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.bottomSheet,
                  { transform: [{ translateY: bottomSheetAnim }] },
                ]}
              >
                <View style={styles.bottomSheetHandle} />
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>Your Bookmarks</Text>
                </View>
                <ScrollView
                  style={styles.bottomSheetContent}
                  contentInsetAdjustmentBehavior="automatic"
                  bounces={true}
                  showsVerticalScrollIndicator={false}
                >
                  {bookmarkedBlogs.length > 0 ? (
                    bookmarkedBlogs.map(blog => (
                      <TouchableOpacity
                        key={`bookmark-${blog.id}`}
                        style={styles.bookmarkItem}
                        onPress={() => {
                          setShowBookmarkPopup(false);
                          navigation.navigate('BlogPost', { blogId: blog.id });
                        }}
                        accessibilityLabel={`View bookmarked post ${blog.title || 'Untitled'}`}
                        accessibilityHint="Navigates to the selected bookmarked blog post"
                        activeOpacity={0.7}
                      >
                        <Image
                          source={getValidImageSource(blog.images?.[0]?.fileUrl)}
                          style={styles.bookmarkImage}
                        />
                        <View style={styles.bookmarkInfo}>
                          <Text style={styles.bookmarkTitle} numberOfLines={2}>
                            {blog.title || 'Untitled'}
                          </Text>
                          <Text style={styles.bookmarkMeta}>
                            {new Date(blog.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                          <TouchableOpacity
                            style={styles.bookmarkRemoveButton}
                            onPress={() => toggleBookmark(blog.id)}
                            accessibilityLabel={`Remove bookmark for ${blog.title || 'Untitled'}`}
                            accessibilityHint="Removes the post from bookmarks"
                            activeOpacity={0.7}
                          >
                            <Animatable.View animation="pulse" duration={100} useNativeDriver={true}>
                              <Feather name="bookmark" size={16} color="#ff6b6b" />
                              <Text style={styles.bookmarkRemoveText}>Remove</Text>
                            </Animatable.View>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.bottomSheetEmptyText}>No bookmarks yet.</Text>
                  )}
                </ScrollView>
              </Animated.View>
            </TouchableOpacity>
          )}

          {showAuthPopup && (
            <View style={[styles.popup, { zIndex: 1000 }]}>
              <Animatable.View
                animation="fadeIn"
                duration={300}
                useNativeDriver={true}
                style={styles.popupContent}
              >
                <Text style={styles.popupTitle}>Please Log In</Text>
                <Text style={styles.popupText}>Log in to like or bookmark posts.</Text>
                <View style={styles.popupButtons}>
                  <TouchableOpacity
                    style={styles.popupButton}
                    onPress={() => navigation.navigate('Login')}
                    accessibilityLabel="Sign in"
                    accessibilityHint="Navigates to the login screen"
                    activeOpacity={0.7}
                  >
                    <Animatable.View animation="pulse" duration={100} useNativeDriver={true}>
                      <Text style={styles.popupButtonText}>Sign In</Text>
                    </Animatable.View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.popupButton}
                    onPress={() => navigation.navigate('Register')}
                    accessibilityLabel="Sign up"
                    accessibilityHint="Navigates to the registration screen"
                    activeOpacity={0.7}
                  >
                    <Animatable.View animation="pulse" duration={100} useNativeDriver={true}>
                      <Text style={styles.popupButtonText}>Sign Up</Text>
                    </Animatable.View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.popupButton, styles.popupCloseButton]}
                    onPress={() => setShowAuthPopup(false)}
                    accessibilityLabel="Close login prompt"
                    accessibilityHint="Closes the login prompt popup"
                    activeOpacity={0.7}
                  >
                    <Animatable.View animation="pulse" duration={100} useNativeDriver={true}>
                      <Text style={styles.popupButtonText}>Close</Text>
                    </Animatable.View>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            </View>
          )}

          <Animatable.View
            style={[styles.bookmarksFab, { zIndex: 1002 }]}
            animation="pulse"
            iterationCount="infinite"
            iterationDelay={2000}
            useNativeDriver={true}
          >
            <TouchableOpacity
              onPress={() => setShowBookmarkPopup(!showBookmarkPopup)}
              accessibilityLabel={showBookmarkPopup ? "Close bookmarks" : "View bookmarks"}
              accessibilityHint={showBookmarkPopup ? "Closes the bookmarks popup" : "Opens the bookmarks popup"}
              activeOpacity={0.7}
            >
              <Feather name="bookmark" size={24} color="#fff" />
            </TouchableOpacity>
          </Animatable.View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  mainContentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 0, // Below header and navMenu
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay for main content
    zIndex: 1000, // Above content but below navMenu
  },
  blogContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
    paddingTop: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#374151',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2e6da4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#374151',
  },
  clearButton: {
    padding: 8,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#6b9fff',
    borderColor: '#6b9fff',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  sortButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sortButtonActive: {
    backgroundColor: '#6b9fff',
    borderColor: '#6b9fff',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  featuredCard: {
    width: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  featuredContent: {
    padding: 12,
  },
  featuredTag: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#2e6da4',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  featuredMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  blogCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  blogImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  blogContent: {
    padding: 12,
  },
  blogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  blogExcerpt: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  blogMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  blogActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 16,
  },
  pageButton: {
    backgroundColor: '#2e6da4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  pageButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  pageButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pageInfo: {
    fontSize: 14,
    color: '#1F2937',
  },
  authorCard: {
    alignItems: 'center',
    width: 120,
    marginRight: 12,
  },
  authorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  authorMeta: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  newsletterForm: {
    flexDirection: 'row',
    gap: 8,
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  newsletterButton: {
    backgroundColor: '#2e6da4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  newsletterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  subscriptionStatus: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  subscriptionStatusSuccess: {
    color: '#10B981',
  },
  subscriptionStatusError: {
    color: '#EF4444',
  },
  popup: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popupContent: {
    backgroundColor: '#feffe9',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  popupText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  popupButton: {
    backgroundColor: '#2e6da4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  popupCloseButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  popupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f7fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1001,
  },
  bottomSheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginVertical: 12,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  bottomSheetEmptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  bookmarkItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookmarkImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  bookmarkInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookmarkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookmarkMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  bookmarkRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  bookmarkRemoveText: {
    fontSize: 13,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  bookmarksFab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#6b9fff',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1002,
  },
});

export default BlogScreen;