import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence,
  onAuthStateChanged,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAu_esBl215EHVDMsnQEk-mo_sWpaW-8nU",
  authDomain: "onlinecalendar-85d77.firebaseapp.com",
  projectId: "onlinecalendar-85d77",
  storageBucket: "onlinecalendar-85d77.firebasestorage.app",
  messagingSenderId: "1003454777042",
  appId: "1:1003454777042:web:379c775e4e9fea64934f0b",
  measurementId: "G-LNTHQ5NBFL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set authentication persistence to session
setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error("Firebase persistence error:", error);
  });

// Check if Firestore users collection exists and create it if needed
const initializeFirestore = async () => {
  try {
    // Try to get a sample user document to check if collection exists
    const testQuery = query(collection(db, "users"), where("role", "==", "admin"));
    await getDocs(testQuery);
    console.log("Firestore users collection is ready");
    return true;
  } catch (error) {
    console.log("Initializing Firestore connection:", error.message);
    // Don't treat this as an error since it might be first-time setup
    // or security rules not allowing unauthenticated queries
    return false;
  }
};

// Initialize Firestore on app load
initializeFirestore();

// Check user authentication status and Firestore profile with enhanced error handling
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            // Combine auth user with Firestore data
            const userData = userDoc.data();
            console.log("User data retrieved from Firestore:", userData);
            
            // Update last login timestamp
            try {
              await updateDoc(doc(db, "users", user.uid), {
                lastLogin: new Date().toISOString()
              });
            } catch (updateError) {
              console.warn("Could not update last login time:", updateError);
            }
            
            resolve({
              ...user,
              ...userData
            });
          } else {
            console.warn("User exists in Auth but not in Firestore. Creating Firestore record...");
            
            // Auto-create missing user document in Firestore
            try {
              const basicUserData = {
                email: user.email,
                role: "unknown", // Default role
                emailVerified: user.emailVerified,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                approved: false // Default to unapproved
              };
              
              await setDoc(doc(db, "users", user.uid), basicUserData);
              console.log("Created missing user document in Firestore");
              
              resolve({
                ...user,
                ...basicUserData
              });
            } catch (createError) {
              console.error("Failed to create missing user document:", createError);
              resolve(user);
            }
          }
        } catch (error) {
          console.error("Error getting user profile:", error);
          resolve(user);
        }
      } else {
        resolve(null);
      }
    }, reject);
  });
};

// Sign out user
const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, message: "Logged out successfully" };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error: error.message };
  }
};

// Helper function to resend verification email
const resendVerificationEmail = async (user) => {
  if (user && !user.emailVerified) {
    return sendEmailVerification(user);
  }
  throw new Error("User is already verified or not available");
};

// Update user profile in Firestore with better error handling
const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, "users", userId);
    
    // First check if the document exists
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } else {
      // Create the document if it doesn't exist
      await setDoc(userRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Check if email exists in the system with improved error handling
const checkEmailExists = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking email:", error);
    // Return false instead of throwing to prevent app crashes
    return false;
  }
};

// Count users by role with improved error handling
const countUsersByRole = async (role) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error counting users by role:", error);
    // Return 0 instead of throwing
    return 0;
  }
};

// Check admin registration status - improved with better error handling
const checkAdminRegistrationStatus = async (email) => {
  try {
    // Check if this specific email is already registered
    const emailCheckQ = query(
      collection(db, "users"), 
      where("email", "==", email)
    );
    const emailQuerySnapshot = await getDocs(emailCheckQ);
    
    // If this admin is already registered (regardless of role), prevent duplicate registration
    if (!emailQuerySnapshot.empty) {
      return { 
        canRegister: false, 
        message: "This email address is already registered in the system" 
      };
    }
    
    // Get all admin users
    const adminQ = query(collection(db, "users"), where("role", "==", "admin"));
    const adminSnapshot = await getDocs(adminQ);
    const adminCount = adminSnapshot.size;
    
    // If we have fewer than 2 admins, allow registration
    if (adminCount < 2) {
      return { canRegister: true, message: "" };
    }
    
    // If we already have 2 admins, no more can register
    return { 
      canRegister: false, 
      message: "Maximum number of administrators (2) has been reached. Please contact system support." 
    };
  } catch (error) {
    console.error("Error checking admin registration status:", error);
    // In case of error, allow registration and handle in next steps
    return { canRegister: true, message: "Could not verify administrator limits. Proceeding with registration." };
  }
};

