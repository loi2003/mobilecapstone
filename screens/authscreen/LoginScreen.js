import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import { login } from "../../api/auth";
import { Svg, Circle, Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const scrollViewRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId:
        "876889673753-t6c36pi4tg7fp30mdeeorqjjpi3t9010.apps.googleapis.com",
      scopes: ["profile", "email"],
      redirectUri: AuthSession.makeRedirectUri({
        useProxy: true,
      }),
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
    }
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateForm = () => {
    const newErrors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "Please enter your email";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Please enter your password";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    const errorMessages = Object.values(newErrors)
      .filter((error) => error)
      .join("\n");
    if (errorMessages) {
      Alert.alert("Validation Error", errorMessages, [{ text: "OK" }]);
      return false;
    }
    return true;
  };

  const decodeJWT = (token) => {
    try {
      const base64Payload = token.split(".")[1];
      const payload = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload;
    } catch (error) {
      console.error("Failed to decode JWT:", error);
      return null;
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setErrors({ email: "", password: "" });

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        Email: email,
        PasswordHash: password,
      };

      console.log("Attempting login with:", { email });
      const response = await login(payload);

      console.log("Login response received");
      console.log("Response data structure:", {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        dataKeys: response.data ? Object.keys(response.data) : "No data",
        dataDataKeys: response.data?.data
          ? Object.keys(response.data.data)
          : "No data.data",
      });

      // Extract token
      const token =
        response.data?.data?.accessToken || response.data?.accessToken;

      if (!token) {
        console.error("❌ No access token in response");
        Alert.alert(
          "Login Error",
          "Invalid response from server. Please try again."
        );
        setIsLoading(false);
        return;
      }

      // 🆕 DECODE JWT TOKEN TO GET USER ID
      console.log("Decoding JWT token to extract userId...");
      const decodedToken = decodeJWT(token);

      if (!decodedToken) {
        console.error("Failed to decode JWT token");
        Alert.alert("Login Error", "Invalid token format. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log("🔍 Decoded token payload:", {
        id: decodedToken.id,
        sub: decodedToken.sub,
        email:
          decodedToken[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
          ],
        name: decodedToken[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ],
        role: decodedToken[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ],
      });

      // Extract userId from decoded token
      const userId = decodedToken.id;

      if (!userId) {
        console.error("No user ID found in token");
        Alert.alert(
          "Login Error",
          "User ID not found in authentication token."
        );
        setIsLoading(false);
        return;
      }

      console.log("Extracted auth data:", {
        token: `Found (${token.substring(0, 20)}...)`,
        userId: `Found (${userId})`,
        tokenType: typeof token,
        userIdType: typeof userId,
      });

      // Store auth data
      console.log("Storing auth data...");
      await AsyncStorage.setItem("userId", userId);
      await AsyncStorage.setItem("authToken", token);

      // Verify storage
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedToken = await AsyncStorage.getItem("authToken");

      console.log("Verification - Stored data:", {
        userId: storedUserId
          ? `Stored (${storedUserId})`
          : "Failed to store",
        token: storedToken
          ? `Stored (${storedToken.substring(0, 20)}...)`
          : "Failed to store",
      });

      Alert.alert("Success", "Login successful!", [{ text: "OK" }]);

      setTimeout(() => {
        navigation.replace("HomeTabs");
      }, 2000);
    } catch (error) {
      console.error("Login error:", error);
      console.log("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      let errorMessage = "Login failed. Please check your email or password.";

      if (error.response?.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (error.response?.status === 404) {
        errorMessage = "Account does not exist.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Login Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      handleGoogleAuthSuccess(authentication.accessToken);
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google login error:", error);
      Alert.alert("Google Login Error", "Google login failed", [
        { text: "OK" },
      ]);
    }
  };

  const handleGoogleAuthSuccess = async (accessToken) => {
    setIsLoading(true);
    try {
      const response = await fetch("YOUR_API_ENDPOINT/google-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("authToken", data.token);
        Alert.alert("Success", "Google authentication successful!", [
          { text: "OK" },
        ]);
        setTimeout(() => {
          navigation.replace("HomeTabs");
        }, 2000);
      } else {
        Alert.alert(
          "Google Authentication Error",
          data.message || "Google authentication failed",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Google auth error:", error);
      Alert.alert(
        "Google Authentication Error",
        "Google authentication failed",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleInputFocus = (inputRef) => {
    if (scrollViewRef.current && inputRef.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        const keyboardGap = 10;
        const offset = pageY + height + keyboardGap - keyboardHeight / 2;
        scrollViewRef.current.scrollTo({ y: offset, animated: true });
      });
    }
  };

  return (
    <LinearGradient
      colors={["#1E40AF", "#10B981"]}
      style={styles.gradientBackground}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={[styles.shape, styles.shape1]} />
            <View style={[styles.shape, styles.shape2]} />
            <View style={[styles.shape, styles.shape3]} />
            <Animatable.View
              animation={{
                from: { opacity: 0, translateX: -30 },
                to: { opacity: 1, translateX: 0 },
              }}
              duration={800}
              easing="ease-out"
              style={styles.branding}
            >
              <Svg width={80} height={80} viewBox="0 0 64 64">
                <Circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="rgba(255, 255, 255, 0.1)"
                />
                <Circle
                  cx="32"
                  cy="32"
                  r="20"
                  fill="#FFD6E7"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                <Circle cx="26" cy="28" r="3" fill="#333" />
                <Circle cx="38" cy="28" r="3" fill="#333" />
                <Circle
                  cx="22"
                  cy="32"
                  r="2.5"
                  fill="#FFB6C1"
                  fillOpacity={0.8}
                />
                <Circle
                  cx="42"
                  cy="32"
                  r="2.5"
                  fill="#FFB6C1"
                  fillOpacity={0.8}
                />
                <Path
                  d="M26 38 Q32 42 38 38"
                  stroke="#333"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d="M32 12 Q34 8 36 12"
                  stroke="#333"
                  strokeWidth={1.5}
                  fill="none"
                />
              </Svg>
              <Text style={styles.title}>Welcome to the Community</Text>
              <Text style={styles.description}>
                Log in to track your pregnancy journey, receive professional
                health advice, and connect with a community of mothers.
              </Text>
              <Text style={styles.quote}>
                "Making the journey of motherhood easier with our support!"
              </Text>
            </Animatable.View>
            <View style={styles.formContainer}>
              <Animatable.View
                animation={{
                  from: { opacity: 0, scale: 0.95, translateY: 20 },
                  to: { opacity: 1, scale: 1, translateY: 0 },
                }}
                duration={800}
                easing="ease-out"
                style={styles.formInnerContainer}
              >
                <Text style={styles.formTitle}>Sign In</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    ref={emailInputRef}
                    style={[
                      styles.input,
                      errors.email ? styles.inputError : null,
                    ]}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => handleInputFocus(emailInputRef)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#4B5563"
                  />
                  {errors.email ? (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  ) : null}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      ref={passwordInputRef}
                      style={[
                        styles.input,
                        errors.password ? styles.inputError : null,
                      ]}
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => handleInputFocus(passwordInputRef)}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#4B5563"
                    />
                    <TouchableOpacity
                      onPress={toggleShowPassword}
                      style={styles.passwordToggle}
                    >
                      <Feather
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                        color="#4B5563"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[
                    styles.signInButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#1E40AF", "#10B981"]}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Logging in..." : "Sign In"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleGoogleLogin}
                  disabled={isLoading || !request}
                >
                  <Image
                    source={{
                      uri: "https://img.icons8.com/color/48/000000/google-logo.png",
                    }}
                    style={styles.googleLogo}
                  />
                  <Text style={styles.googleButtonText}>
                    {isLoading ? "Signing in..." : "Sign In With Google"}
                  </Text>
                </TouchableOpacity>
                <View style={styles.linksContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword")}
                  >
                    <Text style={styles.linkText}>Forgot Password?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Register")}
                  >
                    <Text style={styles.linkText}>Create a New Account</Text>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: "100%",
  },
  container: {
    width: "100%",
    maxWidth: 800,
    alignItems: "center",
  },
  shape: {
    position: "absolute",
    backgroundColor: "rgba(30, 64, 175, 0.3)",
    borderRadius: 9999,
  },
  shape1: {
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    opacity: 0.5,
  },
  shape2: {
    top: "20%",
    right: -25,
    width: 125,
    height: 125,
    opacity: 0.5,
  },
  shape3: {
    bottom: -75,
    left: 50,
    width: 100,
    height: 100,
    opacity: 0.5,
  },
  branding: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 15,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: "capitalize",
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 24,
    fontWeight: "400",
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quote: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.9,
    fontWeight: "300",
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  formContainer: {
    width: "100%",
    maxWidth: 320,
  },
  formInnerContainer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 8,
  },
  input: {
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    width: "100%",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  passwordWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  passwordToggle: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
  },
  signInButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  buttonGradient: {
    padding: 14,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontSize: 14,
    color: "#4B5563",
    paddingHorizontal: 10,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  googleLogo: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  linksContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "600",
    marginVertical: 5,
  },
});

export default LoginScreen;
