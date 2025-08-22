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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllBlogs, deleteLike, deleteBookmark } from '../api/blog-api';
import apiClient from '../api/url-api';

const { width } = Dimensions.get('window');

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
    console.log('BlogDetail Image URI:', uri); // Debug: Log the URI
    if (!uri || typeof uri !== 'string' || !uri.startsWith('http')) {
      const placeholder = getRandomPlaceholder();
      console.log('BlogDetail Using placeholder:', placeholder); // Debug: Log placeholder
      return placeholder;
    }
    return { uri };
  };

  // Generate author avatar URL
  const getAuthorImage = (authorName) => {
    const uri = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'Unknown Author')}&size=100&background=2563EB&color=fff`;
    console.log('Author Image URI:', uri); // Debug: Log author image URI
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
      console.log('Auth Token:', token); // Debug: Log token
      const blogResponse = await getAllBlogs(token);
      console.log('Raw API Response:', JSON.stringify(blogResponse.data, null, 2)); // Debug: Log raw response
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
      }))); // Debug: Log blog images
      const selectedBlog = approvedBlogs.find(blog => blog.id === blogId);
      if (!selectedBlog) {
        setError('Blog not found.');
      } else {
        console.log('Selected Blog:', JSON.stringify(selectedBlog, null, 2)); // Debug: Log selected blog
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
        console.log('Liked Blog IDs:', likedBlogIds); // Debug: Log liked blogs

        const bookmarkedResponse = await apiClient.get('/api/bookmark/view-all-bookmarked-blogs', {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' },
        });
        const bookmarkedBlogIds = Array.isArray(bookmarkedResponse.data?.data)
          ? bookmarkedResponse.data.data.map(blog => String(blog.blogId || blog.id))
          : [];
        setBookmarks(bookmarkedBlogIds);
        console.log('Bookmarked Blog IDs:', bookmarkedBlogIds); // Debug: Log bookmarked blogs
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Blog...</Text>
      </View>
    );
  }

  if (error || !blog) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Blog not found.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBlogDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animatable.View animation="fadeInUp" duration={500}>
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
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.metaText}>{blog.tags?.[0] || ''}</Text>
              <Text style={styles.metaText}>{calculateReadingTime(blog.body)} min</Text>
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
              <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(blog.id)}>
                <Feather
                  name="heart"
                  size={24}
                  color={likes.includes(String(blog.id)) ? '#EF4444' : '#6B7280'}
                />
                <Text style={styles.actionText}>{blog.likeCount || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => toggleBookmark(blog.id)}>
                <Feather
                  name="bookmark"
                  size={24}
                  color={bookmarks.includes(String(blog.id)) ? '#2563EB' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animatable.View>

        {/* Auth Popup */}
        {showAuthPopup && (
          <View style={styles.popup}>
            <Animatable.View animation="fadeIn" duration={300} style={styles.popupContent}>
              <Text style={styles.popupTitle}>Please Log In</Text>
              <Text style={styles.popupText}>Log in to like or bookmark this post.</Text>
              <View style={styles.popupButtons}>
                <TouchableOpacity
                  style={styles.popupButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.popupButtonText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.popupButton}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.popupButtonText}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.popupButton, styles.popupCloseButton]}
                  onPress={() => setShowAuthPopup(false)}
                >
                  <Text style={styles.popupButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </View>
        )}
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  blogImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f0f0f0', // Debug: Add background to check visibility
  },
  blogContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  blogTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  blogMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0', // Debug: Add background to check visibility
  },
  authorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  blogBody: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  blogActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
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
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  popupCloseButton: {
    backgroundColor: '#D1D5DB',
  },
  popupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#2563EB',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default BlogDetailScreen;