// Check if course has a class rep
const checkCourseHasRep = async (course) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef, 
      where("role", "==", "class_rep"),
      where("course", "==", course)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking course rep:", error);
    // Return false instead of throwing
    return false;
  }
};

// Email validation functions
const isValidLecturerEmail = (email) => {
  return email.endsWith('@tum.ac.ke') && !email.includes('@students.tum.ac.ke');
};

const isValidStudentEmail = (email, course) => {
  if (!course) return false;
  
  // Match format: COURSECODE/NUMBER/YEAR@students.tum.ac.ke
  const studentEmailRegex = new RegExp(`^${course}\\/[0-9]+[A-Z]?\\/[0-9]{4}@students\\.tum\\.ac\\.ke$`, 'i');
  return studentEmailRegex.test(email);
};

// Check admin count with improved error handling
const getAdminCount = async () => {
  try {
    const adminQuery = query(
      collection(db, "users"),
      where("role", "==", "admin")
    );
    const adminSnapshot = await getDocs(adminQuery);
    return adminSnapshot.size;
  } catch (error) {
    console.error("Error checking admin count:", error);
    return 0;
  }
};

// Check if class rep exists for a specific course
const checkClassRepExists = async (course) => {
  try {
    const classRepQuery = query(
      collection(db, "users"),
      where("role", "==", "class_rep"),
      where("course", "==", course)
    );
    const classRepSnapshot = await getDocs(classRepQuery);
    return classRepSnapshot.size > 0;
  } catch (error) {
    console.error("Error checking class rep:", error);
    return false;
  }
};

// Validate email format based on role
const validateEmailByRole = async (email, role, department, course) => {
  try {
    if (!email || !role) {
      return { 
        valid: false, 
        error: "Email and role are required" 
      };
    }

    const adminCount = await getAdminCount();

    switch (role) {
      case 'admin':
        // Admin validation - check only admin count limit
        if (adminCount >= 2) {
          return { 
            valid: false, 
            error: "Maximum number of administrators (2) already registered" 
          };
        }
        return { valid: true, error: "" };
          
      case 'lecturer':
        // Lecturer validation - must have university email
        const lecturerPattern = /^[a-zA-Z0-9._%+-]+@tum\.ac\.ke$/;
        if (lecturerPattern.test(email)) {
          return { valid: true, error: "" };
        } else {
          return {
            valid: false,
            error: "Lecturer email must be a valid university email (e.g., janedoe@tum.ac.ke)"
          };
        }
          
      case 'class_rep':
        // Class Rep validation
        if (!department || !course) {
          return {
            valid: false,
            error: "Please select both department and course first"
          };
        }
          
        const classRepExists = await checkClassRepExists(course);
        if (classRepExists) {
          return {
            valid: false,
            error: `A class representative for ${course} already exists`
          };
        }
          
        // Check email format: COURSECODE/NUMBER/YEAR@students.tum.ac.ke
        const classRepPattern = new RegExp(`^${course}\\/[0-9]+[A-Z]?\\/[0-9]{4}@students\\.tum\\.ac\\.ke$`, 'i');
        if (classRepPattern.test(email)) {
          return { valid: true, error: "" };
        } else {
          return {
            valid: false,
            error: `Class rep email must follow the format: ${course}/STUDENTNUMBER/YEAR@students.tum.ac.ke`
          };
        }
          
      default:
        return { valid: false, error: "Invalid role selected" };
    }
  } catch (error) {
    console.error("Error validating email:", error);
    return { valid: false, error: "Error validating email. Please try again." };
  }
};

// Create new user account with improved error handling and Firestore integration
const createNewUser = async (email, password, role, department, course) => {
  try {
    // First check if the user already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return {
        success: false,
        message: "This email is already registered. Please use a different email or login."
      };
    }
    
    // For admin role, check if we've reached the limit
    if (role === 'admin') {
      const adminStatus = await checkAdminRegistrationStatus(email);
      if (!adminStatus.canRegister) {
        return {
          success: false,
          message: adminStatus.message
        };
      }
    }
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created in Authentication:", userCredential.user.uid);
    
    // Prepare user data for Firestore
    const userData = {
      email: userCredential.user.email,
      role: role,
      emailVerified: userCredential.user.emailVerified,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      approved: role === 'admin', // Automatically approve admins
      // Add role-specific fields
      ...(role === 'class_rep' && {
        department: department,
        course: course,
      }),
      ...(role === 'lecturer' && {
        department: department,
      })
    };
    
    // Save user data to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), userData);
    console.log("User data saved to Firestore");
    
    return {
      success: true,
      message: role === 'admin' 
        ? "Admin account created successfully! You may now log in." 
        : "Account created! Awaiting admin approval. You'll be notified once approved.",
      user: userCredential.user
    };
  } catch (error) {
    console.error("Error creating new user:", error);
    let errorMessage = error.message;
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "This email is already registered. Please use a different email or login.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Invalid email format. Please check and try again.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Password is too weak. Please use a stronger password.";
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error
    };
  }
};

