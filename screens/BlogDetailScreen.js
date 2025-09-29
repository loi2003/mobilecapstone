import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllBlogs, deleteLike, deleteBookmark } from '../api/blog-api';
import apiClient from '../api/url-api';

const { width, height } = Dimensions.get('window');

const BlogDetailScreen = ({ route, navigation }) => {
  const { blogId } = route.params;
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likes, setLikes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  // Define placeholder images for blogs with no valid image
  const placeholderImages = [
    require('../assets/adaptive-icon.png'),
    require('../assets/adaptive-icon.png'),
    require('../assets/adaptive-icon.png'),
  ];

  // Select a random placeholder image
  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * placeholderImages.length);
    return placeholderImages[randomIndex];
  };

  // Validate and handle image URIs, returning placeholder if invalid
  const getValidImageSource = (uri) => {
    console.log('BlogDetail Image URI:', uri);
    if (!uri || typeof uri !== 'string' || !uri.startsWith('http')) {
      const placeholder = getRandomPlaceholder();
      console.log('BlogDetail Using placeholder:', placeholder);
      return placeholder;
    }
    return { uri };
  };

  // Generate author avatar URL
  const getAuthorImage = (authorName) => {
    const uri = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'Unknown Author')}&size=100&background=2563EB&color=fff`;
    console.log('Author Image URI:', uri);
    return { uri };
  };

  // Calculate reading time
  const calculateReadingTime = (text) => {
    const wordCount = (text || '').split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  // Fetch blog details
  const fetchBlogDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Auth Token:', token);
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
      const selectedBlog = approvedBlogs.find(blog => blog.id === blogId);
      if (!selectedBlog) {
        setError('Blog not found.');
      } else {
        console.log('Selected Blog:', JSON.stringify(selectedBlog, null, 2));
        setBlog(selectedBlog);
      }

      if (token) {
        const likedResponse = await apiClient.get('/api/like/view-all-liked-blogs', {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' },
        });
        const likedBlogIds = Array.isArray(likedResponse.data?.data)
          ? likedResponse.data.data.map(blog => String(blog.blogId || blog.id))
          : [];
        setLikes(likedBlogIds);
        console.log('Liked Blog IDs:', likedBlogIds);

        const bookmarkedResponse = await apiClient.get('/api/bookmark/view-all-bookmarked-blogs', {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' },
        });
        const bookmarkedBlogIds = Array.isArray(bookmarkedResponse.data?.data)
          ? bookmarkedResponse.data.data.map(blog => String(blog.blogId || blog.id))
          : [];
        setBookmarks(bookmarkedBlogIds);
        console.log('Bookmarked Blog IDs:', bookmarkedBlogIds);
      } else {
        setLikes([]);
        setBookmarks([]);
      }
    } catch (err) {
      console.error('Error fetching blog details:', err);
      setError('Failed to load blog details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogDetails();
  }, [blogId]);

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
        setBlog(prev => ({
          ...prev,
          likeCount: (prev.likeCount || 0) - 1,
        }));
      } else {
        await apiClient.post(`/api/like/toggle/${blogId}`, null, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' },
        });
        setLikes(prev => [...prev, blogIdString]);
        setBlog(prev => ({
          ...prev,
          likeCount: (prev.likeCount || 0) + 1,
        }));
      }
    } catch (error) {
      console.error('Like error:', error);
      setError('Failed to toggle like.');
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Blog...</Text>
      </SafeAreaView>
    );
  }

  if (error || !blog) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Blog not found.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBlogDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFFFFF', '#F2F4F7']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animatable.View animation="fadeInUp" duration={600} easing="ease-out">
            {/* Blog Image */}
            <Image
              source={getValidImageSource(blog.images?.[0]?.fileUrl)}
              style={styles.blogImage}
              defaultSource={placeholderImages[0]}
              onError={(e) => console.log('Blog Image Error:', blog.id, e.nativeEvent)}
            />

            {/* Blog Content */}
            <View style={styles.blogContent}>
              <Text style={styles.blogTitle}>{blog.title || 'Untitled'}</Text>
              <View style={styles.blogMeta}>
                <Text style={styles.metaText}>
                  {new Date(blog.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.metaText}>·</Text>
                <Text style={styles.metaText}>{calculateReadingTime(blog.body)} min read</Text>
                {blog.tags?.[0] && (
                  <>
                    <Text style={styles.metaText}>·</Text>
                    <Text style={styles.metaTag}>{blog.tags[0]}</Text>
                  </>
                )}
              </View>
              <View style={styles.authorContainer}>
                <Image
                  source={getAuthorImage(blog.createdByUser?.userName)}
                  style={styles.authorImage}
                  defaultSource={placeholderImages[0]}
                  onError={(e) => console.log('Author Image Error:', blog.createdByUser?.userName, e.nativeEvent)}
                />
                <Text style={styles.authorName}>{blog.createdByUser?.userName || 'Unknown Author'}</Text>
              </View>
              <Text style={styles.blogBody}>{blog.body || 'No content available.'}</Text>
              {blog.tags?.length > 0 && (
                <View style={styles.tagsContainer}>
                  {blog.tags.map((tag, index) => (
                    <Text key={`tag-${index}`} style={styles.tag}>
                      {tag}
                    </Text>
                  ))}
                </View>
              )}
              <View style={styles.blogActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: likes.includes(String(blog.id)) ? '#FF2D55' : '#F2F4F7' }]}
                  onPress={() => toggleLike(blog.id)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name="heart"
                    size={24}
                    color={likes.includes(String(blog.id)) ? '#FFFFFF' : '#3C3C4399'}
                  />
                  <Text style={[styles.actionText, { color: likes.includes(String(blog.id)) ? '#FFFFFF' : '#3C3C4399' }]}>
                    {blog.likeCount || 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: bookmarks.includes(String(blog.id)) ? '#007AFF' : '#F2F4F7' }]}
                  onPress={() => toggleBookmark(blog.id)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name="bookmark"
                    size={24}
                    color={bookmarks.includes(String(blog.id)) ? '#FFFFFF' : '#3C3C4399'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animatable.View>

          {/* Auth Popup */}
          {showAuthPopup && (
            <View style={styles.popup}>
              <Animatable.View animation="zoomIn" duration={300} style={styles.popupContent}>
                <Text style={styles.popupTitle}>Authentication Required</Text>
                <Text style={styles.popupText}>Please sign in or create an account to like or bookmark this post.</Text>
                <View style={styles.popupButtons}>
                  <TouchableOpacity
                    style={[styles.popupButton, styles.signInButton]}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.popupButtonText}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.popupButton, styles.signUpButton]}
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.popupButtonText}>Sign Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.popupButton, styles.popupCloseButton]}
                    onPress={() => setShowAuthPopup(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.popupButtonText, { color: '#007AFF' }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            </View>
          )}
        </ScrollView>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '500',
    color: '#3C3C43',
    opacity: 0.6,
  },
  errorText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FF3B30',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  blogImage: {
    width: '100%',
    height: height * 0.3,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#F2F4F7',
    resizeMode: 'cover',
  },
  blogContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  blogTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 34,
    marginBottom: 12,
  },
  blogMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#3C3C4399',
    marginRight: 8,
  },
  metaTag: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#F2F4F7',
  },
  authorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  blogBody: {
    fontSize: 17,
    fontWeight: '400',
    color: '#3C3C43',
    lineHeight: 26,
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  blogActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 60,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  popup: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popupContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  popupText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#3C3C4399',
    textAlign: 'center',
    marginBottom: 20,
  },
  popupButtons: {
    gap: 12,
  },
  popupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signInButton: {
    backgroundColor: '#007AFF',
  },
  signUpButton: {
    backgroundColor: '#34C759',
  },
  popupCloseButton: {
    backgroundColor: '#F2F4F7',
  },
  popupButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 40,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default BlogDetailScreen;