// New function to sign in users with enhanced error handling
const signInUser = async (email, password) => {
  try {
    // Attempt to sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User authenticated successfully:", userCredential.user.uid);
    
    // Get the user's Firestore profile
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      console.warn("User not found in Firestore. Creating profile...");
      
      // Create a basic profile if it doesn't exist
      const basicProfile = {
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
        role: "unknown",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        approved: false
      };
      
      await setDoc(doc(db, "users", userCredential.user.uid), basicProfile);
      
      return {
        success: true,
        message: "Logged in successfully, but profile is incomplete. Please contact an administrator.",
        user: {
          ...userCredential.user,
          ...basicProfile
        }
      };
    }
    
    // Get the user data
    const userData = userDoc.data();
    
    // Update last login timestamp
    await updateDoc(doc(db, "users", userCredential.user.uid), {
      lastLogin: new Date().toISOString()
    });
    
    // Check if user is approved (all admins are auto-approved)
    if (!userData.approved && userData.role !== 'admin') {
      return {
        success: false,
        message: "Your account is pending approval. Please check back later or contact an administrator.",
        user: null
      };
    }
    
    return {
      success: true,
      message: "Logged in successfully!",
      user: {
        ...userCredential.user,
        ...userData
      }
    };
  } catch (error) {
    console.error("Login error:", error);
    
    let errorMessage;
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = "Invalid email or password. Please try again.";
        break;
      case 'auth/too-many-requests':
        errorMessage = "Too many unsuccessful login attempts. Please try again later or reset your password.";
        break;
      case 'auth/user-disabled':
        errorMessage = "This account has been disabled. Please contact an administrator.";
        break;
      default:
        errorMessage = "Failed to login. Please try again.";
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error
    };
  }
};

// Create a collection if it doesn't exist
const ensureCollectionExists = async (collectionName) => {
  try {
    // Add a dummy document and then delete it to ensure collection exists
    const docRef = doc(collection(db, collectionName), 'dummy');
    await setDoc(docRef, { dummy: true });
    // No need to delete - collections with no documents still exist
    return true;
  } catch (error) {
    console.error(`Error ensuring ${collectionName} collection exists:`, error);
    return false;
  }
};

// NEW FUNCTIONS FOR DASHBOARD DATA SHARING BETWEEN ROLES

// Get timetable entries for a lecturer based on their email
const getLecturerTimetable = async (lecturerEmail) => {
  try {
    if (!lecturerEmail) {
      console.error("Lecturer email is required");
      return [];
    }
    
    const timetableRef = collection(db, "timetable");
    const q = query(timetableRef, where("lecturerEmail", "==", lecturerEmail));
    const querySnapshot = await getDocs(q);
    
    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return classes;
  } catch (error) {
    console.error("Error fetching lecturer timetable:", error);
    return [];
  }
};

// Get timetable entries for a course
const getCourseTimetable = async (course) => {
  try {
    if (!course) {
      console.error("Course code is required");
      return [];
    }
    
    const timetableRef = collection(db, "timetable");
    const q = query(timetableRef, where("course", "==", course));
    const querySnapshot = await getDocs(q);
    
    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return classes;
  } catch (error) {
    console.error("Error fetching course timetable:", error);
    return [];
  }
};

// Get timetable entries for a department
const getDepartmentTimetable = async (department) => {
  try {
    if (!department) {
      console.error("Department is required");
      return [];
    }
    
    const timetableRef = collection(db, "timetable");
    const q = query(timetableRef, where("department", "==", department));
    const querySnapshot = await getDocs(q);
    
    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return classes;
  } catch (error) {
    console.error("Error fetching department timetable:", error);
    return [];
  }
};

// Subscribe to timetable updates for a lecturer
const subscribeLecturerTimetable = (lecturerEmail, callback) => {
  if (!lecturerEmail) {
    console.error("Lecturer email is required");
    return () => {};
  }
  
  const timetableRef = collection(db, "timetable");
  const q = query(timetableRef, where("lecturerEmail", "==", lecturerEmail));
  
  return onSnapshot(q, (querySnapshot) => {
    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(classes);
  }, (error) => {
    console.error("Error subscribing to lecturer timetable:", error);
    callback([]);
  });
};

// Subscribe to timetable updates for a course
const subscribeCourseTimetable = (course, callback) => {
  if (!course) {
    console.error("Course code is required");
    return () => {};
  }
  
  const timetableRef = collection(db, "timetable");
  const q = query(timetableRef, where("course", "==", course));
  
  return onSnapshot(q, (querySnapshot) => {
    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(classes);
  }, (error) => {
    console.error("Error subscribing to course timetable:", error);
    callback([]);
  });
};

// Get classes for today for any user type
const getTodayClasses = async (userType, userIdentifier) => {
  try {
    if (!userType || !userIdentifier) {
      console.error("User type and identifier are required");
      return [];
    }
    
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    
    let q;
    const timetableRef = collection(db, "timetable");
    
    switch (userType) {
      case 'lecturer':
        // For lecturers, filter by their email
        q = query(
          timetableRef, 
          where("lecturerEmail", "==", userIdentifier),
          where("date", ">=", startOfDay),
          where("date", "<=", endOfDay)
        );
        break;
      case 'class_rep':
        // For class reps, filter by course
        q = query(
          timetableRef, 
          where("course", "==", userIdentifier),
          where("date", ">=", startOfDay),
          where("date", "<=", endOfDay)
        );
        break;
      case 'admin':
        // Admins can see all classes for today
        q = query(
          timetableRef,
          where("date", ">=", startOfDay),
          where("date", "<=", endOfDay)
        );
        break;
      default:
        return [];
    }
    
    const querySnapshot = await getDocs(q);
    
    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return classes;
  } catch (error) {
    console.error("Error fetching today's classes:", error);
    return [];
  }
};

// Add a new class to the timetable
const addClassToTimetable = async (classData) => {
  try {
    if (!classData) {
      return { success: false, message: "Class data is required" };
    }
    
    // Ensure required fields are present
    const requiredFields = ["course", "lecturerEmail", "date", "startTime", "endTime", "room"];
    for (const field of requiredFields) {
      if (!classData[field]) {
        return { success: false, message: `${field} is required` };
      }
    }
    
    // Add additional metadata
    const finalClassData = {
      ...classData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to Firestore
    const timetableRef = collection(db, "timetable");
    const docRef = await setDoc(doc(timetableRef), finalClassData);
    
    return { success: true, message: "Class added successfully", id: docRef.id };
  } catch (error) {
    console.error("Error adding class to timetable:", error);
    return { success: false, message: error.message };
  }
};

// Get all classes for the upcoming week
const getUpcomingWeekClasses = async (userType, userIdentifier) => {
  try {
    if (!userType || !userIdentifier) {
      console.error("User type and identifier are required");
      return [];
    }
    
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const endOfWeekString = new Date(endOfWeek.setHours(23, 59, 59, 999)).toISOString();
    
    let q;
    const timetableRef = collection(db, "timetable");
    
    switch (userType) {
      case 'lecturer':
        // For lecturers, filter by their email
        q = query(
          timetableRef, 
          where("lecturerEmail", "==", userIdentifier),
          where("date", ">=", startOfDay),
          where("date", "<=", endOfWeekString)
        );
        break;
      case 'class_rep':
        // For class reps, filter by course
        q = query(
          timetableRef, 
          where("course", "==", userIdentifier),
          where("date", ">=", startOfDay),
          where("date", "<=", endOfWeekString)
        );
        break;
      case 'admin':
        // Admins can see all classes for the week
        q = query(
          timetableRef,
          where("date", ">=", startOfDay),
          where("date", "<=", endOfWeekString)
        );
        break;
      default:
        return [];
    }
    
    const querySnapshot = await getDocs(q);
    
    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return classes;
  } catch (error) {
    console.error("Error fetching upcoming week's classes:", error);
    return [];
  }
};

export {
  app,
  auth,
  db,
  getCurrentUser,
  signOutUser,
  resendVerificationEmail,
  updateUserProfile,
  checkEmailExists,
  countUsersByRole,
  checkCourseHasRep,
  checkAdminRegistrationStatus,
  isValidLecturerEmail,
  isValidStudentEmail,
  getAdminCount,
  checkClassRepExists,
  validateEmailByRole,
  createNewUser,
  signInUser,
  ensureCollectionExists,
  // Export new functions
  getLecturerTimetable,
  getCourseTimetable,
  getDepartmentTimetable,
  subscribeLecturerTimetable,
  subscribeCourseTimetable,
  getTodayClasses,
  addClassToTimetable,
  getUpcomingWeekClasses
};